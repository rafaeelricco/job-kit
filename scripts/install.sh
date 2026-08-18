#!/usr/bin/env bash
# Single job-kit installer: interactive menu or target args.
# Compatible with macOS Bash 3.2. Local checkout only; no clone.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"

FORCE=0
YES=0
SKIP_CLAUDE=0
SKIP_CODEX=0
SKIP_GROK=0
DRY_RUN=0
ONLY_TARGETS=""
# Aside skill subset from --only; empty means every SKILL_NAMES entry.
ASIDE_ONLY=""
# Soft-skip missing parents when installing multiple channels (all).
SOFT_SKIP=0
# Row field separator. Not TAB: TAB is IFS-whitespace, so `read` collapses an
# empty field and shifts the path left into the label.
ROW_FS="$(printf '\037')"

# die MSG…
# Prints an error to stderr and exits 1.
die() { echo "error: $*" >&2; exit 1; }

# refuse_newline NAME VALUE — die when VALUE carries a line break.
refuse_newline() {
  local name="$1" value="$2"
  case "${value}" in
    *"
"*) die "${name} must not contain a line break" ;;
  esac
}

# usage — CLI help.
usage() {
  cat <<'EOF'
Install job-kit skills (Aside + coding agents).

Usage: install.sh                 # interactive menu (TTY required)
       install.sh <target>…       # non-interactive (one or more targets)
       install.sh -h|--help

Targets:
  aside     Aside skills (job-scout, job-apply, job-profile-me, job-list) — full copy
  agents    Coding-agent skills (job-profile-init, job-profile-me, job-list, job-stories)
  all       aside + agents

Options:
  -y, --yes     Skip confirmations (TTY plan gate)
  --dry-run     Print the plan, remove nothing
  --force       Replace foreign files/dirs/links at the destination
  --only LIST   Comma-separated subset, instead of positional targets:
                aside | job-scout | job-apply | job-profile-me | job-list
                agents | claude | codex | grok
                (job-profile-me also installs job-scout — packs mutate
                needs its surface-*.md stems)
  --skip-claude|--skip-codex|--skip-grok
                Applied only when agents runs
  -h, --help    Show this help

Every run prints a plan first. On a TTY, confirm with [Y/n] (or pass --yes).
Non-TTY applies after the plan without prompting (pipe-safe).

Environment:
  CLAUDE_SKILLS  Absolute skills directory — single dest only (escape hatch).
                 When set, skip flags are ignored.
  ASIDE_SKILLS / ASIDE_SKILLS_USER / ASIDE_ACCOUNT
                 Same overrides as the Aside channel installer

Local checkout only; no clone. Channel wrappers:
  scripts/aside/install.sh → install.sh aside
  scripts/agents/install.sh → install.sh agents
EOF
}

# path_display PATH — print PATH with $HOME replaced by ~ (display only).
path_display() {
  local p="$1"
  case "${p}" in
    "${HOME}") printf '~\n' ;;
    "${HOME}"/*) printf '~%s\n' "${p#"${HOME}"}" ;;
    *) printf '%s\n' "${p}" ;;
  esac
}

# skill_leaf ROOT PATH — print PATH's single child name when PATH is ROOT/name;
# otherwise print nothing (non-skill / nested / unrelated).
skill_leaf() {
  local root="$1" path="$2" rest
  case "${path}" in
    "${root}"/*)
      rest="${path#"${root}"/}"
      case "${rest}" in
        ""|*/*) return 0 ;;
        *) printf '%s\n' "${rest}" ;;
      esac
      ;;
  esac
}

# aside_selected NAME — 0 when --only keeps NAME in the aside walk.
aside_selected() {
  [ -n "${ASIDE_ONLY}" ] || return 0
  case " ${ASIDE_ONLY} " in
    *" $1 "*) return 0 ;;
    *) return 1 ;;
  esac
}

