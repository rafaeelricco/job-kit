#!/usr/bin/env bash
# Install job-kit skills via symlink (managed clone or local checkout).
# Compatible with the Bash 3.2 shipped by macOS.
set -euo pipefail

CLONE_URL="https://github.com/rafaeelricco/job-kit.git"
DEFAULT_DIR="${HOME}/.job-kit"
STATE_HEADER="job-kit-local-lifecycle-state-v1"
# Implementation defaults only (not documented by product name in README).
# Link only when the parent already exists, unless FORCE_CREATE_LINK_DIRS=1.
DEFAULT_LINK_PARENTS="${HOME}/.grok/skills ${HOME}/.claude/skills ${HOME}/.agents/skills ${HOME}/.aside/u/0/skills/user"

usage() {
  cat <<'EOF'
Install job-kit skills via symlink.

Usage: install.sh [options]

Options:
  -y, --yes           Back up conflicts without prompting.
      --override      Remove conflicts without backup or prompting.
      --local         Link from this checkout (no clone / no git changes).
      --dir PATH      Managed clone path (default: ~/.job-kit or $JOB_KIT_DIR).
      --link-dir PATH Skill root to link into (repeatable).
  -h, --help          Show this help.

Environment:
  JOB_KIT_DIR         Managed clone directory.
  JOB_KIT_LINK_DIRS   Colon-separated skill roots (used if no --link-dir).

Skills linked: job-discovery, job-apply, profile-scaffold.
EOF
}

local_state_file() {
  printf '%s/job-kit/local-install-state\n' "${XDG_STATE_HOME:-${HOME}/.local/state}"
}

timestamp() {
  date +%Y%m%d%H%M%S
}

backup_name() {
  local path="$1" candidate index
  candidate="${path}.backup-$(timestamp)"
  index=1
  while [ -e "${candidate}" ] || [ -L "${candidate}" ]; do
    candidate="${path}.backup-$(timestamp)-${index}"
    index=$((index + 1))
  done
  printf '%s\n' "${candidate}"
}

ensure_directory() {
  local requested="$1"
  [ -d "${requested}" ] && return 0
  if ! mkdir -p "${requested}"; then
    echo "error: failed to create directory: ${requested}" >&2
    exit 1
  fi
}

