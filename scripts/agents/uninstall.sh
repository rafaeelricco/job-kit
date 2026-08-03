#!/usr/bin/env bash
# Remove job-profile-init skill symlink from Claude / Codex / Grok skills only.
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
Uninstall job-kit job-profile-init from coding agents (Claude, Codex, Grok).

Usage: uninstall.sh [options]

Options:
      --skip-claude  Skip Claude Code (~/.claude/skills)
      --skip-codex   Skip Codex (~/.agents/skills)
      --skip-grok    Skip Grok (~/.grok/skills)
  -h, --help  Show this help

Environment:
  CLAUDE_SKILLS  Absolute skills directory — single dest only (escape hatch).
                 When set, skip flags are ignored.

Removes only kit-owned symlinks for skill/job-profile-init and legacy
name profile-init. Never touches Aside skills,
profile checkouts, or ~/.config/profile-root.
EOF
}

# main
# Parses args and unlinks kit-owned skill symlinks under agent skills.
# Side effects: may remove verified kit symlinks only.
main() {
  local skip_claude=0 skip_codex=0 skip_grok=0
  local repo override dest_root target parent label
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --skip-claude) skip_claude=1 ;;
      --skip-codex) skip_codex=1 ;;
      --skip-grok) skip_grok=1 ;;
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
  override="$(resolve_override_skills)" || return 1

  echo "== job-kit agents uninstall =="

  if [ -n "${override}" ]; then
    echo "== override (${override}) =="
    uninstall_skills_from "${override}" "${repo}" || return 1
    echo "Uninstall completed for ${override}"
    return 0
  fi

  for target in ${AGENT_TARGETS}; do
    case "${target}" in
      claude) [ "${skip_claude}" -eq 1 ] && { echo "Claude Code: skipped (--skip-claude)."; continue; } ;;
      codex)  [ "${skip_codex}" -eq 1 ] && { echo "Codex: skipped (--skip-codex)."; continue; } ;;
      grok)   [ "${skip_grok}" -eq 1 ] && { echo "Grok: skipped (--skip-grok)."; continue; } ;;
    esac
    parent="$(agent_parent_dir "${target}")"
    dest_root="$(agent_skills_root "${target}")"
    label="$(agent_label "${target}")"
    if [ ! -d "${parent}" ] && [ ! -d "${dest_root}" ]; then
      echo "${label}: nothing to uninstall (${dest_root})."
      continue
    fi
    echo "== ${label} (${dest_root}) =="
    uninstall_skills_from "${dest_root}" "${repo}" || return 1
  done

  remove_legacy_codex_skills_dir "${repo}" || return 1
  echo "Uninstall completed"
}

main "$@"
