#!/usr/bin/env bash
# Fetch job-kit into a cached checkout, then run the channel installers.
# Compatible with macOS Bash 3.2. Safe to pipe: curl -fsSL … | bash -s -- all
set -euo pipefail

JOB_KIT_SLUG="${JOB_KIT_SLUG:-rafaeelricco/job-kit}"
JOB_KIT_REF="${JOB_KIT_REF:-main}"
JOB_KIT_HOME="${JOB_KIT_HOME:-${XDG_DATA_HOME:-${HOME}/.local/share}/job-kit}"

# usage
# Prints CLI help to stdout.
# Side effects: none.
usage() {
  cat <<'EOF'
Install job-kit skills without cloning by hand.

Usage: remote.sh [channel] [installer options…]

Channels:
  all       Aside + coding agents, skipping absent targets (default)
  aside     Aside only (fails when Aside is not set up)
  agents    Coding agents only (fails when no agent home exists)
  fetch     Refresh the cached checkout, install nothing
  -h, --help  Show this help

Options after the channel are forwarded to the channel installer, e.g.
`remote.sh agents --skip-codex`. Channel `all` forwards only --force;
use an explicit channel for target-specific flags.

Environment:
  JOB_KIT_HOME  Cached checkout (default $XDG_DATA_HOME/job-kit)
  JOB_KIT_REF   Branch or tag to fetch (default main)
  JOB_KIT_SLUG  GitHub owner/repo (default rafaeelricco/job-kit)

Keeps the cached checkout in place: coding-agent skills symlink into it, and
Aside re-installs read it to prove kit ownership.
EOF
}

# have CMD
# Exit 0 when CMD is on PATH.
# Side effects: none.
have() { command -v "$1" >/dev/null 2>&1; }

# die MSG…
# Prints an error to stderr and exits 1.
die() { echo "error: $*" >&2; exit 1; }

# Files that, together with `skill/`, make a tree a usable job-kit checkout:
# the channel installers, plus the SKILL.md of every skill they install. The
# payload matters as much as the scripts — `require_skill_source` in
# scripts/{agents,aside}/lib.sh rejects a skill without SKILL.md, and by then
# the cache has already been replaced. Single source of truth for both the
# filesystem and the git-ref layout probes.
KIT_REQUIRED_FILES="scripts/agents/install.sh scripts/agents/lib.sh
scripts/aside/install.sh scripts/aside/lib.sh
skill/job-profile-init/SKILL.md
skill/job-scout/SKILL.md
skill/job-application/SKILL.md"

# kit_checkout_missing DIR
# Prints the first required job-kit path missing from DIR; prints nothing when
# DIR is a complete checkout. Gates destructive replacement, so a stray `skill/`
# alone must never be enough to mark a directory as kit-owned.
# Side effects: none.
kit_checkout_missing() {
  local dir="$1" rel
  if [ ! -d "${dir}/skill" ]; then
    printf '%s\n' "skill/"
    return 0
  fi
  for rel in ${KIT_REQUIRED_FILES}; do
    if [ ! -f "${dir}/${rel}" ]; then
      printf '%s\n' "${rel}"
      return 0
    fi
  done
}

# git_ref_missing DIR REF
# Prints the first required job-kit path that REF does not carry with the right
# object type in the repository at DIR; prints nothing when REF is a complete
# checkout. Probes the object store, so an update can be rejected before it
# reaches the working tree. Matches on type, not mere existence, to mirror the
# `-d` / `-f` tests in kit_checkout_missing — a blob named `skill` is not a
# skills directory.
# Side effects: none.
git_ref_missing() {
  local dir="$1" ref="$2" rel
  if [ "$(git -C "${dir}" cat-file -t "${ref}:skill" 2>/dev/null)" != "tree" ]; then
    printf '%s\n' "skill/"
    return 0
  fi
  for rel in ${KIT_REQUIRED_FILES}; do
    if [ "$(git -C "${dir}" cat-file -t "${ref}:${rel}" 2>/dev/null)" != "blob" ]; then
      printf '%s\n' "${rel}"
      return 0
    fi
  done
}

# fetch_tarball DEST
# Downloads JOB_KIT_REF, verifies the extracted tree, then replaces DEST. No git
# required. DEST is removed only once the download proves to be a complete
# job-kit checkout, so a wrong-repo or wrong-ref fetch leaves the cache intact.
# Side effects: may rm -rf DEST — only when DEST is absent or a complete checkout.
fetch_tarball() {
  local dest="$1" url stage parent missing
  if [ -e "${dest}" ]; then
    missing="$(kit_checkout_missing "${dest}")"
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
# the ownership guard would then block every later run.
# Side effects: creates DEST; removes it again only on a failed layout check.
fetch_git_clone() {
  local dest="$1" missing
  mkdir -p "$(dirname "${dest}")" || die "failed to create: $(dirname "${dest}")"
  git clone --depth 1 --branch "${JOB_KIT_REF}" \
    "https://github.com/${JOB_KIT_SLUG}.git" "${dest}" || die "git clone failed"
  missing="$(kit_checkout_missing "${dest}")"
  if [ -n "${missing}" ]; then
    rm -rf "${dest}"
    die "cloned ${JOB_KIT_SLUG}@${JOB_KIT_REF} is not a job-kit checkout (missing ${missing})"
  fi
  echo "cloned: ${dest} @ ${JOB_KIT_REF}"
}

# fetch_kit DEST
# Refreshes DEST at JOB_KIT_REF. Proves ownership before any mutation: a path
# that is not already a complete job-kit checkout is never fetched into, checked
# out, or deleted, and a git-shaped DEST never enters the destructive tarball
# path.
# Side effects: creates or updates DEST.
fetch_kit() {
  local dest="$1" missing
  if [ ! -e "${dest}" ]; then
    if have git; then
      fetch_git_clone "${dest}"
    else
      fetch_tarball "${dest}"
    fi
    return 0
  fi

  missing="$(kit_checkout_missing "${dest}")"
  [ -z "${missing}" ] \
    || die "cache path exists and is not a job-kit checkout (missing ${missing}): ${dest}"

  if [ -e "${dest}/.git" ]; then
    have git || die "cached checkout is a git repository but git is not installed: ${dest}"
    is_git_repo "${dest}" \
      || die "cache path has a .git entry but is not a usable git repository: ${dest}"
    fetch_git_update "${dest}"
    return 0
  fi

  fetch_tarball "${dest}"
}

# require_checkout DIR
# Fails unless DIR has the layout the channel installers expect.
# Side effects: none.
require_checkout() {
  local dir="$1" missing
  missing="$(kit_checkout_missing "${dir}")"
  [ -z "${missing}" ] || die "not a job-kit checkout (missing ${missing}): ${dir}"
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
# Parses the channel, refreshes the cache, delegates to channel installers.
# Side effects: writes the cached checkout; runs installers.
main() {
  local channel="all" ran=0 arg
  if [ "$#" -gt 0 ]; then
    case "$1" in
      all|aside|agents|fetch) channel="$1"; shift ;;
      -h|--help) usage; exit 0 ;;
    esac
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
  echo "  uninstall: bash ${JOB_KIT_HOME}/scripts/aside/uninstall.sh"
  echo "             bash ${JOB_KIT_HOME}/scripts/agents/uninstall.sh"
}

main "$@"
