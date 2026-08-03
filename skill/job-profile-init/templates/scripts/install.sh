#!/usr/bin/env bash
# Register this profile checkout as Profile root for job-kit skills.
# Compatible with the Bash 3.2 shipped by macOS.
set -euo pipefail

usage() {
  cat <<'EOF'
Register this profile checkout as Profile root.

Usage: install.sh [options]

Options:
  -y, --yes   Overwrite a registration pointing at a different profile.
  -h, --help  Show this help.

Writes ~/.config/profile-root with this checkout's absolute path.
Resolves the HOST home first: run inside Aside (HOME ending in
/.aside/runtime/home) the pointer still lands on the real user home.
Also mirrors into <host>/.aside/runtime/home/.config/profile-root when that
Aside runtime home directory already exists.
EOF
}

resolve_host_home() {
  # Inside Aside, HOME is <host>/.aside/runtime/home. Strip that suffix so the
  # host pointer is not written into the sandbox tree — and re-nested each run.
  local suffix="/.aside/runtime/home"
  case "${HOME}" in
    *"${suffix}") printf '%s\n' "${HOME%${suffix}}" ;;
    *) printf '%s\n' "${HOME}" ;;
  esac
}

write_pointer() {
  # $1 = pointer file. Write, then read back: a silent failure here leaves the
  # operator with a profile the skills cannot resolve.
  mkdir -p "$(dirname "$1")"
  printf '%s\n' "${REPO}" > "$1"
  [ "$(tr -d '\n' < "$1")" = "${REPO}" ] || {
    echo "error: pointer write did not stick: $1" >&2
    exit 1
  }
}

mirror_aside_runtime() {
  local aside_rt
  aside_rt="${HOST_HOME}/.aside/runtime/home"
  if [ -d "${aside_rt}" ]; then
    write_pointer "${aside_rt}/.config/profile-root"
  fi
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

main() {
  local assume_yes=0 current current_canon result pointer
  while [ "$#" -gt 0 ]; do
    case "$1" in
      -y|--yes) assume_yes=1 ;;
      -h|--help) usage; exit 0 ;;
      *) echo "error: unknown option: $1" >&2; usage >&2; exit 2 ;;
    esac
    shift
  done

  REPO="$(resolve_repo)"
  HOST_HOME="$(resolve_host_home)"
  if [ ! -f "${REPO}/data/candidate.yaml" ] || [ ! -f "${REPO}/data/job_search.yaml" ]; then
    echo "error: missing data/candidate.yaml or data/job_search.yaml under ${REPO}" >&2
    exit 1
  fi

  result="registered: ${REPO}"
  pointer="${HOST_HOME}/.config/profile-root"
  if [ -f "${pointer}" ]; then
    current="$(tr -d '\n' < "${pointer}")"
    if [ -n "${current}" ] && [ -d "${current}" ]; then
      current_canon="$(cd "${current}" && pwd -P)"
    else
      current_canon=""
    fi
    if [ "${current_canon}" = "${REPO}" ]; then
      # Normalize symlink / .. forms so uninstall's path match succeeds.
      if [ "${current}" != "${REPO}" ]; then
        write_pointer "${pointer}"
      fi
      mirror_aside_runtime
      echo "already registered: ${REPO}"
      exit 0
    fi
    if [ -n "${current_canon}" ]; then
      if [ "${assume_yes}" -eq 1 ]; then
        result="switched: ${current_canon} -> ${REPO}"
      else
        echo "error: profile root already registered: ${current_canon}" >&2
        echo "  use --yes to switch to ${REPO}" >&2
        exit 2
      fi
    fi
  fi

  write_pointer "${pointer}"
  mirror_aside_runtime
  echo "${result}"
}

main "$@"
