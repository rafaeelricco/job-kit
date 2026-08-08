#!/usr/bin/env bash
# Single job-kit uninstaller: interactive menu or target args.
# Compatible with macOS Bash 3.2.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"
JOB_KIT_HOME="${JOB_KIT_HOME:-${XDG_DATA_HOME:-${HOME}/.local/share}/job-kit}"
ASIDE_ACCOUNT_ID="${ASIDE_ACCOUNT:-0}"

# Ownership probe for cache purge (must match remote.sh KIT_OWNERSHIP_FILES intent).
KIT_OWNERSHIP_FILES="scripts/agents/install.sh scripts/agents/lib.sh
scripts/aside/install.sh scripts/aside/lib.sh
scripts/uninstall.sh
skill/job-profile-init/SKILL.md
skill/job-scout/SKILL.md
skill/job-application/SKILL.md"

YES=0
SKIP_CLAUDE=0
SKIP_CODEX=0
SKIP_GROK=0

# die MSG…
# Prints an error to stderr and exits 1.
die() { echo "error: $*" >&2; exit 1; }

# strip_trailing_slashes PATH
# Prints PATH with trailing slashes removed (a lone "/" is kept).
strip_trailing_slashes() {
  local p="$1"
  while [ "${#p}" -gt 1 ] && [ "${p%/}" != "${p}" ]; do
    p="${p%/}"
  done
  printf '%s' "${p}"
}

JOB_KIT_HOME="$(strip_trailing_slashes "${JOB_KIT_HOME}")"

# Every path this script deletes is built from these, so each is required to be
# absolute and free of traversal before it can reach `rm -rf`. Relative to the
# caller's CWD they name whatever happens to sit there — `JOB_KIT_HOME=job-kit`
# purged a checkout in the working directory, `HOME=.` deleted `./.config/job-kit`.
case "${JOB_KIT_HOME}" in
  /*) ;;
  *) die "JOB_KIT_HOME must be an absolute path (got: ${JOB_KIT_HOME})" ;;
esac
case "${HOME}" in
  /*) ;;
  *) die "HOME must be an absolute path (got: ${HOME})" ;;
esac
case "${ASIDE_ACCOUNT_ID}" in
  */* | . | .. | "") die "ASIDE_ACCOUNT must be one path component, without separators or dot traversal (got: ${ASIDE_ACCOUNT_ID})" ;;
  *) ;;
esac

# resolve_host_home
# Inside Aside, HOME is <host>/.aside/runtime/home. Strip that suffix so host
# paths match install/activate.
resolve_host_home() {
  local suffix="/.aside/runtime/home"
  case "${HOME}" in
    *"${suffix}") printf '%s\n' "${HOME%${suffix}}" ;;
    *) printf '%s\n' "${HOME}" ;;
  esac
}

host_default_root() {
  printf '%s/.config/job-kit\n' "$(resolve_host_home)"
}

