#!/usr/bin/env bash
# Install job-profile-init into coding-agent user skills (symlink).
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
Install job-kit job-profile-init into coding agents (Claude primary).

Usage: install.sh [options]

Options:
      --force   Replace foreign files/dirs/links at the destination
  -h, --help    Show this help

Environment:
  CLAUDE_SKILLS  Absolute skills directory (default: ~/.claude/skills)
                 Extension for other agents: one dest per run
                 e.g. CLAUDE_SKILLS=~/.codex/skills or ~/.grok/skills

Links skill/job-profile-init into the coding-agent skills directory.
Does not install job-scout or job-application. Local checkout only; no clone.
EOF
}

# main
# Parses args, resolves paths, links job-profile-init into agent skills.
# Side effects: may create skills leaf; may write symlinks.
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
  dest_root="$(resolve_claude_skills)"
  ensure_skills_dir "${dest_root}"

  echo "== job-kit agents install from ${repo} =="
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