# expand_only LIST — map --only tokens onto targets, SKIP_*, and ASIDE_ONLY.
expand_only() {
  local list="$1" tok
  local want_aside=0 want_agents=0
  local want_claude=0 want_codex=0 want_grok=0 named_agent=0 whole_aside=0
  for tok in $(printf '%s' "${list}" | tr ',' ' '); do
    case "${tok}" in
      aside) want_aside=1; whole_aside=1 ;;
      job-scout|job-apply|job-profile-me|job-list)
        want_aside=1
        [ -n "${ASIDE_ONLY}" ] && ASIDE_ONLY="${ASIDE_ONLY} ${tok}" || ASIDE_ONLY="${tok}" ;;
      agents) want_agents=1; want_claude=1; want_codex=1; want_grok=1 ;;
      claude) want_agents=1; named_agent=1; want_claude=1 ;;
      codex)  want_agents=1; named_agent=1; want_codex=1 ;;
      grok)   want_agents=1; named_agent=1; want_grok=1 ;;
      *) die "unknown --only item: ${tok} (aside|job-scout|job-apply|job-profile-me|job-list|agents|claude|codex|grok)" ;;
    esac
  done
  if [ "${named_agent}" -eq 1 ]; then
    [ "${want_claude}" -eq 1 ] || SKIP_CLAUDE=1
    [ "${want_codex}" -eq 1 ] || SKIP_CODEX=1
    [ "${want_grok}" -eq 1 ] || SKIP_GROK=1
  fi
  [ "${whole_aside}" -eq 0 ] || ASIDE_ONLY=""
  # job-profile-me packs add/remove validates impl against job-scout's
  # surface-*.md stems; standalone config without scout is unusable.
  if [ -n "${ASIDE_ONLY}" ]; then
    case " ${ASIDE_ONLY} " in
      *" job-profile-me "*)
        case " ${ASIDE_ONLY} " in
          *" job-scout "*) ;;
          *) ASIDE_ONLY="${ASIDE_ONLY} job-scout" ;;
        esac
        ;;
    esac
  fi
  [ "${want_aside}" -eq 0 ] || ONLY_TARGETS="${ONLY_TARGETS} aside"
  [ "${want_agents}" -eq 0 ] || ONLY_TARGETS="${ONLY_TARGETS} agents"
  [ -n "${ONLY_TARGETS}" ] || die "--only selected nothing"
}

# plan_row_aside DEST NAME SOURCE FORCE REPO — one aside skill row.
plan_row_aside() {
  local dest="$1" name="$2" source="$3" force="$4" repo="$5"
  if [ ! -d "${source}" ] || [ ! -f "${source}/SKILL.md" ]; then
    printf 'N%ssource missing%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
    return 0
  fi
  if [ -L "${dest}" ] || [ -e "${dest}" ]; then
    if is_kit_owned "${dest}" "${repo}" "${name}" || is_exact_link "${dest}" "${source}"; then
      printf 'I%scopy (refresh)%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
    elif [ "${force}" -eq 1 ]; then
      printf 'I%scopy (force)%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
    else
      printf 'N%sforeign (need --force)%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
    fi
  else
    printf 'I%scopy%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
  fi
}

# plan_row_agent DEST NAME SOURCE FORCE — one agents skill row (symlink).
plan_row_agent() {
  local dest="$1" name="$2" source="$3" force="$4"
  if [ ! -d "${source}" ] || [ ! -f "${source}/SKILL.md" ]; then
    printf 'N%ssource missing%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
    return 0
  fi
  if is_exact_link "${dest}" "${source}"; then
    printf 'N%sup to date%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
    return 0
  fi
  if [ -L "${dest}" ] || [ -e "${dest}" ]; then
    if [ "${force}" -eq 1 ]; then
      printf 'I%slink (force)%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
    else
      printf 'N%sforeign (need --force)%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
    fi
    return 0
  fi
  printf 'I%slink%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
}

