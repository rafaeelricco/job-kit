#!/usr/bin/env bash
# Aside channel installer: copies kit skills into the Aside skills root.
# Compatible with macOS Bash 3.2. Local checkout only; no clone.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd -P)"
# shellcheck source=../common.sh
. "${REPO_ROOT}/scripts/common.sh"
# shellcheck source=lib.sh
. "${REPO_ROOT}/scripts/aside/lib.sh"

# usage — CLI help.
usage() {
  cat <<'EOF'
Install job-kit Aside skills (full copy into the Aside skills root).

Usage: aside/install.sh [--dry-run]
       aside/install.sh -h|--help

Options:
  --dry-run   Print the plan, copy nothing
  -h, --help  Show this help

Every run prints a plan first. On a TTY, confirm with [Y/n]; a pipe applies
after the plan. A foreign destination fails and names the path — remove it and
re-run. Kit-owned destinations refresh.

Environment:
  ASIDE_SKILLS   Absolute Aside builtin root (escape hatch)
  ASIDE_ACCOUNT  Aside account profile (default 0)
EOF
}

# plan_row_aside DEST NAME SOURCE REPO — one aside skill row.
# Args: DEST copy target, NAME skill basename, SOURCE skill dir, REPO checkout.
# Side effects: none (probes the destination only).
plan_row_aside() {
  local dest="$1" name="$2" source="$3" repo="$4"
  if [ ! -d "${source}" ] || [ ! -f "${source}/SKILL.md" ]; then
    printf 'N%ssource missing%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
    return 0
  fi
  if [ -L "${dest}" ] || [ -e "${dest}" ]; then
    if is_kit_owned "${dest}" "${repo}" "${name}" || is_exact_link "${dest}" "${source}"; then
      printf 'I%scopy (refresh)%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
    else
      printf 'N%sforeign%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
    fi
  else
    printf 'I%scopy%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
  fi
}

# plan_rows_aside — rows for the aside channel. No mutation.
# Args: none. Side effects: none.
plan_rows_aside() {
  local repo="${REPO_ROOT}"
  (
    local dest_root parent name source dest
    dest_root="$(resolve_aside_skills_root)" || exit 1
    parent="$(dirname "${dest_root}")"
    printf 'H%saside%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest_root}"
    if [ ! -d "${dest_root}" ] && [ ! -d "${parent}" ]; then
      printf 'N%sparent missing%s%s\n' "${ROW_FS}" "${ROW_FS}" "${parent}"
      exit 0
    fi
    for name in ${SKILL_NAMES}; do
      source="$(skill_source "${repo}" "${name}")"
      dest="$(skill_dest "${dest_root}" "${name}")"
      plan_row_aside "${dest}" "${name}" "${source}" "${repo}"
    done
  )
}

# install_aside — apply the Aside channel. No plan.
# Args: none. Side effects: mkdir, copy trees, remove kit-owned legacy paths.
install_aside() {
  local repo="${REPO_ROOT}"
  (
    local dest_root parent
    dest_root="$(resolve_aside_skills_root)" || exit 1
    parent="$(dirname "${dest_root}")"
    if [ ! -d "${dest_root}" ] && [ ! -d "${parent}" ]; then
      echo "error: Aside skills parent missing: ${parent}" >&2
      echo "  Install Aside Browser and sign in first (expected under ~/.aside)." >&2
      exit 1
    fi
    install_skills_into "${dest_root}" "${repo}" 0 || exit 1
    remove_legacy_user_skills "${repo}" "${dest_root}" "${SKILL_NAMES}" || exit 1
  )
}

# main ARGS… — parse argv, plan, gate, apply.
main() {
  local rows

  refuse_newline HOME "${HOME}"
  refuse_newline ASIDE_SKILLS "${ASIDE_SKILLS:-}"
  refuse_newline ASIDE_ACCOUNT "${ASIDE_ACCOUNT:-}"

  case "${HOME}" in
    /*) ;;
    *) die "HOME must be an absolute path (got: ${HOME})" ;;
  esac

  while [ "$#" -gt 0 ]; do
    case "$1" in
      -h|--help) usage; exit 0 ;;
      --dry-run) DRY_RUN=1 ;;
      *) die "unknown option: $1 (see --help)" ;;
    esac
    shift
  done

  if ! aside_supported; then
    echo "error: Aside is macOS-only (this host: $(uname -s)); nothing to install." >&2
    echo "  Set ASIDE_SKILLS to an absolute path to install anyway." >&2
    exit 1
  fi

  rows="$(plan_rows_aside)"
  run_channel_plan "${rows}" "Aside" install_aside
}

main "$@"
