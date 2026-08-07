#!/usr/bin/env bash
# Clear Profile root registration if it points at this checkout.
set -euo pipefail

usage() {
  cat <<'EOF'
Unregister this profile as Profile root (if currently active).

Usage: uninstall.sh [options]

Options:
  -y, --yes   Skip confirmation.
  -h, --help  Show this help.

Convention-probed checkouts stay active while probe files remain:
  - $HOST_HOME/.config/job-kit (always probed; Aside often has no XDG)
  - $XDG_CONFIG_HOME/job-kit when XDG_CONFIG_HOME is set in this shell
This script only clears pointer files; it cannot deactivate those paths and
exits non-zero. Move or remove the tree, or activate another profile with that
checkout's install.sh --yes.
EOF
}

resolve_host_home() {
  # Inside Aside, HOME is <host>/.aside/runtime/home. Strip that suffix so the
  # host pointer is read from the real user home, matching install.sh.
  local suffix="/.aside/runtime/home"
  case "${HOME}" in
    *"${suffix}") printf '%s\n' "${HOME%${suffix}}" ;;
    *) printf '%s\n' "${HOME}" ;;
  esac
}

host_default_root() {
  printf '%s/.config/job-kit\n' "$(resolve_host_home)"
}

job_kit_config() {
  if [ -n "${XDG_CONFIG_HOME:-}" ]; then
    printf '%s/job-kit\n' "${XDG_CONFIG_HOME}"
  else
    host_default_root
  fi
}

paths_equal() {
  local a="$1" b="$2"
  [ "${a}" = "${b}" ] && return 0
  if [ -d "${a}" ] && [ -d "${b}" ]; then
    [ "$(cd "${a}" && pwd -P)" = "$(cd "${b}" && pwd -P)" ]
    return $?
  fi
  return 1
}

# Two-file probe used by skill resolvers.
passes_probe() {
  local root="$1"
  [ -d "${root}" ] || return 1
  [ -f "${root}/data/candidate.yaml" ] && [ -f "${root}/data/job_search.yaml" ]
}

resolve_repo() {
  local script source_dir repo
  script="${BASH_SOURCE[0]}"
  case "${script}" in /*) ;; *) script="$(pwd -P)/${script}" ;; esac
  [ -f "${script}" ] || {
    echo "error: uninstall.sh must be run from this checkout's scripts/uninstall.sh" >&2
    exit 1
  }
  source_dir="$(cd "$(dirname "${script}")" && pwd -P)"
  script="${source_dir}/$(basename "${script}")"
  repo="$(cd "${source_dir}/.." && pwd -P)"
  [ "${script}" = "${repo}/scripts/uninstall.sh" ] || {
    echo "error: uninstall.sh must be run from this checkout's scripts/uninstall.sh" >&2
    exit 1
  }
  printf '%s\n' "${repo}"
}

mirror_matches() {
  # job-scout reads the Aside mirror before the host pointer, so a mirror still
  # naming this checkout keeps resolving it after uninstall.
  [ -f "$1" ] && [ "$(tr -d '\n' < "$1")" = "${REPO}" ]
}

confirm_unregister() {
  local target="$1" answer
  if [ "${assume_yes}" -eq 1 ]; then
    return 0
  fi
  if [ ! -t 0 ] && [ ! -r /dev/tty ]; then
    echo "error: noninteractive uninstall requires --yes" >&2
    exit 2
  fi
  printf 'Remove %s? Type UNREGISTER to continue: ' "${target}"
  if [ -r /dev/tty ]; then
    IFS= read -r answer < /dev/tty || answer=""
  else
    IFS= read -r answer || answer=""
  fi
  if [ "${answer}" != "UNREGISTER" ]; then
    echo "Cancelled; no changes."
    exit 0
  fi
}

main() {
  local current current_canon pointer mirror CONVENTION_ROOT HOST_DEFAULT
  local is_convention=0
  assume_yes=0
  while [ "$#" -gt 0 ]; do
    case "$1" in
      -y|--yes) assume_yes=1 ;;
      -h|--help) usage; exit 0 ;;
      *) echo "error: unknown option: $1" >&2; usage >&2; exit 2 ;;
    esac
    shift
  done

  REPO="$(resolve_repo)"
  HOST_HOME="$(resolve_host_home)"
  pointer="${HOST_HOME}/.config/profile-root"
  mirror="${HOST_HOME}/.aside/runtime/home/.config/profile-root"
  HOST_DEFAULT="$(host_default_root)"
  CONVENTION_ROOT="$(job_kit_config)"

  # Host-default is always skill-probed (Aside without XDG included). This-env
  # JOB_KIT_CONFIG is also convention-probed. Refuse when either matches.
  if paths_equal "${REPO}" "${HOST_DEFAULT}" || paths_equal "${REPO}" "${CONVENTION_ROOT}"; then
    is_convention=1
  fi
  if [ "${is_convention}" -eq 1 ]; then
    if [ -f "${pointer}" ]; then
      current="$(tr -d '\n' < "${pointer}")"
      if [ -n "${current}" ] && [ -d "${current}" ]; then
        current_canon="$(cd "${current}" && pwd -P)"
      else
        current_canon=""
      fi
      if [ -n "${current}" ] && [ "${current_canon}" != "${REPO}" ] && passes_probe "${current}"; then
        echo "not active: convention path ${REPO}; active pointer profile: ${current}"
        echo "Profile checkout preserved at ${REPO}"
        exit 0
      fi
    fi
    echo "error: profile is active by path convention at ${REPO}" >&2
    echo "  uninstall only clears pointer files; probe files still resolve as Profile root" >&2
    echo "  (host-default is always probed; XDG JOB_KIT_CONFIG is probed in this env)" >&2
    echo "  move or remove the tree, or activate another profile with that checkout's install.sh --yes" >&2
    exit 1
  fi

  if [ ! -f "${pointer}" ]; then
    if mirror_matches "${mirror}"; then
      confirm_unregister "${mirror}"
      rm -f "${mirror}"
      echo "removed ${mirror}"
      echo "Profile checkout preserved at ${REPO}"
      exit 0
    fi
    echo "already unregistered: no ${pointer}"
    exit 0
  fi
  current="$(tr -d '\n' < "${pointer}")"
  if [ -n "${current}" ] && [ -d "${current}" ]; then
    current_canon="$(cd "${current}" && pwd -P)"
  else
    current_canon=""
  fi
  if [ "${current_canon}" != "${REPO}" ]; then
    echo "error: profile-root points elsewhere: ${current}" >&2
    echo "  this checkout: ${REPO}" >&2
    exit 1
  fi

  confirm_unregister "${pointer}"

  rm -f "${pointer}"
  echo "removed ${pointer}"
  if mirror_matches "${mirror}"; then
    rm -f "${mirror}"
    echo "removed ${mirror}"
  fi
  echo "Profile checkout preserved at ${REPO}"
}

main "$@"
