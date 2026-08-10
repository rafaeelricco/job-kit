#!/usr/bin/env bash
# Fetch job-kit into a cached checkout, then run the channel installers.
# Compatible with macOS Bash 3.2. Safe to pipe: curl -fsSL … | bash -s -- all
set -euo pipefail

JOB_KIT_SLUG="${JOB_KIT_SLUG:-rafaeelricco/job-kit}"
JOB_KIT_REF="${JOB_KIT_REF:-main}"
JOB_KIT_HOME="${JOB_KIT_HOME:-${XDG_DATA_HOME:-${HOME}/.local/share}/job-kit}"

# strip_trailing_slashes PATH
# Prints PATH with trailing slashes removed (a lone "/" is kept). Without this,
# a JOB_KIT_HOME value like `/path/to/link/` makes `[ -L ]` and `rm -rf` operate
# on the target directory instead of the symlink itself.
# Side effects: none.
strip_trailing_slashes() {
  local p="$1"
  while [ "${#p}" -gt 1 ] && [ "${p%/}" != "${p}" ]; do
    p="${p%/}"
  done
  printf '%s' "${p}"
}

JOB_KIT_HOME="$(strip_trailing_slashes "${JOB_KIT_HOME}")"

# usage
# Prints CLI help to stdout.
# Side effects: none.
usage() {
  cat <<'EOF'
Install or uninstall job-kit skills without cloning by hand.

Usage: remote.sh [channel] [options…]
       remote.sh uninstall [target] [options…]

Install channels:
  all       Aside + coding agents, skipping absent targets (default)
  aside     Aside only (fails when Aside is not set up)
  agents    Coding agents only (fails when no agent home exists)
  fetch     Refresh the cached checkout, install nothing

Uninstall:
  uninstall           Aside + agent skills (default target: all)
  uninstall all       Same
  uninstall aside     Aside only
  uninstall agents    Coding agents only

  Interactive (profile data + menu): bash scripts/uninstall.sh
  from a local or cached checkout. Remote uninstall never deletes
  ~/.config/job-kit.

  -h, --help  Show this help

Install options after the channel are forwarded to the installer, e.g.
`remote.sh agents --skip-codex`. Channel `all` forwards only --force.

Uninstall options:
  --purge             After full uninstall only, remove the cached checkout
                      (refused with `uninstall aside` or `uninstall agents`,
                      and while CLAUDE_SKILLS/ASIDE_SKILLS narrow a channel)
  --skip-claude|codex|grok  Forwarded only with `uninstall agents`

Environment:
  JOB_KIT_HOME  Cached checkout (default $XDG_DATA_HOME/job-kit)
  JOB_KIT_REF   Branch or tag to fetch (default main)
  JOB_KIT_SLUG  GitHub owner/repo (default rafaeelricco/job-kit)

Install keeps the cache (agent skills symlink into it; Aside ownership
markers point at it). Uninstall leaves the cache unless full
`uninstall --purge` (partial uninstall + purge would strand agent links).
EOF
}

# have CMD
# Exit 0 when CMD is on PATH.
# Side effects: none.
have() { command -v "$1" >/dev/null 2>&1; }

# die MSG…
# Prints an error to stderr and exits 1.
die() { echo "error: $*" >&2; exit 1; }

# Ownership signature — every shipped kit has had these. Pre-fetch guards
# (update, purge) use this set so a cache created before a skill was added is
# still recognized as kit-owned and can be upgraded or removed. A stray
# `skill/` alone is never enough. Single source of truth for the filesystem
# ownership probe and (when used) the git-ref ownership probe.
KIT_OWNERSHIP_FILES="scripts/agents/install.sh scripts/agents/lib.sh
scripts/aside/install.sh scripts/aside/lib.sh
scripts/install.sh
scripts/uninstall.sh
skill/job-profile-init/SKILL.md
skill/job-scout/SKILL.md
skill/job-application/SKILL.md"

# Ownership signature for caches predating the unified uninstaller: the same
# set minus `scripts/uninstall.sh`, which those revisions never shipped. Only
# the migration refresh in `ensure_kit_cache` may use it, and only after a
# channel `uninstall.sh` has already proved the tree is an older job-kit.
KIT_LEGACY_OWNERSHIP_FILES="scripts/agents/install.sh scripts/agents/lib.sh
scripts/aside/install.sh scripts/aside/lib.sh
skill/job-profile-init/SKILL.md
skill/job-scout/SKILL.md
skill/job-application/SKILL.md"

