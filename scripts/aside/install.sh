#!/usr/bin/env bash
# Install job-kit skills into Aside builtin skills (full copy).
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
Install job-kit Aside-channel skills into skills/builtin (copy, not symlink).

Usage: install.sh [options]

Options:
      --force   Replace foreign files/dirs/links at the destination
  -h, --help    Show this help

Environment:
  ASIDE_SKILLS       Absolute Aside skills directory (default …/skills/builtin)
  ASIDE_SKILLS_USER  Legacy alias for ASIDE_SKILLS
  ASIDE_ACCOUNT      Account id under ~/.aside/u/ (default: 0)

Copies skill/{job-scout,job-application} into the Aside
builtin-skills directory. Local checkout only; no clone.
EOF
}

# main
# Parses args, resolves paths, copies each skill into Aside builtin.
# Side effects: may create skills/builtin leaf; may write skill trees + markers.
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
  dest_root="$(resolve_aside_skills_root)"
  ensure_aside_skills_root "${dest_root}"

  echo "== job-kit Aside install from ${repo} =="
  for name in ${SKILL_NAMES}; do
    source="$(skill_source "${repo}" "${name}")"
    dest="$(skill_dest "${dest_root}" "${name}")"
    copy_skill "${source}" "${dest}" "${force}" "${repo}"
  done
  # Only after every new skill copies: remove pre-rename kit basenames for this checkout.
  unlink_legacy_skills "${dest_root}" "${repo}" || return 1
  remove_legacy_user_skills "${repo}" "${dest_root}" || return 1
  echo "Install completed -> ${dest_root}"
}

main "$@"
