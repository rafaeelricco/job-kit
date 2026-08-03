#!/usr/bin/env bash
# Remove job-kit skill symlinks from Aside user skills only.
# Compatible with macOS Bash 3.2.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=lib.sh
. "${SCRIPT_DIR}/lib.sh"

# usage
# Prints CLI help to stdout.
# Side effects: none.
usage() {
  cat <<'EOF'
Uninstall job-kit skill links from Aside (user skills only).

Usage: uninstall.sh [options]

Options:
  -h, --help  Show this help

Environment:
  ASIDE_SKILLS_USER  Absolute Aside skills/user directory
  ASIDE_ACCOUNT      Account id under ~/.aside/u/ (default: 0)

Removes only symlinks that point at this kit's skill/* trees.
Leaves other Aside skills, profile checkouts, and ~/.config/profile-root alone.
EOF
}

# main
# Parses args and unlinks kit-owned skill symlinks under Aside.
# Side effects: may remove verified kit symlinks only.
main() {
  local repo dest_root name dest
  while [ "$#" -gt 0 ]; do
    case "$1" in
      -h|--help) usage; exit 0 ;;
      *)
        echo "error: unknown option: $1" >&2
        usage >&2
        exit 2
        ;;
    esac
    shift
  done

  repo="$(resolve_repo_root)"
  dest_root="$(resolve_aside_skills_user)"

  echo "== job-kit Aside uninstall for ${dest_root} =="
  unlink_legacy_skills "${dest_root}" "${repo}" || return 1
  for name in ${SKILL_NAMES}; do
    dest="$(skill_dest "${dest_root}" "${name}")"
    unlink_skill "${dest}" "${repo}" "${name}"
  done
  echo "Uninstall completed for ${dest_root}"
}

main "$@"