# Full layout expected after fetch / before install: ownership files plus every
# skill this revision ships. Post-fetch validation uses this set so a wrong-ref
# download cannot replace the cache with a tree missing a new skill.
# `require_skill_source` in scripts/{agents,aside}/lib.sh rejects a skill
# without SKILL.md, and by then the cache has already been replaced — so the
# payload is checked here, not only the installer scripts.
KIT_REQUIRED_FILES="${KIT_OWNERSHIP_FILES}
skill/job-profile-config/SKILL.md
skill/job-tracker/SKILL.md"

# kit_paths_missing DIR FILE_LIST
# Prints the first path from FILE_LIST missing from DIR (or present as a
# symlink); prints nothing when every path is a regular file under a real
# `skill/` directory. Rejects a symlink at any path component because Bash
# `test -f`/`-d` follow intermediate links, which would accept a tarball where
# e.g. `skill/job-scout` is mode-`120000` while the leaf `SKILL.md` is a
# regular file — a shape the git-ref probe rejects.
# Side effects: none.
kit_paths_missing() {
  local dir="$1" files="$2" rel cur part rest
  if [ -L "${dir}/skill" ] || [ ! -d "${dir}/skill" ]; then
    printf '%s\n' "skill/"
    return 0
  fi
  for rel in ${files}; do
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

# kit_owned_missing DIR — pre-fetch / purge ownership (legacy caches pass).
kit_owned_missing() { kit_paths_missing "$1" "${KIT_OWNERSHIP_FILES}"; }

# kit_checkout_missing DIR — full post-fetch / pre-install layout.
kit_checkout_missing() { kit_paths_missing "$1" "${KIT_REQUIRED_FILES}"; }

# git_ref_paths_missing DIR REF FILE_LIST
# Prints the first path from FILE_LIST that REF does not carry with the right
# object type; prints nothing when REF is complete for FILE_LIST. Probes the
# object store so an update can be rejected before it reaches the working tree.
# Matches on tree-entry mode, not mere existence: a blob named `skill` is not a
# skills directory, and only regular-file modes (`100644`/`100755`) are accepted
# so a mode-`120000` symlink cannot pass the probe.
# Side effects: none.
git_ref_paths_missing() {
  local dir="$1" ref="$2" files="$3" rel mode
  if [ "$(git -C "${dir}" cat-file -t "${ref}:skill" 2>/dev/null)" != "tree" ]; then
    printf '%s\n' "skill/"
    return 0
  fi
  for rel in ${files}; do
    mode="$(git -C "${dir}" ls-tree "${ref}" -- "${rel}" 2>/dev/null | awk '{print $1}')"
    case "${mode}" in
      100644|100755) ;;
      *)
        printf '%s\n' "${rel}"
        return 0
        ;;
    esac
  done
}

# git_ref_missing DIR REF — full layout on a fetched/cloned ref.
git_ref_missing() { git_ref_paths_missing "$1" "$2" "${KIT_REQUIRED_FILES}"; }

# resolve_cache_path PATH
# Prints PATH after stripping trailing slashes. When PATH is an existing
# symlink, prints the physical directory it resolves to (`pwd -P`), so a
# tarball refresh updates the real cache that agent installers record via
# `pwd -P` rather than deleting the link and orphaning that target.
# Side effects: none. Dies on a dangling symlink.
resolve_cache_path() {
  local p
  p="$(strip_trailing_slashes "$1")"
  if [ -L "${p}" ]; then
    [ -d "${p}" ] || die "cache path is a dangling symlink: ${p}"
    (cd "${p}" && pwd -P) || die "failed to resolve cache symlink: ${p}"
    return 0
  fi
  printf '%s' "${p}"
}

