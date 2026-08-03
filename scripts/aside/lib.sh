#!/usr/bin/env bash
# Shared helpers for Aside skill install/uninstall.
# Compatible with macOS Bash 3.2. Source only — do not execute.

# Skill folder names under skill/ that Aside may load.
SKILL_NAMES="job-discovery job-apply profile-scaffold"

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
  [ -d "${repo}/scripts/aside" ] || {
    echo "error: not a job-kit checkout (missing scripts/aside/): ${repo}" >&2
    return 1
  }
  printf '%s\n' "${repo}"
}

# resolve_aside_skills_user
# Prints Aside user-skills directory.
# Default: $HOME/.aside/u/0/skills/user
# Override: absolute ASIDE_SKILLS_USER, or ASIDE_ACCOUNT for u/<id>.
# Side effects: none.
resolve_aside_skills_user() {
  local account path
  if [ -n "${ASIDE_SKILLS_USER:-}" ]; then
    case "${ASIDE_SKILLS_USER}" in
      /*) printf '%s\n' "${ASIDE_SKILLS_USER}" ;;
      *)
        echo "error: ASIDE_SKILLS_USER must be an absolute path" >&2
        return 1
        ;;
    esac
    return 0
  fi
  account="${ASIDE_ACCOUNT:-0}"
  path="${HOME}/.aside/u/${account}/skills/user"
  printf '%s\n' "${path}"
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

# ensure_aside_skills_user DEST_ROOT
# Creates DEST_ROOT only if its parent already exists (Aside already set up).
# Side effects: may mkdir DEST_ROOT. Exits 1 if parent is missing.
ensure_aside_skills_user() {
  local dest_root="$1" parent
  parent="$(dirname "${dest_root}")"
  if [ -d "${dest_root}" ]; then
    return 0
  fi
  if [ ! -d "${parent}" ]; then
    echo "error: Aside skills parent missing: ${parent}" >&2
    echo "  Install Aside Browser and sign in first (expected under ~/.aside)." >&2
    return 1
  fi
  mkdir -p "${dest_root}" || {
    echo "error: failed to create: ${dest_root}" >&2
    return 1
  }
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
# Idempotent symlink. Exact → no-op. Kit-owned wrong path → replace.
# Foreign path → fail unless FORCE=1.
# Side effects: may rm + ln -s. Prints status lines.
link_skill() {
  local source="$1" dest="$2" force="$3" current parent name
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
    if [ -L "${dest}" ]; then
      current="$(readlink "${dest}")"
      case "${current}" in
        */skill/job-discovery|*/skill/job-apply|*/skill/profile-scaffold)
          rm -f "${dest}" || {
            echo "error: failed to remove kit link: ${dest}" >&2
            return 1
          }
          echo "replaced kit link: ${dest}"
          ;;
        *)
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
          ;;
      esac
    else
      if [ "${force}" -eq 1 ]; then
        if [ -d "${dest}" ]; then
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