# plan_rows_aside — rows for the aside target. No mutation.
plan_rows_aside() {
  local repo="${REPO_ROOT}" force="${FORCE}" aside_only="${ASIDE_ONLY}" soft="${SOFT_SKIP}"
  (
    # shellcheck source=aside/lib.sh
    . "${repo}/scripts/aside/lib.sh"
    local dest_root parent name source dest
    dest_root="$(resolve_aside_skills_root)" || exit 1
    parent="$(dirname "${dest_root}")"
    printf 'H%saside%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest_root}"
    if [ ! -d "${dest_root}" ] && [ ! -d "${parent}" ]; then
      if [ "${soft}" -eq 1 ]; then
        printf 'N%sparent missing%s%s\n' "${ROW_FS}" "${ROW_FS}" "${parent}"
        exit 0
      fi
      printf 'N%sparent missing%s%s\n' "${ROW_FS}" "${ROW_FS}" "${parent}"
      exit 0
    fi
    for name in ${SKILL_NAMES}; do
      if [ -n "${aside_only}" ]; then
        case " ${aside_only} " in
          *" ${name} "*) ;;
          *)
            printf 'N%snot selected%s%s\n' "${ROW_FS}" "${ROW_FS}" "$(skill_dest "${dest_root}" "${name}")"
            continue
            ;;
        esac
      fi
      source="$(skill_source "${repo}" "${name}")"
      dest="$(skill_dest "${dest_root}" "${name}")"
      plan_row_aside "${dest}" "${name}" "${source}" "${force}" "${repo}"
    done
  )
}

# plan_rows_agents — rows for the agents target. No mutation.
plan_rows_agents() {
  local repo="${REPO_ROOT}" force="${FORCE}"
  local skip_claude="${SKIP_CLAUDE}" skip_codex="${SKIP_CODEX}" skip_grok="${SKIP_GROK}"
  (
    # shellcheck source=agents/lib.sh
    . "${repo}/scripts/agents/lib.sh"
    local override target root parent label name source dest
    override="$(resolve_override_skills)" || exit 1
    if [ -n "${override}" ]; then
      printf 'H%sagents (override)%s%s\n' "${ROW_FS}" "${ROW_FS}" "${override}"
      for name in ${SKILL_NAMES}; do
        source="$(skill_source "${repo}" "${name}")"
        dest="$(skill_dest "${override}" "${name}")"
        plan_row_agent "${dest}" "${name}" "${source}" "${force}"
      done
      exit 0
    fi
    for target in ${AGENT_TARGETS}; do
      root="$(agent_skills_root "${target}")"
      label="$(agent_label "${target}")"
      if [ "${target}" = claude ] && [ "${skip_claude}" -eq 1 ]; then
        printf 'N%sskipped (--skip-claude)%s%s\n' "${ROW_FS}" "${ROW_FS}" "${root}"
        continue
      elif [ "${target}" = codex ] && [ "${skip_codex}" -eq 1 ]; then
        printf 'N%sskipped (--skip-codex)%s%s\n' "${ROW_FS}" "${ROW_FS}" "${root}"
        continue
      elif [ "${target}" = grok ] && [ "${skip_grok}" -eq 1 ]; then
        printf 'N%sskipped (--skip-grok)%s%s\n' "${ROW_FS}" "${ROW_FS}" "${root}"
        continue
      fi
      parent="$(agent_parent_dir "${target}")"
      if [ ! -d "${parent}" ]; then
        printf 'H%sagents · %s%s%s\n' "${ROW_FS}" "${label}" "${ROW_FS}" "${root}"
        printf 'N%sparent missing%s%s\n' "${ROW_FS}" "${ROW_FS}" "${parent}"
        continue
      fi
      printf 'H%sagents · %s%s%s\n' "${ROW_FS}" "${label}" "${ROW_FS}" "${root}"
      for name in ${SKILL_NAMES}; do
        source="$(skill_source "${repo}" "${name}")"
        dest="$(skill_dest "${root}" "${name}")"
        plan_row_agent "${dest}" "${name}" "${source}" "${force}"
      done
    done
  )
}

# build_plan TARGET… — every manifest row, in apply order.
build_plan() {
  local t
  for t in "$@"; do
    case "${t}" in
      aside) plan_rows_aside ;;
      agents) plan_rows_agents ;;
    esac
  done
}

# plan_count ROWS KIND… — how many rows carry any of KIND.
plan_count() {
  local rows="$1" kind label path want n=0
  shift
  while IFS="${ROW_FS}" read -r kind label path; do
    [ -n "${kind}" ] || continue
    for want in "$@"; do
      [ "${kind}" = "${want}" ] || continue
      n=$((n + 1))
      break
    done
  done <<EOF
${rows}
EOF
  printf '%s\n' "${n}"
}

