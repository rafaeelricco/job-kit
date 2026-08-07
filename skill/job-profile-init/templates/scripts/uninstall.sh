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

Host-default checkouts ($HOST_HOME/.config/job-kit) stay active by path
convention while probe files remain. This script only clears pointer files; it
cannot deactivate a host-default profile and exits non-zero in that case.
Move or remove the tree, or activate another profile with that checkout's
install.sh --yes.
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
  local current current_canon pointer mirror
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
  is_host_default=0
  if [ "${REPO}" = "${HOST_DEFAULT}" ] || {
    [ -d "${HOST_DEFAULT}" ] && [ "$(cd "${HOST_DEFAULT}" && pwd -P)" = "${REPO}" ]
  }; then
    is_host_default=1
  fi
  # Host-default stays active by path convention while probe files remain.
  # Pointer clears alone never unregister it — refuse rather than claim success.
  if [ "${is_host_default}" -eq 1 ]; then
    if [ -f "${pointer}" ]; then
      current="$(tr -d '\n' < "${pointer}")"
      if [ -n "${current}" ] && [ -d "${current}" ]; then
        current_canon="$(cd "${current}" && pwd -P)"
      else
        current_canon=""
      fi
      if [ -n "${current}" ] && [ "${current_canon}" != "${REPO}" ]; then
        echo "not active: host-default ${REPO}; pointer points elsewhere: ${current}"
        echo "Profile checkout preserved at ${REPO}"
        exit 0
      fi
    fi
    echo "error: host-default profile is active by path convention at ${REPO}" >&2
    echo "  uninstall only clears pointer files; probe files still resolve as Profile root" >&2
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
