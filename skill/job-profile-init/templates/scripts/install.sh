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

When this checkout is the host-default path-convention dir
($HOST_HOME/.config/job-kit) and no valid XDG job-kit profile would outrank
it, registration is path convention only — no pointer file. If
$XDG_CONFIG_HOME/job-kit already passes the probe, a durable pointer is
written so activation outranks that XDG path. Any host/Aside pointer that
still names another profile is removed (requires --yes).

Every other path (including $XDG_CONFIG_HOME/job-kit when that differs) writes
~/.config/profile-root so coding agents and Aside can still resolve it.
Resolves the HOST home first: run inside Aside (HOME ending in
/.aside/runtime/home) the pointer still lands on the real user home.
Non-convention paths also mirror into
<host>/.aside/runtime/home/.config/profile-root when that Aside runtime home
directory already exists.
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

host_default_root() {
  # Aside-visible default when XDG is unset.
  printf '%s/.config/job-kit\n' "$(resolve_host_home)"
}

job_kit_config() {
  # Same path skills probe by convention in this process (step 4).
  if [ -n "${XDG_CONFIG_HOME:-}" ]; then
    printf '%s/job-kit\n' "${XDG_CONFIG_HOME}"
  else
    host_default_root
  fi
}

paths_equal() {
  # $1 and $2 — true when same path (string or pwd -P when both exist).
  local a="$1" b="$2"
  [ "${a}" = "${b}" ] && return 0
  if [ -d "${a}" ] && [ -d "${b}" ]; then
    [ "$(cd "${a}" && pwd -P)" = "$(cd "${b}" && pwd -P)" ]
    return $?
  fi
  return 1
}

passes_probe() {
  local root="$1"
  [ -d "${root}" ] || return 1
  [ -f "${root}/data/candidate.yaml" ] && [ -f "${root}/data/job_search.yaml" ]
}

write_pointer() {
  # $1 = pointer file. Write, then read back: a silent failure here leaves the
  # operator with a profile the skills cannot resolve. Returns non-zero rather
  # than exiting so callers can roll back a pointer they already wrote.
  mkdir -p "$(dirname "$1")" || return 1
  printf '%s\n' "${REPO}" > "$1" || return 1
  [ "$(tr -d '\n' < "$1")" = "${REPO}" ] || {
    echo "error: pointer write did not stick: $1" >&2
    return 1
  }
}

mirror_aside_runtime() {
  local aside_rt
  aside_rt="${HOST_HOME}/.aside/runtime/home"
  if [ -d "${aside_rt}" ]; then
    write_pointer "${aside_rt}/.config/profile-root"
  fi
}

activate_pointers() {
  # $1 = host pointer. Write it, then mirror. A mirror failure would otherwise
  # leave agents on the new profile while Aside still resolves the old one
  # (job-scout reads the mirror first), so roll the host pointer back to exactly
  # what it was.
  local pointer="$1" backup=""
  if [ -f "${pointer}" ]; then
    backup="$(mktemp)"
    cp "${pointer}" "${backup}"
  fi
  if write_pointer "${pointer}" && mirror_aside_runtime; then
    if [ -n "${backup}" ]; then
      rm -f "${backup}"
    fi
    return 0
  fi
  if [ -n "${backup}" ]; then
    cp "${backup}" "${pointer}"
    rm -f "${backup}"
    echo "error: activation failed; restored previous ${pointer}" >&2
  else
    rm -f "${pointer}"
    echo "error: activation failed; removed partial ${pointer}" >&2
  fi
  exit 1
}