# plan_has_blockers ROWS — 0 when any foreign-without-force row exists.
plan_has_blockers() {
  local rows="$1" kind label path
  while IFS="${ROW_FS}" read -r kind label path; do
    [ -n "${kind}" ] || continue
    [ "${kind}" = N ] || continue
    case "${label}" in
      "foreign (need --force)"|"source missing") return 0 ;;
    esac
  done <<EOF
${rows}
EOF
  return 1
}

# render_plan ROWS — print the manifest to stdout (install title).
render_plan() {
  local rows="$1" kind label path
  local section_root="" section_started=0
  local pend_label="" pend_names="" leaf action rest

  flush_pend() {
    [ -n "${pend_label}" ] || return 0
    printf '  %-16s %s\n' "${pend_label}" "${pend_names}"
    pend_label=""
    pend_names=""
  }

  emit_body() {
    local k="$1" lab="$2" p="$3"
    leaf=""
    [ -n "${section_root}" ] && leaf="$(skill_leaf "${section_root}" "${p}")"

    if [ "${k}" = N ] && [ -n "${leaf}" ]; then
      if [ "${pend_label}" = "${lab}" ]; then
        pend_names="${pend_names}, ${leaf}"
        return 0
      fi
      flush_pend
      pend_label="${lab}"
      pend_names="${leaf}"
      return 0
    fi

    flush_pend

    if [ "${k}" = I ] && [ -n "${leaf}" ]; then
      # Labels: "link", "link (force)", "copy", "copy (refresh)", "copy (force)"
      case "${lab}" in
        "link"|"link (force)"|"copy"|"copy (refresh)"|"copy (force)")
          printf '  %-16s %s\n' "${lab}" "${leaf}"
          return 0
          ;;
      esac
    fi

    printf '  %-16s %s\n' "${lab}" "$(path_display "${p}")"
  }

  echo "job-kit install · plan"
  echo
  while IFS="${ROW_FS}" read -r kind label path; do
    [ -n "${kind}" ] || continue
    if [ "${kind}" = H ]; then
      flush_pend
      if [ "${section_started}" -eq 1 ]; then
        echo
      fi
      section_started=1
      section_root="${path}"
      printf '%s  ·  %s\n' "${label}" "$(path_display "${path}")"
    else
      emit_body "${kind}" "${label}" "${path}"
    fi
  done <<EOF
${rows}
EOF
  flush_pend
  echo "--------------------------------------------------------------"
}

# confirm_plan INSTALLS — TTY gate; skipped when --yes or non-TTY.
confirm_plan() {
  local installs="$1" answer
  [ "${YES}" -eq 1 ] && return 0
  [ -t 0 ] || return 0
  printf 'Proceed? %s installs. [Y/n] ' "${installs}" >&2
  read -r answer || true
  case "${answer}" in
    ''|y|Y|yes) return 0 ;;
    *) echo "aborted." >&2; return 1 ;;
  esac
}

# install_aside — apply Aside channel. No plan.
install_aside() {
  local repo="${REPO_ROOT}" force="${FORCE}" aside_only="${ASIDE_ONLY}" soft="${SOFT_SKIP}"
  (
    # shellcheck source=aside/lib.sh
    . "${repo}/scripts/aside/lib.sh"
    local dest_root parent name source dest
    dest_root="$(resolve_aside_skills_root)" || exit 1
    parent="$(dirname "${dest_root}")"
    if [ ! -d "${dest_root}" ] && [ ! -d "${parent}" ]; then
      if [ "${soft}" -eq 1 ]; then
        echo "Aside: parent missing (${parent}); skipping."
        exit 0
      fi
      echo "error: Aside skills parent missing: ${parent}" >&2
      echo "  Install Aside Browser and sign in first (expected under ~/.aside)." >&2
      exit 1
    fi
    if [ -n "${aside_only}" ]; then
      ensure_aside_skills_root "${dest_root}" || exit 1
      for name in ${SKILL_NAMES}; do
        case " ${aside_only} " in
          *" ${name} "*) ;;
          *) continue ;;
        esac
        source="$(skill_source "${repo}" "${name}")"
        dest="$(skill_dest "${dest_root}" "${name}")"
        copy_skill "${source}" "${dest}" "${force}" "${repo}" || exit 1
      done
      unlink_legacy_skills "${dest_root}" "${repo}" || exit 1
    else
      install_skills_into "${dest_root}" "${repo}" "${force}" || exit 1
    fi
    remove_legacy_user_skills "${repo}" "${dest_root}" "${aside_only:-${SKILL_NAMES}}" || exit 1
  )
}