# job_kit_config — the XDG profile root, or the host default.
# A relative XDG_CONFIG_HOME is refused rather than resolved: this path is handed
# to `rm -rf`, and relative to the caller's CWD it names whatever happens to sit
# there — `XDG_CONFIG_HOME=.` turns `profile` into "delete ./job-kit".
job_kit_config() {
  if [ -n "${XDG_CONFIG_HOME:-}" ]; then
    case "${XDG_CONFIG_HOME}" in
      /*) ;;
      *) die "XDG_CONFIG_HOME must be an absolute path (got: ${XDG_CONFIG_HOME}); unset it to use the host default" ;;
    esac
    printf '%s/job-kit\n' "${XDG_CONFIG_HOME}"
  else
    host_default_root
  fi
}

# paths_equal A B — same string or same physical directory.
paths_equal() {
  local a="$1" b="$2"
  [ "${a}" = "${b}" ] && return 0
  if [ -d "${a}" ] && [ -d "${b}" ]; then
    [ "$(cd "${a}" && pwd -P)" = "$(cd "${b}" && pwd -P)" ]
    return $?
  fi
  return 1
}

# confirm_yes PROMPT — require typed "yes" unless YES=1.
confirm_yes() {
  local prompt="$1" answer
  if [ "${YES}" -eq 1 ]; then
    return 0
  fi
  printf '%s' "${prompt}" >&2
  read -r answer || true
  case "${answer}" in
    yes) return 0 ;;
    *)
      echo "aborted (type yes to confirm)." >&2
      return 1
      ;;
  esac
}

usage() {
  cat <<'EOF'
Uninstall job-kit (one script for all components).

Usage: uninstall.sh                 # interactive menu (TTY required)
       uninstall.sh <target>…       # non-interactive (one or more targets)
       uninstall.sh -h|--help

Targets:
  aside     Aside skills (job-scout, job-application)
  agents    Coding-agent skills (job-profile-init, job-profile-config)
  profile   Delete profile root(s) + matching profile-root pointers
  cache     Remove kit checkout cache (JOB_KIT_HOME), kit-owned only
  all       aside + agents + profile + cache

Options:
  -y, --yes     Skip confirmations (profile / all / cache)
  --skip-claude|--skip-codex|--skip-grok
                Applied only when agents runs

Profile path: ${XDG_CONFIG_HOME:-$HOME/.config}/job-kit and, when different,
$host_default ($HOST_HOME/.config/job-kit). All/profile require typing yes
unless --yes.

Environment:
  JOB_KIT_HOME   Kit cache (default $XDG_DATA_HOME/job-kit or ~/.local/share/job-kit)
  ASIDE_SKILLS / ASIDE_SKILLS_USER / ASIDE_ACCOUNT / CLAUDE_SKILLS
                 Same overrides as the channel installers
EOF
}

# uninstall_aside — remove kit-owned Aside skills via aside/lib.sh (subshell).
uninstall_aside() {
  local repo="${REPO_ROOT}"
  (
    # shellcheck source=aside/lib.sh
    . "${repo}/scripts/aside/lib.sh"
    local dest_root name dest
    dest_root="$(resolve_aside_skills_root)" || exit 1
    echo "== job-kit Aside uninstall for ${dest_root} =="
    unlink_legacy_skills "${dest_root}" "${repo}" || exit 1
    for name in ${SKILL_NAMES}; do
      dest="$(skill_dest "${dest_root}" "${name}")"
      unlink_skill "${dest}" "${repo}" "${name}"
    done
    remove_legacy_user_skills "${repo}" "${dest_root}" || exit 1
    echo "Uninstall completed for ${dest_root}"
  )
}

# uninstall_agents — remove kit-owned agent skill links via agents/lib.sh (subshell).
uninstall_agents() {
  local repo="${REPO_ROOT}"
  local skip_claude="${SKIP_CLAUDE}" skip_codex="${SKIP_CODEX}" skip_grok="${SKIP_GROK}"
  (
    # shellcheck source=agents/lib.sh
    . "${repo}/scripts/agents/lib.sh"
    local override dest_root target parent label
    override="$(resolve_override_skills)" || exit 1

    echo "== job-kit agents uninstall =="

    if [ -n "${override}" ]; then
      echo "== override (${override}) =="
      uninstall_skills_from "${override}" "${repo}" || exit 1
      echo "Uninstall completed for ${override}"
      exit 0
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
      uninstall_skills_from "${dest_root}" "${repo}" || exit 1
    done

    remove_legacy_codex_skills_dir "${repo}" || exit 1
    echo "Uninstall completed"
  )
}

# clear_pointer_if_matches FILE PATH…
# Removes FILE when its one-line content equals any PATH (string or physical).
clear_pointer_if_matches() {
  local file="$1" line canon p
  shift
  [ -f "${file}" ] || return 0
  line="$(tr -d '\n' < "${file}")"
  [ -n "${line}" ] || {
    rm -f "${file}"
    echo "removed empty pointer: ${file}"
    return 0
  }
  if [ -d "${line}" ]; then
    canon="$(cd "${line}" && pwd -P)"
  else
    canon=""
  fi
  for p in "$@"; do
    if [ "${line}" = "${p}" ]; then
      rm -f "${file}"
      echo "removed pointer: ${file}"
      return 0
    fi
    if [ -n "${canon}" ] && [ -d "${p}" ] && [ "${canon}" = "$(cd "${p}" && pwd -P)" ]; then
      rm -f "${file}"
      echo "removed pointer: ${file}"
      return 0
    fi
    # Dangling pointer: content named p but directory is already gone.
    if [ -n "${canon}" ] && [ "${canon}" = "${p}" ]; then
      rm -f "${file}"
      echo "removed pointer: ${file}"
      return 0
    fi
  done
}

# remove_profile — delete default profile roots + matching profile-root pointers.
remove_profile() {
  local config host_default paths path host_home pointer mirror
  local -a existing
  existing=()

  config="$(job_kit_config)"
  host_default="$(host_default_root)"

  for path in "${config}" "${host_default}"; do
    [ -e "${path}" ] || [ -L "${path}" ] || continue
    # Deduplicate when XDG unset, or when one root is a symlink to the other.
    local seen=0 e i=0
    for e in "${existing[@]+"${existing[@]}"}"; do
      if paths_equal "${e}" "${path}"; then
        seen=1
        # Keep the real directory as the deletion target: `rm -rf` on a symlink
        # alias removes the link and leaves every profile fact in place.
        if [ -L "${e}" ] && [ ! -L "${path}" ]; then
          existing[${i}]="${path}"
        fi
        break
      fi
      i=$((i + 1))
    done
    [ "${seen}" -eq 0 ] || continue
    existing[${#existing[@]}]="${path}"
  done

  if [ "${#existing[@]}" -eq 0 ]; then
    echo "profile: already absent (${config}"
    if [ "${config}" != "${host_default}" ]; then
      echo "  and ${host_default}"
    fi
    echo ")"
  else
    echo "profile paths to delete:"
    for path in "${existing[@]}"; do
      echo "  ${path}"
    done
    confirm_yes "Permanently delete profile data (type yes): " || return 1
    for path in "${existing[@]}"; do
      rm -rf "${path}" || die "failed to remove profile: ${path}"
      echo "removed profile: ${path}"
    done
    # An alias that pointed at a deleted tree is now dangling; drop it too.
    for path in "${config}" "${host_default}"; do
      if [ -L "${path}" ] && [ ! -e "${path}" ]; then
        rm -f "${path}" || die "failed to remove profile alias: ${path}"
        echo "removed profile alias: ${path}"
      fi
    done
  fi

  host_home="$(resolve_host_home)"
  pointer="${host_home}/.config/profile-root"
  mirror="${host_home}/.aside/runtime/home/.config/profile-root"
  # Match pointers against convention roots (same strings as removed trees).
  clear_pointer_if_matches "${pointer}" "${config}" "${host_default}"
  clear_pointer_if_matches "${mirror}" "${config}" "${host_default}"
}

# kit_owned_missing DIR — first missing ownership file, or empty if kit-owned.
# Walks every path component and rejects a symlink at any of them: Bash
# `test -f`/`-d` follow intermediate links, so a foreign directory that keeps a
# real `skill/` but links `scripts` and each skill dir into a genuine checkout
# would pass a leaf-only probe and be handed to `rm -rf`. Same walk as
# `kit_paths_missing` in remote.sh, which guards the same decision.
kit_owned_missing() {
  local dir="$1" rel cur part rest
  if [ -L "${dir}/skill" ] || [ ! -d "${dir}/skill" ]; then
    printf '%s\n' "skill/"
    return 0
  fi
  for rel in ${KIT_OWNERSHIP_FILES}; do
    cur="${dir}"
    rest="${rel}"
    while [ -n "${rest}" ]; do
      case "${rest}" in
        */*)
          part="${rest%%/*}"
          rest="${rest#*/}"
          ;;
        *)
          part="${rest}"
          rest=""
          ;;
      esac
      [ -n "${part}" ] || continue
      cur="${cur}/${part}"
      if [ -L "${cur}" ]; then
        printf '%s\n' "${rel}"
        return 0
      fi
    done
    if [ ! -f "${dir}/${rel}" ]; then
      printf '%s\n' "${rel}"
      return 0
    fi
  done
}

