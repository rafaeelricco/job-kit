#!/usr/bin/env bash
# Install job-kit skills into Aside user skills (symlinks).
# Compatible with macOS Bash 3.2. Local checkout only; no clone.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=lib.sh
. "${SCRIPT_DIR}/lib.sh"

# usage
# Prints CLI help to stdout.
# Side effects: none.
usage() {
  cat <<'EOF'
Install job-kit skills into Aside (user skills only).

Usage: install.sh [options]

Options:
      --force   Replace foreign files/dirs/links at the destination
  -h, --help    Show this help

Environment:
  ASIDE_SKILLS_USER  Absolute Aside skills/user directory
  ASIDE_ACCOUNT      Account id under ~/.aside/u/ (default: 0)

Links skill/{job-scout,application-stage,profile-init} into the Aside
user-skills directory. Local checkout only; no clone.
EOF
}

# main
# Parses args, resolves paths, links each skill into Aside.
# Side effects: may create skills/user leaf; may write symlinks.
main() {
  local force=0 repo dest_root name source dest
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --force) force=1 ;;
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
  ensure_aside_skills_user "${dest_root}"

  echo "== job-kit Aside install from ${repo} =="
  for name in ${SKILL_NAMES}; do
    source="$(skill_source "${repo}" "${name}")"
    dest="$(skill_dest "${dest_root}" "${name}")"
    link_skill "${source}" "${dest}" "${force}"
  done
  # Only after every new skill links: remove pre-rename kit basenames for this checkout.
  unlink_legacy_skills "${dest_root}" "${repo}" || return 1
  echo "Install completed -> ${dest_root}"
}

main "$@"