# Remove host pointer + mirror together. On partial failure restore both.
clear_pointers_atomic() {
  local pointer="$1" mirror="$2"
  local ptr_backup="" mir_backup="" had_pointer=0 had_mirror=0
  if [ -f "${pointer}" ]; then
    had_pointer=1
    ptr_backup="$(mktemp)"
    cp "${pointer}" "${ptr_backup}"
  fi
  if [ -f "${mirror}" ]; then
    had_mirror=1
    mir_backup="$(mktemp)"
    cp "${mirror}" "${mir_backup}"
  fi
  if [ "${had_pointer}" -eq 1 ]; then
    if ! rm -f "${pointer}"; then
      [ -n "${ptr_backup}" ] && rm -f "${ptr_backup}"
      [ -n "${mir_backup}" ] && rm -f "${mir_backup}"
      echo "error: failed to remove ${pointer}" >&2
      return 1
    fi
  fi
  if [ "${had_mirror}" -eq 1 ]; then
    if ! rm -f "${mirror}"; then
      if [ "${had_pointer}" -eq 1 ] && [ -n "${ptr_backup}" ]; then
        cp "${ptr_backup}" "${pointer}"
      fi
      [ -n "${ptr_backup}" ] && rm -f "${ptr_backup}"
      [ -n "${mir_backup}" ] && rm -f "${mir_backup}"
      echo "error: failed to remove ${mirror}; restored previous host pointer" >&2
      return 1
    fi
  fi
  [ -n "${ptr_backup}" ] && rm -f "${ptr_backup}"
  [ -n "${mir_backup}" ] && rm -f "${mir_backup}"
  if [ "${had_pointer}" -eq 1 ]; then
    echo "removed ${pointer}"
  fi
  if [ "${had_mirror}" -eq 1 ]; then
    echo "removed ${mirror}"
  fi
  return 0
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
  local assume_yes=0 current current_canon result pointer mirror
  local shadow shadow_label mirror_line HOST_DEFAULT CONVENTION_ROOT
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

  HOST_DEFAULT="$(host_default_root)"
  CONVENTION_ROOT="$(job_kit_config)"
  pointer="${HOST_HOME}/.config/profile-root"
  mirror="${HOST_HOME}/.aside/runtime/home/.config/profile-root"

  # Path-convention for host-default only when no valid XDG convention profile
  # would outrank it (resolve probes XDG JOB_KIT_CONFIG before host-default).
  # If XDG job-kit already passes the probe, write a pointer so activation wins.
  if paths_equal "${REPO}" "${HOST_DEFAULT}"; then
    if ! paths_equal "${CONVENTION_ROOT}" "${HOST_DEFAULT}" && passes_probe "${CONVENTION_ROOT}"; then
      : # fall through to pointer write so host-default outranks XDG
    else
      shadow=""
      shadow_label=""
      if [ -f "${pointer}" ]; then
        current="$(tr -d '\n' < "${pointer}")"
        if [ -n "${current}" ] && [ -d "${current}" ]; then
          current_canon="$(cd "${current}" && pwd -P)"
        else
          current_canon=""
        fi
        if [ -n "${current}" ] && [ "${current_canon}" != "${REPO}" ]; then
          if [ -n "${current_canon}" ]; then
            shadow="${current_canon}"
          else
            shadow="${current}"
          fi
          shadow_label="host pointer"
        fi
      fi
      if [ -z "${shadow}" ] && [ -f "${mirror}" ]; then
        mirror_line="$(tr -d '\n' < "${mirror}")"
        if [ -n "${mirror_line}" ] && [ "${mirror_line}" != "${REPO}" ]; then
          if [ -d "${mirror_line}" ]; then
            shadow="$(cd "${mirror_line}" && pwd -P)"
          else
            shadow="${mirror_line}"
          fi
          shadow_label="Aside runtime mirror"
        fi
      fi
      if [ -n "${shadow}" ]; then
        if [ "${assume_yes}" -ne 1 ]; then
          echo "error: profile root already registered: ${shadow} (${shadow_label})" >&2
          echo "  use --yes to switch to host-default ${REPO} (clears shadowing pointers)" >&2
          exit 2
        fi
        clear_pointers_atomic "${pointer}" "${mirror}" || exit 1
        echo "switched: ${shadow} -> host-default ${REPO}"
        exit 0
      fi
      # Redundant pointer/mirror naming this same host-default.
      if [ -f "${pointer}" ]; then
        current="$(tr -d '\n' < "${pointer}")"
        if [ -n "${current}" ] && [ -d "${current}" ] && [ "$(cd "${current}" && pwd -P)" = "${REPO}" ]; then
          clear_pointers_atomic "${pointer}" "${mirror}" || exit 1
          echo "registered (host-default location): ${REPO}"
          exit 0
        fi
      fi
      if [ -f "${mirror}" ] && [ "$(tr -d '\n' < "${mirror}")" = "${REPO}" ]; then
        clear_pointers_atomic "${pointer}" "${mirror}" || exit 1
      fi
      echo "registered (host-default location): ${REPO}"
      exit 0
    fi
  fi

  result="registered: ${REPO}"
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
        activate_pointers "${pointer}"
      else
        mirror_aside_runtime || {
          echo "error: Aside runtime mirror write failed under ${HOST_HOME}" >&2
          exit 1
        }
      fi
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
    elif [ -n "${current}" ]; then
      # Non-empty but unresolvable: it may name a live profile this process
      # cannot traverse (Aside FS sandbox). Not a free slot — gate it too.
      if [ "${assume_yes}" -eq 1 ]; then
        result="switched: ${current} (unresolvable) -> ${REPO}"
      else
        echo "error: profile root already registered but not resolvable: ${current}" >&2
        echo "  it may be a live profile this process cannot traverse" >&2
        echo "  use --yes to switch to ${REPO}" >&2
        exit 2
      fi
    fi
  fi

  activate_pointers "${pointer}"
  echo "${result}"
}

main "$@"
