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

main() {
  local assume_yes=0 answer current current_canon pointer mirror
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
  if [ ! -f "${pointer}" ]; then
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

  if [ "${assume_yes}" -eq 0 ]; then
    if [ ! -t 0 ] && [ ! -r /dev/tty ]; then
      echo "error: noninteractive uninstall requires --yes" >&2
      exit 2
    fi
    printf 'Remove %s? Type UNREGISTER to continue: ' "${pointer}"
    if [ -r /dev/tty ]; then
      IFS= read -r answer < /dev/tty || answer=""
    else
      IFS= read -r answer || answer=""
    fi
    if [ "${answer}" != "UNREGISTER" ]; then
      echo "Cancelled; no changes."
      exit 0
    fi
  fi

  rm -f "${pointer}"
  echo "removed ${pointer}"
  mirror="${HOST_HOME}/.aside/runtime/home/.config/profile-root"
  if [ -f "${mirror}" ] && [ "$(tr -d '\n' < "${mirror}")" = "${REPO}" ]; then
    rm -f "${mirror}"
    echo "removed ${mirror}"
  fi
  echo "Profile checkout preserved at ${REPO}"
}

main "$@"