# install_agents — apply agents channel. No plan.
# soft=1: missing parents skip; zero installs OK if soft. soft=0: need ≥1 linked.
install_agents() {
  local repo="${REPO_ROOT}" force="${FORCE}" soft="${SOFT_SKIP}"
  local skip_claude="${SKIP_CLAUDE}" skip_codex="${SKIP_CODEX}" skip_grok="${SKIP_GROK}"
  (
    # shellcheck source=agents/lib.sh
    . "${repo}/scripts/agents/lib.sh"
    local override dest_root target parent label linked=0 attempted=0
    override="$(resolve_override_skills)" || exit 1
    if [ -n "${override}" ]; then
      echo "== override (${override}) =="
      install_skills_into "${override}" "${repo}" "${force}" || exit 1
      echo "Install completed -> ${override}"
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
      if [ ! -d "${parent}" ]; then
        echo "${label}: parent missing (${parent}); skipping."
        continue
      fi
      attempted=$((attempted + 1))
      echo "== ${label} (${dest_root}) =="
      if install_skills_into "${dest_root}" "${repo}" "${force}"; then
        linked=$((linked + 1))
      else
        exit 1
      fi
    done
    remove_legacy_codex_skills_dir "${repo}" || exit 1
    if [ "${linked}" -eq 0 ]; then
      if [ "${soft}" -eq 1 ]; then
        echo "Coding agents: no agent home; skipping."
        exit 0
      fi
      echo "error: no agent targets installed (need parent dirs or CLAUDE_SKILLS)" >&2
      echo "  expected one of: ~/.claude  ~/.agents  ~/.grok" >&2
      exit 1
    fi
    echo "Install completed (${linked}/${attempted} targets)"
  )
}

# run_target TARGET — apply one channel.
run_target() {
  case "$1" in
    aside) install_aside ;;
    agents) install_agents ;;
    *) die "unknown target: $1" ;;
  esac
}

# plan_order TARGET… — dedup, preserve aside then agents when both present.
plan_order() {
  local t out="" has_aside=0 has_agents=0
  for t in "$@"; do
    case "${t}" in
      aside) has_aside=1 ;;
      agents) has_agents=1 ;;
      *) die "unknown target: ${t}" ;;
    esac
  done
  [ "${has_aside}" -eq 0 ] || out="${out}${out:+ }aside"
  [ "${has_agents}" -eq 0 ] || out="${out}${out:+ }agents"
  printf '%s\n' "${out}"
}

# run_plan TARGET… — plan, confirm (TTY), apply.
run_plan() {
  local ordered rows installs t n_targets=0
  ordered="$(plan_order "$@")"
  [ -n "${ordered}" ] || die "no targets selected"
  for t in ${ordered}; do
    n_targets=$((n_targets + 1))
  done
  # Soft-skip missing parents only when installing more than one channel.
  if [ "${n_targets}" -gt 1 ]; then
    SOFT_SKIP=1
  else
    SOFT_SKIP=0
  fi

  [ -d "${REPO_ROOT}/skill" ] \
    || die "not a job-kit checkout (missing skill/): ${REPO_ROOT}"

  rows=""
  rows="$(build_plan ${ordered})"
  render_plan "${rows}"
  installs="$(plan_count "${rows}" I)"
  printf '%s installs\n' "${installs}"
  echo

  if plan_has_blockers "${rows}"; then
    die "plan has blocked paths (source missing or foreign without --force); fix or re-run with --force"
  fi

  if [ "${DRY_RUN}" -eq 1 ]; then
    echo "--dry-run: nothing has been touched."
    return 0
  fi
  if [ "${installs}" -eq 0 ]; then
    local has_parent_missing=0 has_up_to_date=0 kind label path
    while IFS="${ROW_FS}" read -r kind label path; do
      [ -n "${kind}" ] || continue
      case "${label}" in
        "parent missing") has_parent_missing=1 ;;
        "up to date") has_up_to_date=1 ;;
      esac
    done <<EOF
