#!/usr/bin/env bash
# Install job-profile-init + job-profile-config into Claude / Codex / Grok
# user skills (symlink).
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
Install job-kit job-profile-init + job-profile-config into coding agents
(Claude, Codex, Grok).

Usage: install.sh [options]

Options:
      --force   Replace foreign files/dirs/links at the destination
      --skip-claude  Skip Claude Code (~/.claude/skills)
      --skip-codex   Skip Codex (~/.agents/skills)
      --skip-grok    Skip Grok (~/.grok/skills)
  -h, --help    Show this help

Environment:
  CLAUDE_SKILLS  Absolute skills directory — single dest only (escape hatch).
                 When set, skip flags are ignored.

Default (no CLAUDE_SKILLS): link into each non-skipped target whose parent
dir already exists:
  claude  ~/.claude/skills   (parent ~/.claude)
  codex   ~/.agents/skills   (parent ~/.agents; not ~/.codex/skills)
  grok    ~/.grok/skills     (parent ~/.grok)

Does not install job-scout or job-application. Local checkout only; no clone.
EOF
}

# main
# Parses args, resolves paths, links job-profile-init into agent skills.
# Side effects: may create skills leaf; may write symlinks.
main() {
  local force=0 skip_claude=0 skip_codex=0 skip_grok=0
  local repo override dest_root target parent label linked=0 attempted=0
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --force) force=1 ;;
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

  echo "== job-kit agents install from ${repo} =="

  if [ -n "${override}" ]; then
    echo "== override (${override}) =="
    install_skills_into "${override}" "${repo}" "${force}" || return 1
    echo "Install completed -> ${override}"
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
    if [ ! -d "${parent}" ]; then
      echo "${label}: parent missing (${parent}); skipping."
      continue
    fi
    attempted=$((attempted + 1))
    echo "== ${label} (${dest_root}) =="
    if install_skills_into "${dest_root}" "${repo}" "${force}"; then
      linked=$((linked + 1))
    else
      return 1
    fi
  done

  # Best-effort cleanup of older wrong Codex path from prior docs.
  remove_legacy_codex_skills_dir "${repo}" || return 1

  if [ "${linked}" -eq 0 ]; then
    echo "error: no agent targets installed (need parent dirs or CLAUDE_SKILLS)" >&2
    echo "  expected one of: ~/.claude  ~/.agents  ~/.grok" >&2
    return 1
  fi
  echo "Install completed (${linked}/${attempted} targets)"
}

main "$@"
