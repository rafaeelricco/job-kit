#!/usr/bin/env bash
# Remove job-profile-init skill symlink from coding-agent skills only.
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
Uninstall job-kit job-profile-init from coding agents (Claude primary).

Usage: uninstall.sh [options]

Options:
  -h, --help  Show this help

Environment:
  CLAUDE_SKILLS  Absolute skills directory (default: ~/.claude/skills)

Removes only kit-owned symlinks for skill/job-profile-init and legacy
name profile-init. Never touches Aside skills,
profile checkouts, or ~/.config/profile-root.
EOF
}

# main
# Parses args and unlinks kit-owned skill symlinks under agent skills.
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
  dest_root="$(resolve_claude_skills)"

  echo "== job-kit agents uninstall for ${dest_root} =="
  unlink_legacy_skills "${dest_root}" "${repo}" || return 1
  for name in ${SKILL_NAMES}; do
    dest="$(skill_dest "${dest_root}" "${name}")"
    unlink_skill "${dest}" "${repo}" "${name}"
  done
  echo "Uninstall completed for ${dest_root}"
}

main "$@"
