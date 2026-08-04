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

# fetch_tarball DEST
# Downloads JOB_KIT_REF and replaces DEST. No git required.
# Side effects: may rm -rf DEST — only when DEST is absent or a kit checkout.
fetch_tarball() {
  local dest="$1" url stage parent
  if [ -e "${dest}" ] && [ ! -d "${dest}/skill" ]; then
    die "cache path exists and is not a job-kit checkout: ${dest}"
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
  rm -rf "${dest}"
  mv "${stage}" "${dest}" || { rm -rf "${stage}"; die "failed to cache: ${dest}"; }
  echo "fetched: ${dest} @ ${JOB_KIT_REF}"
}

# fetch_git DEST
# Shallow clone, or shallow fetch when DEST is already a git checkout.
# Falls back to fetch_tarball when DEST exists without .git (tarball cache).
# Side effects: may clone/fetch/checkout under DEST.
fetch_git() {
  local dest="$1"
  if [ -d "${dest}/.git" ]; then
    git -C "${dest}" fetch --depth 1 origin "${JOB_KIT_REF}" \
      || die "git fetch failed for ${JOB_KIT_REF}"
    git -C "${dest}" checkout --detach FETCH_HEAD >/dev/null 2>&1 \
      || die "git checkout failed in ${dest} (local changes?)"
    echo "updated: ${dest} @ ${JOB_KIT_REF}"
    return 0
  fi
  if [ -e "${dest}" ]; then
    fetch_tarball "${dest}"
    return 0
  fi
  mkdir -p "$(dirname "${dest}")" || die "failed to create: $(dirname "${dest}")"
  git clone --depth 1 --branch "${JOB_KIT_REF}" \
    "https://github.com/${JOB_KIT_SLUG}.git" "${dest}" || die "git clone failed"
  echo "cloned: ${dest} @ ${JOB_KIT_REF}"
}

# require_checkout DIR
# Fails unless DIR has the layout the channel installers expect.
# Side effects: none.
require_checkout() {
  local dir="$1" rel
  [ -d "${dir}/skill" ] || die "not a job-kit checkout (missing skill/): ${dir}"
  for rel in scripts/aside/install.sh scripts/agents/install.sh; do
    [ -f "${dir}/${rel}" ] || die "not a job-kit checkout (missing ${rel}): ${dir}"
  done
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

  if have git; then
    fetch_git "${JOB_KIT_HOME}"
  else
    fetch_tarball "${JOB_KIT_HOME}"
  fi
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