# fetch_tarball DEST [OWNERSHIP_FILES]
# Downloads JOB_KIT_REF, verifies the extracted tree, then replaces DEST. No git
# required. DEST is removed only once the download proves to be a complete
# job-kit checkout, so a wrong-repo or wrong-ref fetch leaves the cache intact.
# OWNERSHIP_FILES defaults to KIT_OWNERSHIP_FILES and must carry whatever list
# the caller already probed with: a non-git legacy cache reaches its refresh
# through here, so re-probing the default signature would reject it for the very
# file the refresh installs. DEST is slash-normalized and symlink-resolved so a
# cache behind a link is refreshed in place (agent links/`pwd -P` markers stay
# valid) rather than replacing the link itself.
# Side effects: may rm -rf DEST — only when DEST is absent or a complete checkout.
fetch_tarball() {
  local dest url stage parent missing files
  dest="$(resolve_cache_path "$1")"
  files="${2:-${KIT_OWNERSHIP_FILES}}"
  if [ -L "${dest}" ] || [ -e "${dest}" ]; then
    # Ownership only: a pre-this-skill cache must still be replaceable.
    missing="$(kit_paths_missing "${dest}" "${files}")"
    [ -z "${missing}" ] \
      || die "cache path exists and is not a job-kit checkout (missing ${missing}): ${dest}"
  fi
  have tar || die "need git, or tar plus curl/wget, to fetch job-kit"
  url="https://codeload.github.com/${JOB_KIT_SLUG}/tar.gz/${JOB_KIT_REF}"
  parent="$(dirname "${dest}")"
  mkdir -p "${parent}" || die "failed to create: ${parent}"
  stage="${parent}/.job-kit-fetch.$$"
  rm -rf "${stage}"
  mkdir -p "${stage}" || die "failed to create: ${stage}"
  if have curl; then
    curl -fsSL "${url}" | tar -xzf - -C "${stage}" --strip-components=1 \
      || { rm -rf "${stage}"; die "download failed: ${url}"; }
  elif have wget; then
    wget -qO- "${url}" | tar -xzf - -C "${stage}" --strip-components=1 \
      || { rm -rf "${stage}"; die "download failed: ${url}"; }
  else
    rm -rf "${stage}"
    die "need curl or wget to fetch job-kit"
  fi
  # Full layout: the download must carry every skill this revision installs.
  missing="$(kit_checkout_missing "${stage}")"
  if [ -n "${missing}" ]; then
    rm -rf "${stage}"
    die "downloaded ${JOB_KIT_SLUG}@${JOB_KIT_REF} is not a job-kit checkout (missing ${missing}); cache left unchanged"
  fi
  rm -rf "${dest}"
  mv "${stage}" "${dest}" || { rm -rf "${stage}"; die "failed to cache: ${dest}"; }
  echo "fetched: ${dest} @ ${JOB_KIT_REF}"
}

# is_git_repo DIR
# Exit 0 when DIR is itself a git repository root, including a linked worktree
# or submodule where `.git` is a file rather than a directory.
# Side effects: none.
is_git_repo() {
  local dir="$1"
  [ -e "${dir}/.git" ] || return 1
  git -C "${dir}" rev-parse --git-dir >/dev/null 2>&1
}

# fetch_git_update DEST
# Shallow-fetches JOB_KIT_REF from the configured JOB_KIT_SLUG into the existing
# git checkout at DEST, and verifies the fetched tree before checking it out, so
# a ref without the kit layout leaves the working cache — and the agent symlinks
# into it — untouched. Fetches the slug URL directly rather than the literal
# `origin`, so JOB_KIT_SLUG stays authoritative for a cache cloned from
# elsewhere.
# Side effects: fetches into DEST; detaches HEAD only after validation.
fetch_git_update() {
  local dest="$1" missing
  git -C "${dest}" fetch --depth 1 "https://github.com/${JOB_KIT_SLUG}.git" "${JOB_KIT_REF}" \
    || die "git fetch failed for ${JOB_KIT_SLUG}@${JOB_KIT_REF}"
  missing="$(git_ref_missing "${dest}" FETCH_HEAD)"
  [ -z "${missing}" ] \
    || die "fetched ${JOB_KIT_SLUG}@${JOB_KIT_REF} is not a job-kit checkout (missing ${missing}); cache left unchanged"
  git -C "${dest}" checkout --detach FETCH_HEAD >/dev/null 2>&1 \
    || die "git checkout failed in ${dest} (local changes?)"
  echo "updated: ${dest} @ ${JOB_KIT_REF}"
}