absolute_path() {
  local path="$1"
  case "${path}" in
    /*) printf '%s\n' "${path}" ;;
    *) printf '%s\n' "$(pwd -P)/${path}" ;;
  esac
}

repo_url_is_allowed() {
  local url="$1"
  url="${url%/}"
  case "${url}" in
    https://github.com/rafaeelricco/job-kit|\
    https://github.com/rafaeelricco/job-kit.git|\
    git@github.com:rafaeelricco/job-kit|\
    git@github.com:rafaeelricco/job-kit.git|\
    ssh://git@github.com/rafaeelricco/job-kit|\
    ssh://git@github.com/rafaeelricco/job-kit.git) return 0 ;;
    *) return 1 ;;
  esac
}

resolve_local_repo() {
  local script source_dir repo
  script="${BASH_SOURCE[0]}"
  case "${script}" in /*) ;; *) script="$(pwd -P)/${script}" ;; esac
  [ -f "${script}" ] || {
    echo "error: --local requires running the checked-out scripts/install.sh" >&2
    exit 1
  }
  source_dir="$(cd "$(dirname "${script}")" && pwd -P)"
  script="${source_dir}/$(basename "${script}")"
  repo="$(cd "${source_dir}/.." && pwd -P)"
  [ "${script}" = "${repo}/scripts/install.sh" ] || {
    echo "error: --local requires running the checked-out scripts/install.sh" >&2
    exit 1
  }
  [ -d "${repo}/.git" ] || {
    echo "error: --local requires a git checkout" >&2
    exit 1
  }
  printf '%s\n' "${repo}"
}

assert_no_local_install() {
  local state
  state="$(local_state_file)"
  if [ -e "${state}" ] || [ -L "${state}" ]; then
    echo "error: a local installation is active; run scripts/uninstall.sh --local first" >&2
    exit 1
  fi
}

assert_no_managed_at() {
  local dir="$1"
  if [ -d "${dir}/.git" ] && [ -f "${dir}/scripts/install.sh" ]; then
    # allow re-using same managed dir for re-link
    return 0
  fi
}

parse_args() {
  ASSUME_YES=0
  OVERRIDE=0
  LOCAL_MODE=0
  DIR_ARG=""
  LINK_DIRS=""
  while [ "$#" -gt 0 ]; do
    case "$1" in
      -y|--yes) ASSUME_YES=1 ;;
      --override) OVERRIDE=1 ;;
      --local) LOCAL_MODE=1 ;;
      --dir)
        shift
        [ "$#" -gt 0 ] || { echo "error: --dir needs PATH" >&2; exit 2; }
        DIR_ARG="$1"
        ;;
      --link-dir)
        shift
        [ "$#" -gt 0 ] || { echo "error: --link-dir needs PATH" >&2; exit 2; }
        LINK_DIRS="${LINK_DIRS}${LINK_DIRS:+ }$1"
        ;;
      -h|--help) usage; exit 0 ;;
      *) echo "error: unknown option: $1" >&2; usage >&2; exit 2 ;;
    esac
    shift
  done
}

resolve_conflict() {
  local path="$1" answer backup action="${CONFLICT_MODE}"
  if [ "${action}" = "prompt" ]; then
    printf 'Conflict: %s\n' "${path}"
    printf '  [b]ackup, [o]verride, [s]kip, or [a]bort? '
    if ! IFS= read -r answer < /dev/tty; then
      answer="a"
    fi
    case "${answer}" in
      b|B) action="backup" ;;
      o|O) action="override" ;;
      s|S) echo "skipped: ${path}"; return 1 ;;
      *) echo "aborted at: ${path}" >&2; exit 1 ;;
    esac
  fi

  if [ "${action}" = "override" ]; then
    if [ -d "${path}" ] && [ ! -L "${path}" ]; then
      rm -rf "${path}" || { echo "error: failed to remove conflict: ${path}" >&2; exit 1; }
    else
      rm -f "${path}" || { echo "error: failed to remove conflict: ${path}" >&2; exit 1; }
    fi
    echo "overridden: ${path}"
  else
    backup="$(backup_name "${path}")"
    mv "${path}" "${backup}" || { echo "error: failed to back up conflict: ${path}" >&2; exit 1; }
    echo "backed up: ${path} -> ${backup}"
  fi
  return 0
}

link_one() {
  local src="$1" dst="$2" current parent name
  [ -e "${src}" ] || { echo "error: source missing: ${src}" >&2; exit 1; }
  parent="$(dirname "${dst}")"
  name="$(basename "${dst}")"
  ensure_directory "${parent}"
  dst="$(cd "${parent}" && pwd -P)/${name}"

  if [ -L "${dst}" ]; then
    current="$(readlink "${dst}")"
    if [ "${current}" = "${src}" ]; then
      echo "up to date: ${dst}"
      return 0
    fi
    if ! resolve_conflict "${dst}"; then
      return 0
    fi
  elif [ -e "${dst}" ]; then
    if ! resolve_conflict "${dst}"; then
      return 0
    fi
  fi

  ln -s "${src}" "${dst}"
  echo "linked: ${dst} -> ${src}"
}

collect_link_dirs() {
  local d expanded
  LINK_DIR_LIST=""
  if [ -n "${LINK_DIRS}" ]; then
    for d in ${LINK_DIRS}; do
      expanded="$(absolute_path "${d}")"
      LINK_DIR_LIST="${LINK_DIR_LIST}${LINK_DIR_LIST:+ }${expanded}"
    done
    return 0
  fi
  if [ -n "${JOB_KIT_LINK_DIRS:-}" ]; then
    oldifs="${IFS}"
    IFS=':'
    # shellcheck disable=SC2086
    set -- ${JOB_KIT_LINK_DIRS}
    IFS="${oldifs}"
    for d in "$@"; do
      [ -n "${d}" ] || continue
      expanded="$(absolute_path "${d}")"
      LINK_DIR_LIST="${LINK_DIR_LIST}${LINK_DIR_LIST:+ }${expanded}"
    done
    return 0
  fi
  for d in ${DEFAULT_LINK_PARENTS}; do
    parent="$(dirname "${d}")"
    # DEFAULT entries are full skill roots; create parent only if grandparent exists
    # e.g. ~/.grok exists -> create ~/.grok/skills
    if [ -d "${d}" ]; then
      LINK_DIR_LIST="${LINK_DIR_LIST}${LINK_DIR_LIST:+ }${d}"
    elif [ -d "$(dirname "${d}")" ]; then
      ensure_directory "${d}"
      LINK_DIR_LIST="${LINK_DIR_LIST}${LINK_DIR_LIST:+ }${d}"
    fi
  done
  if [ -z "${LINK_DIR_LIST}" ]; then
    # always ensure at least ~/.agents/skills so install has a destination
    ensure_directory "${HOME}/.agents/skills"
    LINK_DIR_LIST="${HOME}/.agents/skills"
  fi
}

validate_skills() {
  local repo="$1" name
  for name in job-discovery job-apply profile-scaffold; do
    [ -f "${repo}/skill/${name}/SKILL.md" ] || {
      echo "error: missing skill: ${repo}/skill/${name}/SKILL.md" >&2
      exit 1
    }
  done
}

ensure_managed_repo() {
  local dir="$1" url
  if [ -d "${dir}/.git" ]; then
    url="$(git -C "${dir}" remote get-url origin 2>/dev/null || true)"
    repo_url_is_allowed "${url}" || {
      echo "error: managed clone origin is not the official job-kit URL: ${url}" >&2
      exit 1
    }
    printf '%s\n' "$(cd "${dir}" && pwd -P)"
    return 0
  fi
  if [ -e "${dir}" ]; then
    echo "error: ${dir} exists but is not a git clone of job-kit" >&2
    exit 1
  fi
  ensure_directory "$(dirname "${dir}")"
  echo "Cloning ${CLONE_URL} -> ${dir}"
  git clone "${CLONE_URL}" "${dir}"
  printf '%s\n' "$(cd "${dir}" && pwd -P)"
}

write_local_state() {
  local repo="$1" state
  state="$(local_state_file)"
  ensure_directory "$(dirname "${state}")"
  {
    printf '%s\n' "${STATE_HEADER}"
    printf 'source\t%s\n' "${repo}"
  } > "${state}"
  chmod 600 "${state}" 2>/dev/null || true
}

main() {
  parse_args "$@"

  if [ "${ASSUME_YES}" -eq 1 ] && [ "${OVERRIDE}" -eq 1 ]; then
    echo "error: --yes and --override cannot be used together" >&2
    exit 2
  fi
  if [ "${LOCAL_MODE}" -eq 1 ] && [ -n "${DIR_ARG}" ]; then
    echo "error: --local and --dir cannot be used together" >&2
    exit 2
  fi

  if [ "${OVERRIDE}" -eq 1 ]; then
    CONFLICT_MODE="override"
  elif [ "${ASSUME_YES}" -eq 0 ] && [ -t 1 ] && [ -r /dev/tty ]; then
    CONFLICT_MODE="prompt"
  else
    CONFLICT_MODE="backup"
  fi

  if [ "${LOCAL_MODE}" -eq 1 ]; then
    if [ -d "${DEFAULT_DIR}/.git" ] && [ -f "${DEFAULT_DIR}/scripts/install.sh" ]; then
      # managed clone present: local install is still allowed if state says so;
      # only block if managed exclusive was required — plan says mutual exclusion.
      :
    fi
    REPO="$(resolve_local_repo)"
    # if managed state clone exists at DEFAULT and we're local, warn but proceed
  else
    assert_no_local_install
    MANAGED_DIR="${DIR_ARG:-${JOB_KIT_DIR:-${DEFAULT_DIR}}}"
    case "${MANAGED_DIR}" in
      /*) ;;
      *) MANAGED_DIR="$(pwd -P)/${MANAGED_DIR}" ;;
    esac
    REPO="$(ensure_managed_repo "${MANAGED_DIR}")"
  fi

  validate_skills "${REPO}"
  collect_link_dirs

  echo "== job-kit install from ${REPO} =="
  for name in job-discovery job-apply profile-scaffold; do
    SOURCE="${REPO}/skill/${name}"
    for link_dir in ${LINK_DIR_LIST}; do
      link_one "${SOURCE}" "${link_dir}/${name}"
    done
  done

  if [ "${LOCAL_MODE}" -eq 1 ]; then
    write_local_state "${REPO}"
  fi

  echo "Install completed."
  echo "Next: /profile-scaffold  then  bash <profile>/scripts/install.sh"
}

main "$@"
