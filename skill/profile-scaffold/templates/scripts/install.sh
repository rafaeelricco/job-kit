#!/usr/bin/env bash
# Register this profile checkout as Profile root for job-kit skills.
# Compatible with the Bash 3.2 shipped by macOS.
set -euo pipefail

usage() {
  cat <<'EOF'
Register this profile checkout as Profile root.

Usage: install.sh [options]

Options:
  -y, --yes   No-op reserved for scripts; always non-interactive.
  -h, --help  Show this help.

Writes ~/.config/profile-root with this checkout's absolute path.
Requires job-kit skills to be installed (managed clone or link dirs).
EOF
}

resolve_repo() {
  local script source_dir repo
  script="${BASH_SOURCE[0]}"
  case "${script}" in /*) ;; *) script="$(pwd -P)/${script}" ;; esac
  [ -f "${script}" ] || {
    echo "error: install.sh must be run from this checkout's scripts/install.sh" >&2
    exit 1
  }
  source_dir="$(cd "$(dirname "${script}")" && pwd -P)"
  script="${source_dir}/$(basename "${script}")"
  repo="$(cd "${source_dir}/.." && pwd -P)"
  [ "${script}" = "${repo}/scripts/install.sh" ] || {
    echo "error: install.sh must be run from this checkout's scripts/install.sh" >&2
    exit 1
  }
  printf '%s\n' "${repo}"
}

kit_installed() {
  local d
  d="${ASIDE_SKILLS_USER:-${HOME}/.aside/u/${ASIDE_ACCOUNT:-0}/skills/user}/job-discovery"
  if [ -e "${d}/SKILL.md" ] || [ -L "${d}" ]; then
    return 0
  fi
  return 1
}

main() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      -y|--yes) ;;
      -h|--help) usage; exit 0 ;;
      *) echo "error: unknown option: $1" >&2; usage >&2; exit 2 ;;
    esac
    shift
  done

  REPO="$(resolve_repo)"
  if [ ! -f "${REPO}/data/candidate.yaml" ] || [ ! -f "${REPO}/data/job_search.yaml" ]; then
    echo "error: missing data/candidate.yaml or data/job_search.yaml under ${REPO}" >&2
    exit 1
  fi

  if ! kit_installed; then
    echo "error: job-kit skills not found in Aside." >&2
    echo "Install first:" >&2
    echo "  bash /path/to/job-kit/scripts/aside/install.sh" >&2
    exit 1
  fi

  mkdir -p "${HOME}/.config"
  printf '%s\n' "${REPO}" > "${HOME}/.config/profile-root"
  echo "Profile root registered: ${REPO}"
  echo "Wrote ${HOME}/.config/profile-root"
}

main "$@"