# resolve_cache_path PATH — physical path when PATH is a live symlink to a dir.
resolve_cache_path() {
  local raw
  raw="$(strip_trailing_slashes "$1")"
  if [ -L "${raw}" ]; then
    [ -d "${raw}" ] || die "cache symlink is dangling: ${raw}"
    (cd "${raw}" && pwd -P)
    return 0
  fi
  printf '%s\n' "${raw}"
}

# owned_by_root PATH NAME ROOT…
# Prints PATH when it is a skill symlink, or a marked copy, whose source is
# ROOT/skill/NAME for any ROOT given. Always returns 0 so callers survive
# `set -e`.
owned_by_root() {
  local path="$1" name="$2" current root
  shift 2
  if [ -L "${path}" ]; then
    current="$(readlink "${path}")"
  elif [ -d "${path}" ] && [ -f "${path}/.job-kit" ]; then
    current="$(cat "${path}/.job-kit")"
  else
    return 0
  fi
  for root in "$@"; do
    if [ "${current}" = "${root}/skill/${name}" ]; then
      printf '%s\n' "${path}"
      return 0
    fi
  done
  return 0
}

# first_uninspectable PATH — the first existing component of PATH that cannot be
# read and searched, or nothing when the whole chain is inspectable (an absent
# component ends the walk: absent is a real answer).
# A directory that cannot be searched hides its children from `test`, so every
# probe below it returns "not there" — indistinguishable from "nothing to find".
# This scan stands in front of `rm -rf`, so it must tell those apart.
# Side effects: none.
first_uninspectable() {
  local path="$1" cur="" part rest
  rest="${path#/}"
  while [ -n "${rest}" ]; do
    case "${rest}" in
      */*)
        part="${rest%%/*}"
        rest="${rest#*/}"
        ;;
      *)
        part="${rest}"
        rest=""
        ;;
    esac
    [ -n "${part}" ] || continue
    cur="${cur}/${part}"
    [ -e "${cur}" ] || return 0
    if [ ! -r "${cur}" ] || [ ! -x "${cur}" ]; then
      printf '%s\n' "${cur}"
      return 0
    fi
  done
}