# fetch_git_clone DEST
# Shallow-clones JOB_KIT_SLUG at JOB_KIT_REF into a DEST that does not exist.
# Removes the clone it just made when the result is not a job-kit checkout, so a
# wrong slug or ref cannot leave a foreign tree parked at the cache path where
# the ownership guard would then block every later run. Validates via
# `git_ref_missing` (object modes) rather than the filesystem probe alone, so a
# `core.symlinks=false` checkout that materializes mode-`120000` entries as
# plain files still fails before the cache is kept.
# Side effects: creates DEST; removes it again only on a failed layout check.
fetch_git_clone() {
  local dest="$1" missing
  mkdir -p "$(dirname "${dest}")" || die "failed to create: $(dirname "${dest}")"
  git clone --depth 1 --branch "${JOB_KIT_REF}" \
    "https://github.com/${JOB_KIT_SLUG}.git" "${dest}" || die "git clone failed"
  missing="$(git_ref_missing "${dest}" HEAD)"
  if [ -n "${missing}" ]; then
    rm -rf "${dest}"
    die "cloned ${JOB_KIT_SLUG}@${JOB_KIT_REF} is not a job-kit checkout (missing ${missing})"
  fi
  echo "cloned: ${dest} @ ${JOB_KIT_REF}"
}

# fetch_kit DEST [OWNERSHIP_FILES]
# Refreshes DEST at JOB_KIT_REF. Proves ownership before any mutation: a path
# that is not kit-owned (ownership signature) is never fetched into, checked
# out, or deleted, and a git-shaped DEST never enters the destructive tarball
# path. OWNERSHIP_FILES defaults to KIT_OWNERSHIP_FILES; the migration path
# passes KIT_LEGACY_OWNERSHIP_FILES so a cache from before the unified
# uninstaller is not rejected by the very signature it is being refreshed to
# gain. DEST is slash-normalized and symlink-resolved first so a cache behind a
# link is refreshed at its physical path (matching agent `pwd -P` markers).
# Side effects: creates or updates DEST.
fetch_kit() {
  local dest missing raw files
  raw="$(strip_trailing_slashes "$1")"
  files="${2:-${KIT_OWNERSHIP_FILES}}"
  if [ ! -L "${raw}" ] && [ ! -e "${raw}" ]; then
    dest="${raw}"
    if have git; then
      fetch_git_clone "${dest}"
    else
      fetch_tarball "${dest}" "${files}"
    fi
    return 0
  fi

  dest="$(resolve_cache_path "${raw}")"
  missing="$(kit_paths_missing "${dest}" "${files}")"
  [ -z "${missing}" ] \
    || die "cache path exists and is not a job-kit checkout (missing ${missing}): ${dest}"

  if [ -L "${dest}/.git" ] || [ -e "${dest}/.git" ]; then
    have git || die "cached checkout is a git repository but git is not installed: ${dest}"
    is_git_repo "${dest}" \
      || die "cache path has a .git entry but is not a usable git repository: ${dest}"
    fetch_git_update "${dest}"
    return 0
  fi

  fetch_tarball "${dest}" "${files}"
}

# require_checkout DIR
# Fails unless DIR has the full layout the channel installers expect for this
# revision (KIT_REQUIRED_FILES). Use after fetch, not as a pre-fetch ownership
# gate — legacy caches may lack skills added later.
# Side effects: none.
require_checkout() {
  local dir="$1" missing
  missing="$(kit_checkout_missing "${dir}")"
  [ -z "${missing}" ] || die "not a job-kit checkout (missing ${missing}): ${dir}"
}

