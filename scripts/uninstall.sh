#!/usr/bin/env bash
# Remove job-kit skill symlinks (and managed clone when not --local).
set -euo pipefail

DEFAULT_DIR="${HOME}/.job-kit"
DEFAULT_LINK_PARENTS="${HOME}/.grok/skills ${HOME}/.claude/skills ${HOME}/.agents/skills ${HOME}/.aside/u/0/skills/user"

usage() {
  cat <<'EOF'
Uninstall job-kit skill links.

Usage: uninstall.sh [options]

Options:
  -y, --yes       Skip confirmation (required noninteractive).
      --local     Remove links from local install; keep checkout.
      --dir PATH  Managed clone path (default: ~/.job-kit or $JOB_KIT_DIR).
  -h, --help      Show this help.

Does not delete profile checkouts or ~/.config/profile-root.
EOF
}

local_state_file() {
  printf '%s/job-kit/local-install-state\n' "${XDG_STATE_HOME:-${HOME}/.local/state}"
}

resolve_local_repo() {
  local script source_dir repo
  script="${BASH_SOURCE[0]}"
  case "${script}" in /*) ;; *) script="$(pwd -P)/${script}" ;; esac
  source_dir="$(cd "$(dirname "${script}")" && pwd -P)"
  script="${source_dir}/$(basename "${script}")"
  repo="$(cd "${source_dir}/.." && pwd -P)"
  [ "${script}" = "${repo}/scripts/uninstall.sh" ] || {
    echo "error: --local requires checked-out scripts/uninstall.sh" >&2
    exit 1
  }
  printf '%s\n' "${repo}"
}

skill_target_ok() {
  local target="$1" repo="$2" name
  for name in job-discovery job-apply profile-scaffold; do
    if [ "${target}" = "${repo}/skill/${name}" ]; then
      return 0
    fi
  done
  return 1
}

remove_links_for_repo() {
  local repo="$1" link_dir name dest current removed=0
  for link_dir in ${DEFAULT_LINK_PARENTS}; do
    [ -d "${link_dir}" ] || continue
    for name in job-discovery job-apply profile-scaffold; do
      dest="${link_dir}/${name}"
      if [ ! -L "${dest}" ]; then
        continue
      fi
      current="$(readlink "${dest}")"
      if skill_target_ok "${current}" "${repo}"; then
        rm -f "${dest}"
        echo "removed: ${dest}"
        removed=1
      fi
    done
  done
  if [ "${removed}" -eq 0 ]; then
    echo "no managed skill links found for ${repo}"
  fi
}

main() {
  local assume_yes=0 local_mode=0 dir_arg="" answer repo managed
  while [ "$#" -gt 0 ]; do
    case "$1" in
      -y|--yes) assume_yes=1 ;;
      --local) local_mode=1 ;;
      --dir)
        shift
        [ "$#" -gt 0 ] || { echo "error: --dir needs PATH" >&2; exit 2; }
        dir_arg="$1"
        ;;
      -h|--help) usage; exit 0 ;;
      *) echo "error: unknown option: $1" >&2; usage >&2; exit 2 ;;
    esac
    shift
  done

  if [ "${local_mode}" -eq 1 ]; then
    repo="$(resolve_local_repo)"
    if [ "${assume_yes}" -eq 0 ]; then
      if [ ! -t 0 ] && [ ! -r /dev/tty ]; then
        echo "error: noninteractive uninstall requires --yes" >&2
        exit 2
      fi
      printf 'Uninstall local job-kit links for %s?\nType UNINSTALL to continue: ' "${repo}"
      if [ -r /dev/tty ]; then
        IFS= read -r answer < /dev/tty || answer=""
      else
        IFS= read -r answer || answer=""
      fi
      [ "${answer}" = "UNINSTALL" ] || { echo "Cancelled."; exit 0; }
    fi
    remove_links_for_repo "${repo}"
    rm -f "$(local_state_file)"
    echo "Local uninstall completed; checkout preserved."
    exit 0
  fi

  managed="${dir_arg:-${JOB_KIT_DIR:-${DEFAULT_DIR}}}"
  if [ ! -d "${managed}" ]; then
    echo "already uninstalled: ${managed} missing"
    exit 0
  fi
  managed="$(cd "${managed}" && pwd -P)"
  if [ "${assume_yes}" -eq 0 ]; then
    if [ ! -t 0 ] && [ ! -r /dev/tty ]; then
      echo "error: noninteractive uninstall requires --yes" >&2
      exit 2
    fi
    printf 'Uninstall managed job-kit at %s (removes clone)?\nType UNINSTALL to continue: ' "${managed}"
    if [ -r /dev/tty ]; then
      IFS= read -r answer < /dev/tty || answer=""
    else
      IFS= read -r answer || answer=""
    fi
    [ "${answer}" = "UNINSTALL" ] || { echo "Cancelled."; exit 0; }
  fi
  remove_links_for_repo "${managed}"
  rm -rf "${managed}"
  echo "Managed uninstall completed; removed ${managed}"
}

main "$@"
