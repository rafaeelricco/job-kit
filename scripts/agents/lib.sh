#!/usr/bin/env bash
# Shared helpers for coding-agent skill install/uninstall.
# Compatible with macOS Bash 3.2. Source only — do not execute.

# Skill folder names under skill/ for coding agents.
SKILL_NAMES="job-profile-init"
# Prior basenames for this channel; install/uninstall may remove orphans.
# Predicates use is_kit_skill_link (readlink == REPO/skill/NAME); source dir need not exist.
LEGACY_SKILL_NAMES="profile-init"

# AGENT_TARGETS — space-separated ids. Dest map matches personal dotfiles:
#   claude → $HOME/.claude/skills   (parent $HOME/.claude)
#   codex  → $HOME/.agents/skills   (parent $HOME/.agents; not ~/.codex/skills)
#   grok   → $HOME/.grok/skills     (parent $HOME/.grok)
AGENT_TARGETS="claude codex grok"

# resolve_repo_root
# Prints absolute job-kit root (parent of scripts/).
# Args: none. Uses BASH_SOURCE[1] (the script that sourced this file).
# Side effects: none. Prints error and returns 1 if layout is wrong.
resolve_repo_root() {
  local entry entry_dir scripts_dir repo
  entry="${BASH_SOURCE[1]:-}"
  [ -n "${entry}" ] || {
    echo "error: resolve_repo_root must be called from a sourced entry script" >&2
    return 1
  }
  case "${entry}" in
    /*) ;;
    *) entry="$(pwd -P)/${entry}" ;;
  esac
  [ -f "${entry}" ] || {
    echo "error: entry script not found: ${entry}" >&2
    return 1
  }
  entry_dir="$(cd "$(dirname "${entry}")" && pwd -P)"
  scripts_dir="$(cd "${entry_dir}/.." && pwd -P)"
  repo="$(cd "${scripts_dir}/.." && pwd -P)"
  [ -d "${repo}/skill" ] || {
    echo "error: not a job-kit checkout (missing skill/): ${repo}" >&2
    return 1
  }
  [ -d "${repo}/scripts/agents" ] || {
    echo "error: not a job-kit checkout (missing scripts/agents/): ${repo}" >&2
    return 1
  }
  printf '%s\n' "${repo}"
}

# resolve_override_skills
# Prints absolute CLAUDE_SKILLS when set (single-dest escape hatch). Empty if unset.
# Side effects: none. Errors if set but not absolute.
resolve_override_skills() {
  if [ -z "${CLAUDE_SKILLS:-}" ]; then
    return 0
  fi
  case "${CLAUDE_SKILLS}" in
    /*) printf '%s\n' "${CLAUDE_SKILLS}" ;;
    *)
      echo "error: CLAUDE_SKILLS must be an absolute path" >&2
      return 1
      ;;
  esac
}

# agent_skills_root TARGET
# Prints default skills directory for TARGET (claude|codex|grok).
agent_skills_root() {
  case "$1" in
    claude) printf '%s\n' "${HOME}/.claude/skills" ;;
    codex)  printf '%s\n' "${HOME}/.agents/skills" ;;
    grok)   printf '%s\n' "${HOME}/.grok/skills" ;;
    *)
      echo "error: unknown agent target: $1" >&2
      return 1
      ;;
  esac
}

# agent_parent_dir TARGET
# Prints agent home that must already exist for TARGET to be eligible.
agent_parent_dir() {
  case "$1" in
    claude) printf '%s\n' "${HOME}/.claude" ;;
    codex)  printf '%s\n' "${HOME}/.agents" ;;
    grok)   printf '%s\n' "${HOME}/.grok" ;;
    *)
      echo "error: unknown agent target: $1" >&2
      return 1
      ;;
  esac
}

# agent_label TARGET — human label for status lines.
agent_label() {
  case "$1" in
    claude) printf '%s\n' "Claude Code" ;;
    codex)  printf '%s\n' "Codex" ;;
    grok)   printf '%s\n' "Grok" ;;
    *) printf '%s\n' "$1" ;;
  esac
}

# skill_source REPO NAME
# Prints absolute path to skill/<NAME> under REPO.
# Side effects: none.
skill_source() {
  local repo="$1" name="$2"
  printf '%s/skill/%s\n' "${repo}" "${name}"
}

# skill_dest ROOT NAME
# Prints absolute path ROOT/NAME.
# Side effects: none.
skill_dest() {
  local root="$1" name="$2"
  printf '%s/%s\n' "${root}" "${name}"
}

# is_exact_link DEST SOURCE
# Exit 0 if DEST is a symlink whose readlink equals SOURCE.
# Side effects: none.
is_exact_link() {
  local dest="$1" source="$2" current
  [ -L "${dest}" ] || return 1
  current="$(readlink "${dest}")"
  [ "${current}" = "${source}" ]
}

# is_kit_skill_link DEST REPO NAME
# Exit 0 if DEST is a symlink to REPO/skill/NAME.
# Side effects: none.
is_kit_skill_link() {
  local dest="$1" repo="$2" name="$3" expected current
  [ -L "${dest}" ] || return 1
  expected="$(skill_source "${repo}" "${name}")"
  current="$(readlink "${dest}")"
  [ "${current}" = "${expected}" ]
}

# unlink_legacy_skills DEST_ROOT REPO
# Removes DEST_ROOT/<legacy> only when it is a symlink to REPO/skill/<legacy>.
# Source dir need not exist (post-rename orphans). Prints status lines.
# Side effects: may rm -f legacy kit links. Does not touch foreign paths.
unlink_legacy_skills() {
  local dest_root="$1" repo="$2" name dest
  for name in ${LEGACY_SKILL_NAMES}; do
    dest="$(skill_dest "${dest_root}" "${name}")"
    if [ ! -e "${dest}" ] && [ ! -L "${dest}" ]; then
      continue
    fi
    if is_kit_skill_link "${dest}" "${repo}" "${name}"; then
      rm -f "${dest}" || {
        echo "error: failed to remove legacy link: ${dest}" >&2
        return 1
      }
      echo "removed legacy: ${dest}"
    fi
  done
}

# ensure_skills_dir DEST_ROOT [HINT]
# Creates DEST_ROOT only if its parent already exists (agent home already set up).
# Side effects: may mkdir DEST_ROOT. Returns 1 if parent is missing.
ensure_skills_dir() {
  local dest_root="$1" hint="${2:-}" parent
  parent="$(dirname "${dest_root}")"
  if [ -d "${dest_root}" ]; then
    return 0
  fi
  if [ ! -d "${parent}" ]; then
    echo "error: coding-agent skills parent missing: ${parent}" >&2
    if [ -n "${hint}" ]; then
      echo "  ${hint}" >&2
    else
      echo "  Open the agent once, mkdir the parent, or set CLAUDE_SKILLS." >&2
    fi
    return 1
  fi
  mkdir -p "${dest_root}" || {
    echo "error: failed to create: ${dest_root}" >&2
    return 1
  }
}

# install_skills_into DEST_ROOT REPO FORCE
# Links every SKILL_NAMES entry into DEST_ROOT; then unlinks legacy names there.
install_skills_into() {
  local dest_root="$1" repo="$2" force="$3" name source dest
  ensure_skills_dir "${dest_root}" || return 1
  for name in ${SKILL_NAMES}; do
    source="$(skill_source "${repo}" "${name}")"
    dest="$(skill_dest "${dest_root}" "${name}")"
    link_skill "${source}" "${dest}" "${force}" || return 1
  done
  unlink_legacy_skills "${dest_root}" "${repo}" || return 1
}

# uninstall_skills_from DEST_ROOT REPO
# Removes kit-owned legacy + SKILL_NAMES links under DEST_ROOT only.
uninstall_skills_from() {
  local dest_root="$1" repo="$2" name dest
  unlink_legacy_skills "${dest_root}" "${repo}" || return 1
  for name in ${SKILL_NAMES}; do
    dest="$(skill_dest "${dest_root}" "${name}")"
    unlink_skill "${dest}" "${repo}" "${name}"
  done
}

# remove_legacy_codex_skills_dir REPO
# Best-effort: drop kit-owned job-profile-init (and profile-init) under
# ~/.codex/skills — wrong path from older docs; never touches foreign files.
remove_legacy_codex_skills_dir() {
  local repo="$1" legacy_root="${HOME}/.codex/skills" name dest
  [ -d "${legacy_root}" ] || [ -L "${legacy_root}" ] || return 0
  for name in ${SKILL_NAMES} ${LEGACY_SKILL_NAMES}; do
    dest="$(skill_dest "${legacy_root}" "${name}")"
    if is_kit_skill_link "${dest}" "${repo}" "${name}"; then
      rm -f "${dest}" || {
        echo "error: failed to remove legacy Codex path: ${dest}" >&2
        return 1
      }
      echo "removed legacy Codex path: ${dest}"
    fi
  done
}

# require_skill_source SOURCE
# Exit 0 if SOURCE is a skill directory with SKILL.md.
# Side effects: none. Prints error and returns 1 if missing.
require_skill_source() {
  local source="$1"
  [ -d "${source}" ] || {
    echo "error: skill source missing: ${source}" >&2
    return 1
  }
  [ -f "${source}/SKILL.md" ] || {
    echo "error: skill missing SKILL.md: ${source}" >&2
    return 1
  }
}

# link_skill SOURCE DEST FORCE
# Idempotent symlink. Exact → no-op. Any other existing path → fail unless FORCE=1.
# Side effects: may rm + ln -s. Prints status lines.
link_skill() {
  local source="$1" dest="$2" force="$3" parent name
  require_skill_source "${source}" || return 1

  parent="$(dirname "${dest}")"
  name="$(basename "${dest}")"
  [ -d "${parent}" ] || {
    echo "error: destination parent missing: ${parent}" >&2
    return 1
  }
  dest="$(cd "${parent}" && pwd -P)/${name}"

  if is_exact_link "${dest}" "${source}"; then
    echo "up to date: ${dest}"
    return 0
  fi

  if [ -L "${dest}" ] || [ -e "${dest}" ]; then
    if [ "${force}" -eq 1 ]; then
      if [ -d "${dest}" ] && [ ! -L "${dest}" ]; then
        rm -rf "${dest}" || {
          echo "error: failed to remove foreign path: ${dest}" >&2
          return 1
        }
      else
        rm -f "${dest}" || {
          echo "error: failed to remove foreign path: ${dest}" >&2
          return 1
        }
      fi
      echo "forced remove: ${dest}"
    else
      echo "error: foreign path blocks install: ${dest}" >&2
      echo "  use --force to replace, or remove it manually" >&2
      return 1
    fi
  fi

  ln -s "${source}" "${dest}" || {
    echo "error: failed to link ${dest} -> ${source}" >&2
    return 1
  }
  echo "linked: ${dest} -> ${source}"
}

# unlink_skill DEST REPO NAME
# Removes DEST only when it is a kit-owned skill link for NAME.
# Side effects: may rm -f. Prints removed/skipped.
unlink_skill() {
  local dest="$1" repo="$2" name="$3"
  if [ ! -e "${dest}" ] && [ ! -L "${dest}" ]; then
    echo "skipped (missing): ${dest}"
    return 0
  fi
  if ! is_kit_skill_link "${dest}" "${repo}" "${name}"; then
    echo "skipped (not kit link): ${dest}"
    return 0
  fi
  rm -f "${dest}" || {
    echo "error: failed to remove: ${dest}" >&2
    return 1
  }
  echo "removed: ${dest}"
}