# ensure_kit_cache DEST
# Ensures DEST is kit-owned and usable for uninstall (or freshly fetched).
# Absent → fetch_kit + full require_checkout. Present → ownership signature only
# (legacy caches without newer skills still pass; do not force a refresh — agent
# symlink ownership strings match install's pwd -P path).
# Side effects: may create DEST via fetch_kit.
ensure_kit_cache() {
  local dest raw missing
  raw="$(strip_trailing_slashes "$1")"
  if [ ! -L "${raw}" ] && [ ! -e "${raw}" ]; then
    fetch_kit "${raw}"
    require_checkout "${raw}"
    return 0
  fi
  dest="$(resolve_cache_path "${raw}")"
  missing="$(kit_owned_missing "${dest}")"
  if [ -n "${missing}" ]; then
    # Pre-single-uninstall caches still have channel uninstall.sh; refresh once,
    # probing with the legacy signature so the refresh is not rejected for the
    # very file it exists to install.
    if [ -z "$(kit_paths_missing "${dest}" "${KIT_LEGACY_OWNERSHIP_FILES}")" ] \
      && { [ -f "${dest}/scripts/aside/uninstall.sh" ] || [ -f "${dest}/scripts/agents/uninstall.sh" ]; }; then
      echo "refreshing kit cache (uninstall layout changed): ${dest}"
      fetch_kit "${raw}" "${KIT_LEGACY_OWNERSHIP_FILES}"
      require_checkout "${raw}"
      return 0
    fi
    # Caches from after unified uninstall but before unified install lack
    # scripts/install.sh. Prove with the ownership set minus that file.
    if [ ! -f "${dest}/scripts/install.sh" ] \
      && [ -z "$(kit_paths_missing "${dest}" "${KIT_LEGACY_OWNERSHIP_FILES}
scripts/uninstall.sh")" ]; then
      echo "refreshing kit cache (install layout changed): ${dest}"
      fetch_kit "${raw}" "${KIT_LEGACY_OWNERSHIP_FILES}
scripts/uninstall.sh"
      require_checkout "${raw}"
      return 0
    fi
    die "cache path exists and is not a job-kit checkout (missing ${missing}): ${dest}"
  fi
}

# aside_ready
# Exit 0 when Aside's skills parent exists, or ASIDE_SKILLS is set.
# Side effects: none.
aside_ready() {
  if [ -n "${ASIDE_SKILLS:-${ASIDE_SKILLS_USER:-}}" ]; then
    return 0
  fi
  [ -d "${HOME}/.aside/u/${ASIDE_ACCOUNT:-0}/skills" ]
}

# agents_ready
# Exit 0 when at least one coding-agent home exists, or CLAUDE_SKILLS is set.
# Side effects: none.
agents_ready() {
  if [ -n "${CLAUDE_SKILLS:-}" ]; then
    return 0
  fi
  [ -d "${HOME}/.claude" ] || [ -d "${HOME}/.agents" ] || [ -d "${HOME}/.grok" ]
}