${rows}
EOF
    # Missing parents and no up-to-date rows: hard fail (soft `all` matches remote).
    if [ "${has_parent_missing}" -eq 1 ] && [ "${has_up_to_date}" -eq 0 ]; then
      if [ "${SOFT_SKIP}" -eq 1 ]; then
        die "nothing installed: no Aside profile and no coding-agent home"
      fi
      die "nothing to install: required parent directories are missing (see plan)"
    fi
    echo "nothing to install."
    return 0
  fi
  confirm_plan "${installs}" || return 1
  echo
  echo "applying"
  for t in ${ordered}; do
    run_target "${t}"
  done
  echo
  printf 'done · %s installs · 0 failed\n' "${installs}"
}

# interactive_menu — bash select when stdin is a TTY.
interactive_menu() {
  local choice
  PS3="Select component to install (number): "
  select choice in \
    "Aside skills" \
    "Coding-agent skills" \
    "All of the above" \
    "Quit"
  do
    case "${REPLY}" in
      1) run_plan aside; return 0 ;;
      2) run_plan agents; return 0 ;;
      3) run_plan aside agents; return 0 ;;
      4) echo "quit"; return 0 ;;
      *) echo "invalid choice" >&2 ;;
    esac
  done
}

main() {
  local -a targets
  targets=()

  refuse_newline HOME "${HOME}"
  refuse_newline CLAUDE_SKILLS "${CLAUDE_SKILLS:-}"
  refuse_newline ASIDE_SKILLS "${ASIDE_SKILLS:-}"
  refuse_newline ASIDE_SKILLS_USER "${ASIDE_SKILLS_USER:-}"
  refuse_newline ASIDE_ACCOUNT "${ASIDE_ACCOUNT:-}"

  case "${HOME}" in
    /*) ;;
    *) die "HOME must be an absolute path (got: ${HOME})" ;;
  esac

  while [ "$#" -gt 0 ]; do
    case "$1" in
      -h|--help) usage; exit 0 ;;
      -y|--yes) YES=1 ;;
      --dry-run) DRY_RUN=1 ;;
      --force) FORCE=1 ;;
      --only)
        shift
        [ "$#" -gt 0 ] || die "--only needs a comma-separated list (see --help)"
        expand_only "$1"
        ;;
      --only=*) expand_only "${1#--only=}" ;;
      --skip-claude) SKIP_CLAUDE=1 ;;
      --skip-codex) SKIP_CODEX=1 ;;
      --skip-grok) SKIP_GROK=1 ;;
      aside|agents|all)
        targets[${#targets[@]}]="$1"
        ;;
      *)
        die "unknown option or target: $1 (see --help)"
        ;;
    esac
    shift
  done

  if [ "${#targets[@]}" -eq 0 ]; then
    if [ -n "${ONLY_TARGETS}" ]; then
      run_plan ${ONLY_TARGETS}
      return 0
    fi
    if [ -t 0 ]; then
      interactive_menu
      return 0
    fi
    die "need a target (aside|agents|all) when stdin is not a TTY"
  fi
  [ -z "${ONLY_TARGETS}" ] \
    || die "--only cannot be combined with positional targets (see --help)"

  local t has_all=0
  for t in "${targets[@]}"; do
    [ "${t}" = "all" ] && has_all=1
  done
  if [ "${has_all}" -eq 1 ]; then
    [ "${#targets[@]}" -eq 1 ] \
      || die "'all' cannot be combined with other targets"
    run_plan aside agents
    return 0
  fi

  run_plan "${targets[@]}"
}

main "$@"