# links_owned_by DEST — installed skill paths whose source is the checkout at DEST.
# The channel libs decide ownership as `readlink == <repo>/skill/<name>` against
# this script's REPO_ROOT, so an install made from a different checkout is
# skipped as "not kit-owned". Purging DEST would then strand those links behind
# a report claiming the uninstall completed.
# Installers record the source as `pwd -P`, which differs from DEST whenever an
# ancestor is a symlink (`/var` → `/private/var`), so both forms are matched.
# Side effects: none.
# home_bases — `$HOME`, plus the resolved host home when it differs.
# Inside Aside, HOME is <host>/.aside/runtime/home while the links were
# installed under the host home, so every scan visits both.
home_bases() {
  local host_home
  printf '%s\n' "${HOME}"
  host_home="$(resolve_host_home)"
  [ "${host_home}" = "${HOME}" ] || printf '%s\n' "${host_home}"
}

links_owned_by() {
  local dest="$1" scope="${2:-all}" phys
  phys="${dest}"
  if [ -d "${dest}" ]; then
    phys="$(cd "${dest}" && pwd -P)" || phys="${dest}"
  fi
  (
    # shellcheck source=agents/lib.sh
    . "${REPO_ROOT}/scripts/agents/lib.sh"
    local target root rel base
    # scan_root ROOT — report kit-owned skill paths under ROOT.
    scan_root() {
      local r="$1" n blocker
      blocker="$(first_uninspectable "${r}")"
      if [ -n "${blocker}" ]; then
        printf '%s\n' "${blocker} (exists but cannot be inspected)"
        return 0
      fi
      for n in ${SKILL_NAMES} ${LEGACY_SKILL_NAMES}; do
        owned_by_root "$(skill_dest "${r}" "${n}")" "${n}" "${dest}" "${phys}"
      done
    }
    # target_skipped TARGET — 0 when --skip-<target> keeps uninstall_agents away.
    target_skipped() {
      case "$1" in
        claude) [ "${SKIP_CLAUDE}" -eq 1 ] ;;
        codex) [ "${SKIP_CODEX}" -eq 1 ] ;;
        grok) [ "${SKIP_GROK}" -eq 1 ] ;;
        *) return 1 ;;
      esac
    }
    while IFS= read -r base; do
      for target in ${AGENT_TARGETS}; do
        # agent_skills_root is $HOME-relative; re-anchor its suffix per base.
        root="$(agent_skills_root "${target}")"
        rel="${root#"${HOME}/"}"
        if [ "${rel}" = "${root}" ]; then
          rel=""
        else
          root="${base}/${rel}"
        fi
        # scope=survivors lists only what the unlink phase will NOT reach.
        # uninstall_agents walks the raw $HOME roots — except the ones a
        # --skip-<target> flag excludes, which do survive it. Exempt a root only
        # when it can actually be inspected: an unsearchable one hides its links
        # from uninstall_agents too, so the scheduled unlink cannot clear it.
        if [ "${scope}" = survivors ] && [ "${base}" = "${HOME}" ] \
          && ! target_skipped "${target}" \
          && [ -z "$(first_uninspectable "${root}")" ]; then
          continue
        fi
        scan_root "${root}"
      done
      # Older docs pointed Codex at ~/.codex/skills, and
      # `remove_legacy_codex_skills_dir` still unlinks there — unconditionally,
      # so it is never a survivor under the raw $HOME.
      if [ "${scope}" != survivors ] || [ "${base}" != "${HOME}" ]; then
        scan_root "${base}/.codex/skills"
      fi
    done <<EOF
