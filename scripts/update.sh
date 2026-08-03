#!/usr/bin/env bash
# Update managed job-kit clone (or re-link local install).
set -euo pipefail

CLONE_URL_HOST="rafaeelricco/job-kit"
DEFAULT_DIR="${HOME}/.job-kit"

usage() {
  cat <<'EOF'
Update job-kit.

Usage: update.sh [options]

Options:
  -y, --yes         Back up conflicts without prompting (forwarded to install).
      --override    Override conflicts without backup (forwarded).
      --local       Re-link from this checkout only (no git changes).
      --dir PATH    Managed clone path (default: ~/.job-kit or $JOB_KIT_DIR).
      --link-dir PATH  Forwarded to install (repeatable).
  -h, --help        Show this help.

Managed update fetches GitHub main, hard-resets the clone, cleans untracked
files, then re-runs install. It never modifies profile checkouts.
EOF
}

local_state_file() {
  printf '%s/job-kit/local-install-state\n' "${XDG_STATE_HOME:-${HOME}/.local/state}"
}

resolve_local_repo() {
  local script source_dir repo
  script="${BASH_SOURCE[0]}"
  case "${script}" in /*) ;; *) script="$(pwd -P)/${script}" ;; esac
  [ -f "${script}" ] || {
    echo "error: --local requires running the checked-out scripts/update.sh" >&2
    exit 1
  }
  source_dir="$(cd "$(dirname "${script}")" && pwd -P)"
  script="${source_dir}/$(basename "${script}")"
  repo="$(cd "${source_dir}/.." && pwd -P)"
  [ "${script}" = "${repo}/scripts/update.sh" ] || {
    echo "error: --local requires running the checked-out scripts/update.sh" >&2
    exit 1
  }
  printf '%s\n' "${repo}"
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

assert_managed_repo() {
  local dir="$1" url top
  [ -d "${dir}" ] || { echo "error: managed clone missing: ${dir}" >&2; exit 1; }
  [ -d "${dir}/.git" ] || { echo "error: not a git clone: ${dir}" >&2; exit 1; }
  top="$(git -C "${dir}" rev-parse --show-toplevel 2>/dev/null || true)"
  top="$(cd "${top}" && pwd -P)"
  dir="$(cd "${dir}" && pwd -P)"
  [ "${top}" = "${dir}" ] || { echo "error: path is not repository root: ${dir}" >&2; exit 1; }
  url="$(git -C "${dir}" remote get-url origin 2>/dev/null || true)"
  repo_url_is_allowed "${url}" || {
    echo "error: origin is not the official job-kit URL: ${url}" >&2
    exit 1
  }
}

main() {
  local local_mode=0 dir_arg="" forward=()
  while [ "$#" -gt 0 ]; do
    case "$1" in
      -y|--yes|--override) forward+=("$1") ;;
      --local) local_mode=1 ;;
      --dir)
        shift
        [ "$#" -gt 0 ] || { echo "error: --dir needs PATH" >&2; exit 2; }
        dir_arg="$1"
        forward+=(--dir "$1")
        ;;
      --link-dir)
        shift
        [ "$#" -gt 0 ] || { echo "error: --link-dir needs PATH" >&2; exit 2; }
        forward+=(--link-dir "$1")
        ;;
      -h|--help) usage; exit 0 ;;
      *) echo "error: unknown option: $1" >&2; usage >&2; exit 2 ;;
    esac
    shift
  done

  if [ "${local_mode}" -eq 1 ]; then
    REPO="$(resolve_local_repo)"
    state="$(local_state_file)"
    [ -f "${state}" ] || {
      echo "error: no local installation; run scripts/install.sh --local first" >&2
      exit 1
    }
    bash "${REPO}/scripts/install.sh" --local "${forward[@]+"${forward[@]}"}"
    exit $?
  fi

  MANAGED_DIR="${dir_arg:-${JOB_KIT_DIR:-${DEFAULT_DIR}}}"
  assert_managed_repo "${MANAGED_DIR}"
  echo "== updating managed clone ${MANAGED_DIR} =="
  git -C "${MANAGED_DIR}" fetch --force --prune origin \
    +refs/heads/main:refs/remotes/origin/main
  [ -f "${MANAGED_DIR}/scripts/install.sh" ] || {
    echo "error: origin/main missing scripts/install.sh after fetch path check" >&2
  }
  git -C "${MANAGED_DIR}" checkout --force -B main origin/main
  git -C "${MANAGED_DIR}" reset --hard origin/main
  git -C "${MANAGED_DIR}" clean -ffdx
  bash "${MANAGED_DIR}/scripts/install.sh" --dir "${MANAGED_DIR}" \
    "${forward[@]+"${forward[@]}"}"
  echo "Update completed from ${MANAGED_DIR}"
}

main "$@"