# main
# Parses install channel or `uninstall [target]`, ensures cache, delegates.
# Side effects: may write/remove cache; runs install or uninstall scripts.
main() {
  local channel="all" mode="install" target="all" ran=0 arg purge=0
  # Bash 3.2: plain indexed array for agent uninstall flags (no --purge).
  local -a agent_flags
  agent_flags=()

  if [ "$#" -gt 0 ]; then
    case "$1" in
      uninstall)
        mode="uninstall"
        shift
        case "${1:-}" in
          all|aside|agents) target="$1"; shift ;;
        esac
        ;;
      all|aside|agents|fetch) channel="$1"; shift ;;
      -h|--help) usage; exit 0 ;;
    esac
  fi

  if [ "${mode}" = "uninstall" ]; then
    purge=0
    agent_flags=()
    for arg in "$@"; do
      case "${arg}" in
        --purge) purge=1; continue ;;
        -h|--help) usage; exit 0 ;;
      esac
      case "${target}" in
        all)
          die "uninstall all accepts only --purge (got: ${arg}); use 'uninstall agents' for --skip-*"
          ;;
        aside)
          die "uninstall aside accepts only --purge (got: ${arg})"
          ;;
        agents)
          case "${arg}" in
            --skip-claude|--skip-codex|--skip-grok)
              agent_flags[${#agent_flags[@]}]="${arg}"
              ;;
            *)
              die "unknown uninstall agents option: ${arg} (expected --skip-* or --purge)"
              ;;
          esac
          ;;
      esac
    done

    # Validate the purge before anything is uninstalled: a refused option
    # combination must leave the machine untouched, not half torn down.
    if [ "${purge}" -eq 1 ]; then
      # Agent skills symlink into JOB_KIT_HOME. Partial uninstall leaves some
      # of those links (or the whole agents channel) still pointing at the
      # cache — refuse to delete it until both channels are torn down.
      [ "${target}" = "all" ] \
        || die "refusing --purge with partial uninstall (use 'uninstall all --purge' or omit --purge)"
      # A skills-root override narrows its channel to that one destination, so
      # the default homes keep kit-owned links/copies that the purge would
      # strand. Unset it and rerun to uninstall the default homes too.
      [ -z "${CLAUDE_SKILLS:-}" ] \
        || die "refusing --purge while CLAUDE_SKILLS narrows the agents uninstall to ${CLAUDE_SKILLS} (unset it, or omit --purge)"
      [ -z "${ASIDE_SKILLS:-}" ] \
        || die "refusing --purge while ASIDE_SKILLS narrows the Aside uninstall to ${ASIDE_SKILLS} (unset it, or omit --purge)"
      [ -z "${ASIDE_SKILLS_USER:-}" ] \
        || die "refusing --purge while ASIDE_SKILLS_USER narrows the Aside uninstall to ${ASIDE_SKILLS_USER} (unset it, or omit --purge)"
    fi

    # Ownership only — uninstall scripts live in the ownership set; do not
    # require skills added after the cache was created (would block uninstall).
    ensure_kit_cache "${JOB_KIT_HOME}"

    case "${target}" in
      aside)
        bash "${JOB_KIT_HOME}/scripts/uninstall.sh" --yes aside
        ;;
      agents)
        if [ "${#agent_flags[@]}" -eq 0 ]; then
          bash "${JOB_KIT_HOME}/scripts/uninstall.sh" --yes agents
        else
          bash "${JOB_KIT_HOME}/scripts/uninstall.sh" --yes agents "${agent_flags[@]}"
        fi
        ;;
      all)
        # Skills only over curl — never deletes profile data (~/.config/job-kit).
        # With --purge, `cache` joins the same invocation so the composite
        # preflight runs before anything is unlinked: a survivor found after the
        # unlink pass would otherwise leave a failed, half-finished uninstall.
        if [ "${purge}" -eq 1 ]; then
          bash "${JOB_KIT_HOME}/scripts/uninstall.sh" --yes aside agents cache
        else
          bash "${JOB_KIT_HOME}/scripts/uninstall.sh" --yes aside agents
        fi
        ;;
    esac

    echo
    if [ "${purge}" -eq 1 ]; then
      echo "job-kit uninstall finished (cache purged)"
    else
      echo "job-kit uninstall finished"
      echo "  cache kept at: ${JOB_KIT_HOME}"
      echo "  reinstall: curl -fsSL https://raw.githubusercontent.com/${JOB_KIT_SLUG}/${JOB_KIT_REF}/scripts/remote.sh | bash -s -- all"
      echo "  purge cache: bash ${JOB_KIT_HOME}/scripts/remote.sh uninstall --purge"
      echo "           or: rm -rf ${JOB_KIT_HOME}"
    fi
    return 0
  fi

  fetch_kit "${JOB_KIT_HOME}"
  require_checkout "${JOB_KIT_HOME}"

  case "${channel}" in
    fetch) ;;
    aside)
      bash "${JOB_KIT_HOME}/scripts/aside/install.sh" "$@"
      ran=1
      ;;
    agents)
      bash "${JOB_KIT_HOME}/scripts/agents/install.sh" "$@"
      ran=1
      ;;
    all)
      for arg in "$@"; do
        [ "${arg}" = "--force" ] || die \
          "channel 'all' forwards only --force (got: ${arg}); use 'aside' or 'agents' for target flags"
      done
      if aside_ready; then
        bash "${JOB_KIT_HOME}/scripts/aside/install.sh" "$@"
        ran=1
      else
        echo "Aside: not set up (${HOME}/.aside/u/${ASIDE_ACCOUNT:-0}/skills missing); skipping."
      fi
      if agents_ready; then
        bash "${JOB_KIT_HOME}/scripts/agents/install.sh" "$@"
        ran=1
      else
        echo "Coding agents: no agent home (~/.claude, ~/.agents, ~/.grok); skipping."
      fi
      [ "${ran}" -eq 1 ] || die "nothing installed: no Aside profile and no coding-agent home"
      ;;
  esac

  echo
  echo "job-kit cached at: ${JOB_KIT_HOME}"
  echo "  keep it: agent skills symlink into it, Aside re-runs prove ownership by it"
  echo "  uninstall (interactive / profile): bash ${JOB_KIT_HOME}/scripts/uninstall.sh"
  echo "  uninstall (skills only): curl -fsSL https://raw.githubusercontent.com/${JOB_KIT_SLUG}/${JOB_KIT_REF}/scripts/remote.sh | bash -s -- uninstall"
}

main "$@"