$(home_bases)
EOF
  )
  (
    # shellcheck source=aside/lib.sh
    . "${REPO_ROOT}/scripts/aside/lib.sh"
    local base account_dir blocker
    scan_root() {
      local r="$1" n blocker
      blocker="$(first_uninspectable "${r}")"
      if [ -n "${blocker}" ]; then
        printf '%s\n' "${blocker} (exists but cannot be inspected)"
        return 0
      fi
      for n in ${SKILL_NAMES} ${LEGACY_SKILL_NAMES}; do
        owned_by_root "$(skill_dest "${r}" "${n}")" "${n}" "${dest}" "${phys}"
      done
    }
    # Roots are constructed rather than read from resolve_aside_skills_root:
    # purge_cache refuses to run while ASIDE_SKILLS / ASIDE_SKILLS_USER narrow
    # the channel, so the default shape is the only one reachable here.
    # Every existing u/<account> is walked, not just ASIDE_ACCOUNT: skills
    # installed under another account outlive a purge run without it set.
    # `builtin` is the current root; `user` is the legacy one
    # remove_legacy_user_skills clears.
    while IFS= read -r base; do
      # An account tree that cannot be traversed is not an absent one: the glob
      # silently yields nothing and the scan would report all clear. Walk the
      # whole enumeration path first — `-e` on `.aside/u` is itself false when
      # an ancestor like `.aside` is unsearchable, which would skip this guard.
      blocker="$(first_uninspectable "${base}/.aside/u")"
      if [ -n "${blocker}" ]; then
        printf '%s\n' "${blocker} (exists but cannot be inspected)"
        continue
      fi
      for account_dir in "${base}"/.aside/u/*/; do
        [ -d "${account_dir}" ] || continue
        # scope=survivors: uninstall_aside only reaches ASIDE_ACCOUNT under the
        # raw $HOME, so every other account — and every other base — survives it.
        # Exempt it only when both of its roots are inspectable: an unsearchable
        # one hides its links from uninstall_aside too, exactly as for agents.
        if [ "${scope}" = survivors ] && [ "${base}" = "${HOME}" ] \
          && [ "${account_dir}" = "${base}/.aside/u/${ASIDE_ACCOUNT_ID}/" ] \
          && [ -z "$(first_uninspectable "${account_dir}skills/builtin")" ] \
          && [ -z "$(first_uninspectable "${account_dir}skills/user")" ]; then
          continue
        fi
        scan_root "${account_dir}skills/builtin"
        scan_root "${account_dir}skills/user"
      done
    done <<EOF
$(home_bases)
EOF
  )
}

# purge_env_guards — refuse a cache purge while an override narrows a channel.
purge_env_guards() {
  [ -z "${CLAUDE_SKILLS:-}" ] \
    || die "refusing cache purge while CLAUDE_SKILLS narrows agents to ${CLAUDE_SKILLS} (unset it, or omit cache)"
  [ -z "${ASIDE_SKILLS:-}" ] \
    || die "refusing cache purge while ASIDE_SKILLS narrows Aside to ${ASIDE_SKILLS} (unset it, or omit cache)"
  [ -z "${ASIDE_SKILLS_USER:-}" ] \
    || die "refusing cache purge while ASIDE_SKILLS_USER narrows Aside to ${ASIDE_SKILLS_USER} (unset it, or omit cache)"
}

# purge_preflight [SCOPE] — prove the cache purge can finish before anything is
# deleted. `remove_profile` is irreversible, so every purge guard that does not
# depend on the unlink phase runs first.
# SCOPE `survivors` means an aside+agents unlink phase precedes the purge in this
# run: only links that phase cannot reach are blockers. SCOPE `all` (default)
# means nothing will be unlinked first, so every live link blocks.
# A cache this checkout does not own is always scanned in full — the unlink phase
# skips those links as non-kit whatever it walks.
# cache_unremovable DIR — why `rm -rf DIR` would fail, or nothing.
# Removal needs three things the fixed-path ownership probes never test: the tree
# must enumerate, every directory in it must be writable (entries are unlinked
# from their parent), and DIR's own parent must be writable to drop DIR itself.
# Side effects: none.
cache_unremovable() {
  local dir="$1" errs parent
  errs="$(find "${dir}" -print 2>&1 >/dev/null)" || true
  if [ -n "${errs}" ]; then
    printf '%s' "${errs}"
    return 0
  fi
  errs="$(find "${dir}" -type d ! -perm -u+w -print 2>/dev/null)" || true
  if [ -n "${errs}" ]; then
    printf 'not writable, so their contents cannot be unlinked:\n%s' "${errs}"
    return 0
  fi
  parent="$(dirname "${dir}")"
  if [ ! -w "${parent}" ]; then
    printf '%s is not writable, so %s itself cannot be removed' "${parent}" "${dir}"
  fi
}

purge_preflight() {
  local scope="${1:-all}" raw dest missing outstanding unwalkable
  purge_env_guards
  raw="$(strip_trailing_slashes "${JOB_KIT_HOME}")"
  if [ ! -L "${raw}" ] && [ ! -e "${raw}" ]; then
    return 0
  fi
  dest="$(resolve_cache_path "${raw}")"
  missing="$(kit_owned_missing "${dest}")"
  [ -z "${missing}" ] \
    || die "refusing to start: the cache purge would fail on a non-kit path (missing ${missing}): ${dest}"
  # The ownership probe reads fixed paths, which a searchable-but-unreadable
  # tree still answers; `rm -rf` has to enumerate it. Prove that now, or an
  # earlier irreversible target runs and the purge fails afterwards.
  unwalkable="$(cache_unremovable "${dest}")"
  [ -z "${unwalkable}" ] \
    || die "refusing to start: the cache at ${dest} cannot be removed, so the purge would fail partway:
${unwalkable}"
  if ! paths_equal "${dest}" "${REPO_ROOT}"; then
    scope=all
  fi
  outstanding="$(links_owned_by "${dest}" "${scope}")"
  [ -z "${outstanding}" ] || die "refusing to start: installed skills point at ${dest} and this run will not remove them:
${outstanding}
uninstall those skills first, or run the uninstaller from ${dest}"
}

# purge_cache — remove kit-owned JOB_KIT_HOME only.
purge_cache() {
  local raw dest missing outstanding
  raw="$(strip_trailing_slashes "${JOB_KIT_HOME}")"

  purge_env_guards

  if [ ! -L "${raw}" ] && [ ! -e "${raw}" ]; then
    echo "cache already absent: ${raw}"
    return 0
  fi

  dest="$(resolve_cache_path "${raw}")"
  missing="$(kit_owned_missing "${dest}")"
  [ -z "${missing}" ] \
    || die "refusing to purge non-kit path (missing ${missing}): ${dest}"

  # Any live link into the cache would dangle once it is gone. Checked whatever
  # root this script runs from: `all` reaches here with the links already
  # unlinked, while the standalone `cache` target — and a run from another
  # checkout, which skips them as non-kit — would otherwise strand them.
  outstanding="$(links_owned_by "${dest}")"
  [ -z "${outstanding}" ] || die "refusing to purge ${dest}: these still point at it, or could not be inspected:
${outstanding}
uninstall those skills first (\`uninstall.sh aside agents\`, or \`all\`)"

  confirm_yes "Remove kit cache at ${dest} (type yes): " || return 1
  rm -rf "${dest}" || die "failed to remove cache: ${dest}"
  if [ -L "${raw}" ]; then
    rm -f "${raw}" || die "failed to remove cache symlink: ${raw}"
  fi
  echo "purged cache: ${dest}"
}

# preflight_targets TARGET… — prove every target's prerequisites up front.
# `remove_profile` and `purge_cache` cannot be undone, so a channel that would
# refuse to resolve its skills root has to say so before the first removal.
preflight_targets() {
  local t roots
  for t in "$@"; do
    case "${t}" in
      agents)
        # The resolve check stays its own subshell: `set -e` does not abort a
        # command substitution that sits in a `||` list, so folding it into the
        # roots capture below would silently drop it.
        (
          # shellcheck source=agents/lib.sh
          . "${REPO_ROOT}/scripts/agents/lib.sh"
          resolve_override_skills >/dev/null
        ) || die "refusing to start: the agents target cannot resolve its skills root"
        roots="$(
          # shellcheck source=agents/lib.sh
          . "${REPO_ROOT}/scripts/agents/lib.sh"
          for target in ${AGENT_TARGETS}; do
            agent_skills_root "${target}"
          done
          printf '%s\n' "${HOME}/.codex/skills"
        )"
        unwritable_roots "${roots}" agents
        ;;
      aside)
        (
          # shellcheck source=aside/lib.sh
          . "${REPO_ROOT}/scripts/aside/lib.sh"
          resolve_aside_skills_root >/dev/null
        ) || die "refusing to start: the aside target cannot resolve its skills root"
        roots="$(
          # shellcheck source=aside/lib.sh
          . "${REPO_ROOT}/scripts/aside/lib.sh"
          resolve_aside_skills_root
          printf '%s\n' "${HOME}/.aside/u/${ASIDE_ACCOUNT_ID}/skills/user"
        )"
        unwritable_roots "${roots}" aside
        ;;
    esac
  done
}

# unwritable_roots ROOTS TARGET — die when an existing skills root cannot be
# written. Unlinking a skill removes an entry from its directory, so a readable
# but unwritable root fails at removal time — after `profile` has already run and
# while the channel still reports "Uninstall completed".
unwritable_roots() {
  local roots="$1" target="$2" root
  while IFS= read -r root; do
    [ -n "${root}" ] || continue
    [ -d "${root}" ] || continue
    [ -w "${root}" ] \
      || die "refusing to start: the ${target} target cannot unlink from ${root} (not writable)"
  done <<EOF
${roots}
EOF
}

do_all() {
  confirm_yes "Uninstall ALL (Aside + agents + profile + kit cache). Type yes: " || return 1
  YES=1
  preflight_targets aside agents
  purge_preflight survivors
  uninstall_aside
  uninstall_agents
  remove_profile
  purge_cache
}

run_target() {
  case "$1" in
    aside) uninstall_aside ;;
    agents) uninstall_agents ;;
    profile) remove_profile ;;
    cache) purge_cache ;;
    all) do_all ;;
    *) die "unknown target: $1 (aside|agents|profile|cache|all)" ;;
  esac
}

# interactive_menu — bash select when stdin is a TTY.
interactive_menu() {
  local choice
  PS3="Select component to uninstall (number): "
  select choice in \
    "Aside skills" \
    "Coding-agent skills" \
    "Profile data (~/.config/job-kit)" \
    "Kit cache (JOB_KIT_HOME)" \
    "All of the above" \
    "Quit"
  do
    case "${REPLY}" in
      1) run_target aside; return 0 ;;
      2) run_target agents; return 0 ;;
      3) run_target profile; return 0 ;;
      4) run_target cache; return 0 ;;
      5) run_target all; return 0 ;;
      6) echo "quit"; return 0 ;;
      *) echo "invalid choice" >&2 ;;
    esac
  done
}

main() {
  local -a targets
  targets=()

  while [ "$#" -gt 0 ]; do
    case "$1" in
      -h|--help) usage; exit 0 ;;
      -y|--yes) YES=1 ;;
      --skip-claude) SKIP_CLAUDE=1 ;;
      --skip-codex) SKIP_CODEX=1 ;;
      --skip-grok) SKIP_GROK=1 ;;
      aside|agents|profile|cache|all)
        targets[${#targets[@]}]="$1"
        ;;
      *)
        die "unknown option or target: $1 (see --help)"
        ;;
    esac
    shift
  done

  if [ "${#targets[@]}" -eq 0 ]; then
    if [ -t 0 ]; then
      interactive_menu
      return 0
    fi
    die "need a target (aside|agents|profile|cache|all) when stdin is not a TTY"
  fi

  local t has_all=0
  for t in "${targets[@]}"; do
    [ "${t}" = "all" ] && has_all=1
  done
  if [ "${has_all}" -eq 1 ]; then
    [ "${#targets[@]}" -eq 1 ] \
      || die "'all' cannot be combined with other targets"
    run_target all
    return 0
  fi

  # `cache` runs last whatever order was typed: it can delete REPO_ROOT, and the
  # other targets source their channel libraries from that checkout.
  local -a ordered
  ordered=()
  local seen_aside=0 seen_agents=0 has_cache=0 scope=all
  for t in "${targets[@]}"; do
    case "${t}" in
      cache)
        has_cache=1
        continue
        ;;
      aside) seen_aside=1 ;;
      agents) seen_agents=1 ;;
    esac
    ordered[${#ordered[@]}]="${t}"
  done
  if [ "${has_cache}" -eq 1 ]; then
    ordered[${#ordered[@]}]="cache"
  fi

  # Every prerequisite is proved before the first target runs: `profile` and
  # `cache` are irreversible, so a later target that would refuse must refuse now.
  preflight_targets "${ordered[@]}"
  if [ "${has_cache}" -eq 1 ]; then
    # Links are exempt only when both unlink targets also run — and with `cache`
    # forced last, they necessarily precede it.
    if [ "${seen_aside}" -eq 1 ] && [ "${seen_agents}" -eq 1 ]; then
      scope=survivors
    fi
    purge_preflight "${scope}"
  fi

  for t in "${ordered[@]}"; do
    run_target "${t}"
  done
}

main "$@"
