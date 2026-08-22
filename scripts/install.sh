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
  aside     Aside skills (job-scout, job-apply, job-resume, job-profile-me, job-list, job-pitch, job-inbox, job-profile-root) — full copy
  agents    Coding-agent skills (job-profile-init, job-profile-me, job-list, job-stories, job-pitch, job-inbox, job-profile-root)
  browser-use  Browser skills (job-scout, job-apply, job-resume) plus the browser-use
               driver skill into coding-agent homes; driven by the local browser-use CLI
  all       aside + agents + browser-use

Options:
  -y, --yes     Skip confirmations (TTY plan gate)
  --dry-run     Print the plan, remove nothing
  --force       Replace foreign files/dirs/links at the destination
  --only LIST   Comma-separated subset, instead of positional targets:
                aside | job-scout | job-apply | job-resume | job-profile-me | job-list | job-pitch | job-inbox | job-profile-root
                agents | browser-use | claude | codex | grok
                (claude|codex|grok narrow a channel named alongside them;
                alone they mean the agents channel)
                (job-profile-me also installs job-scout — packs mutate
                needs its worker-search-*.md stems)
                (job-apply also installs job-resume — Prepare chains it
                for a status:new dossier)
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

# have_chromium — 0 when a browser-harness-discoverable browser is installed.
# Args: none. Side effects: none (probes app bundles and PATH only).
have_chromium() {
  local app
  for app in "Google Chrome" "Google Chrome Canary" "Chromium" "Brave Browser" \
    "Microsoft Edge" "Arc" "Comet" "Dia"; do
    if [ -d "/Applications/${app}.app" ]; then return 0; fi
    if [ -d "${HOME}/Applications/${app}.app" ]; then return 0; fi
  done
  command -v google-chrome >/dev/null 2>&1 || command -v chromium >/dev/null 2>&1
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
  local want_browser=0 channel_named=0
  local want_claude=0 want_codex=0 want_grok=0 named_agent=0 whole_aside=0
  for tok in $(printf '%s' "${list}" | tr ',' ' '); do
    case "${tok}" in
      aside) want_aside=1; whole_aside=1; channel_named=1 ;;
      job-scout|job-apply|job-resume|job-profile-me|job-list|job-pitch|job-inbox|job-profile-root)
        want_aside=1
        channel_named=1
        [ -n "${ASIDE_ONLY}" ] && ASIDE_ONLY="${ASIDE_ONLY} ${tok}" || ASIDE_ONLY="${tok}" ;;
      agents) want_agents=1; channel_named=1; want_claude=1; want_codex=1; want_grok=1 ;;
      browser-use) want_browser=1; channel_named=1 ;;
      claude) named_agent=1; want_claude=1 ;;
      codex)  named_agent=1; want_codex=1 ;;
      grok)   named_agent=1; want_grok=1 ;;
      *) die "unknown --only item: ${tok} (aside|job-scout|job-apply|job-resume|job-profile-me|job-list|job-pitch|job-inbox|job-profile-root|agents|browser-use|claude|codex|grok)" ;;
    esac
  done
  # A bare agent-home token still means the agents channel, as it always has —
  # but only when no channel was named alongside it.
  if [ "${named_agent}" -eq 1 ] && [ "${channel_named}" -eq 0 ]; then
    want_agents=1
  fi
  if [ "${named_agent}" -eq 1 ]; then
    [ "${want_claude}" -eq 1 ] || SKIP_CLAUDE=1
    [ "${want_codex}" -eq 1 ] || SKIP_CODEX=1
    [ "${want_grok}" -eq 1 ] || SKIP_GROK=1
  fi
  [ "${whole_aside}" -eq 0 ] || ASIDE_ONLY=""
  # job-profile-me packs add/remove validates impl against job-scout's
  # worker-search-*.md stems; standalone config without scout is unusable.
  # job-apply Prepare chains job-resume for a status:new dossier; a subset
  # without resume cannot complete that path.
  if [ -n "${ASIDE_ONLY}" ]; then
    case " ${ASIDE_ONLY} " in
      *" job-profile-me "*)
        case " ${ASIDE_ONLY} " in
          *" job-scout "*) ;;
          *) ASIDE_ONLY="${ASIDE_ONLY} job-scout" ;;
        esac
        ;;
    esac
    case " ${ASIDE_ONLY} " in
      *" job-apply "*)
        case " ${ASIDE_ONLY} " in
          *" job-resume "*) ;;
          *) ASIDE_ONLY="${ASIDE_ONLY} job-resume" ;;
        esac
        ;;
    esac
    case " ${ASIDE_ONLY} " in
      *" job-scout "*|*" job-apply "*|*" job-resume "*|*" job-profile-me "*|*" job-list "*|*" job-pitch "*|*" job-inbox "*)
        case " ${ASIDE_ONLY} " in
          *" job-profile-root "*) ;;
          *) ASIDE_ONLY="${ASIDE_ONLY} job-profile-root" ;;
        esac
        ;;
    esac
  fi
  [ "${want_aside}" -eq 0 ] || ONLY_TARGETS="${ONLY_TARGETS} aside"
  [ "${want_agents}" -eq 0 ] || ONLY_TARGETS="${ONLY_TARGETS} agents"
  [ "${want_browser}" -eq 0 ] || ONLY_TARGETS="${ONLY_TARGETS} browser-use"
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

# plan_row_driver ROOT — driver skill dest under a skills root this channel
# installs into. Present → N up to date. Missing + CLI → I (apply runs the
# official installer). Missing + no CLI → N (preflight still names the command).
plan_row_driver() {
  local dest="${1}/browser-use"
  if [ -e "${dest}" ] || [ -L "${dest}" ]; then
    printf 'N%sup to date%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
    return 0
  fi
  if command -v browser-use >/dev/null 2>&1; then
    printf 'I%sinstall driver%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
  else
    printf 'N%smissing driver%s%s\n' "${ROW_FS}" "${ROW_FS}" "${dest}"
  fi
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

# plan_rows_agent_home SEL LABEL — rows for one agent-home channel. No mutation.
# SEL is profile (SKILL_NAMES) or browser (BROWSER_SKILL_NAMES); LABEL heads
# every section this channel prints.
plan_rows_agent_home() {
  local sel="$1" label="$2" repo="${REPO_ROOT}" force="${FORCE}"
  local skip_claude="${SKIP_CLAUDE}" skip_codex="${SKIP_CODEX}" skip_grok="${SKIP_GROK}"
  (
    # shellcheck source=agents/lib.sh
    . "${repo}/scripts/agents/lib.sh"
    local override target root parent agent_label_s name source dest names
    if [ "${sel}" = browser ]; then names="${BROWSER_SKILL_NAMES}"; else names="${SKILL_NAMES}"; fi
    # Requirement rows sit under their own header, or under `all` they would
    # read as the tail of the preceding channel's section.
    if [ "${sel}" = browser ]; then
      if ! command -v browser-use >/dev/null 2>&1 || ! have_chromium; then
        printf 'H%s%s · requirements%s%s\n' "${ROW_FS}" "${label}" "${ROW_FS}" "offered after install"
        if ! command -v browser-use >/dev/null 2>&1; then
          printf 'N%smissing CLI%s%s\n' "${ROW_FS}" "${ROW_FS}" "uv tool install --python 3.12 browser-use"
        fi
        if ! have_chromium; then
          printf 'N%smissing browser%s%s\n' "${ROW_FS}" "${ROW_FS}" "brew install --cask google-chrome"
        fi
      fi
    fi
    override="$(resolve_override_skills)" || exit 1
    if [ -n "${override}" ]; then
      printf 'H%s%s (override)%s%s\n' "${ROW_FS}" "${label}" "${ROW_FS}" "${override}"
      for name in ${names}; do
        source="$(skill_source "${repo}" "${name}")"
        dest="$(skill_dest "${override}" "${name}")"
        plan_row_agent "${dest}" "${name}" "${source}" "${force}"
      done
      if [ "${sel}" = browser ]; then
        plan_row_driver "${override}"
      fi
      exit 0
    fi
    for target in ${AGENT_TARGETS}; do
      root="$(agent_skills_root "${target}")"
      agent_label_s="$(agent_label "${target}")"
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
        printf 'H%s%s · %s%s%s\n' "${ROW_FS}" "${label}" "${agent_label_s}" "${ROW_FS}" "${root}"
        printf 'N%sparent missing%s%s\n' "${ROW_FS}" "${ROW_FS}" "${parent}"
        continue
      fi
      printf 'H%s%s · %s%s%s\n' "${ROW_FS}" "${label}" "${agent_label_s}" "${ROW_FS}" "${root}"
      for name in ${names}; do
        source="$(skill_source "${repo}" "${name}")"
        dest="$(skill_dest "${root}" "${name}")"
        plan_row_agent "${dest}" "${name}" "${source}" "${force}"
      done
      if [ "${sel}" = browser ]; then
        plan_row_driver "${root}"
      fi
    done
  )
}

# build_plan TARGET… — every manifest row, in apply order.
build_plan() {
  local t
  for t in "$@"; do
    case "${t}" in
      aside) plan_rows_aside ;;
      agents) plan_rows_agent_home profile agents ;;
      browser-use) plan_rows_agent_home browser browser-use ;;
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
      # Labels: "link", "link (force)", "copy", "copy (refresh)", "copy (force)",
      # "install driver"
      case "${lab}" in
        "link"|"link (force)"|"copy"|"copy (refresh)"|"copy (force)"|"install driver")
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

# browser_use_driver_cmd ROOT — official CLI that writes ROOT/browser-use.
# claude → --target claude; codex (job-kit: ~/.agents/skills) → --target agents;
# anything else (Grok, CLAUDE_SKILLS) → --path ROOT/browser-use.
# --no-install: place the skill file only; never uv-upgrade the CLI.
browser_use_driver_cmd() {
  local root="$1"
  if [ "${root}" = "${HOME}/.claude/skills" ]; then
    printf '%s\n' "browser-use skill install --target claude --no-install"
  elif [ "${root}" = "${HOME}/.agents/skills" ]; then
    printf '%s\n' "browser-use skill install --target agents --no-install"
  else
    printf 'browser-use skill install --path "%s" --no-install\n' "${root}/browser-use"
  fi
}

# browser_use_missing_drivers — dests this channel installs into that
# carry no driver skill. Args: none; prints one `PATH<ROW_FS>FIX` row per gap.
# PATH is the driver path in display form; FIX is always a runnable
# `browser-use skill install`. When CLAUDE_SKILLS is set, that dest is
# exclusive (same as install_agent_home) and AGENT_TARGETS are not walked.
# A dest the kit does not install into is skipped: a driver missing there is
# not a gap this channel can close.
browser_use_missing_drivers() {
  local repo="${REPO_ROOT}"
  (
    # shellcheck source=agents/lib.sh
    . "${repo}/scripts/agents/lib.sh"
    local target root override
    override="$(resolve_override_skills)" || exit 1
    if [ -n "${override}" ]; then
      [ -e "${override}/browser-use" ] || [ -L "${override}/browser-use" ] \
        || printf '%s%s%s\n' "$(path_display "${override}/browser-use")" "${ROW_FS}" "$(browser_use_driver_cmd "${override}")"
      exit 0
    fi
    for target in ${AGENT_TARGETS}; do
      # if/else (not case-in-$(...)): macOS Bash 3.2 misparses multi-arm case
      # inside command substitutions.
      if [ "${target}" = claude ]; then
        [ "${SKIP_CLAUDE}" -eq 0 ] || continue
      elif [ "${target}" = codex ]; then
        [ "${SKIP_CODEX}" -eq 0 ] || continue
      else
        [ "${SKIP_GROK}" -eq 0 ] || continue
      fi
      root="$(agent_skills_root "${target}")"
      [ -d "$(agent_parent_dir "${target}")" ] || [ -d "${root}" ] || continue
      [ -e "${root}/browser-use" ] || [ -L "${root}/browser-use" ] \
        || printf '%s%s%s\n' "$(path_display "${root}/browser-use")" "${ROW_FS}" "$(browser_use_driver_cmd "${root}")"
    done
  )
}

# browser_use_offer LABEL COMMAND — flag one missing requirement, offer to run it.
# COMMAND is a fixed literal from the caller below — at most an install target
# from a closed two-value map — never operator input.
# Prints the flag always; prompts only on a TTY. --yes never auto-installs the
# CLI or a browser (third-party tools). The driver skill is a planned I-row
# in apply, not an offer.
browser_use_offer() {
  local label="$1" cmd="$2" reply
  echo "  missing: ${label}"
  echo "    fix: ${cmd}"
  [ -t 0 ] || return 0
  printf '    run it now? [y/N] ' >&2
  read -r reply || true
  case "${reply}" in
    y|Y|yes|YES)
      eval "${cmd}" || echo "    failed, run it yourself: ${cmd}" >&2 ;;
  esac
}

# browser_use_preflight — flag every missing browser-use requirement + offer fixes.
# Args: none. Side effects: may run one offered install command per yes answer.
# Never blocks: the skills are already installed and each one's Phase 0 STOPs
# on its own when no driver answers.
browser_use_preflight() {
  local need_cli=0 need_browser=0 drivers driver_path driver_fix
  command -v browser-use >/dev/null 2>&1 || need_cli=1
  have_chromium || need_browser=1
  # Probed separately: a CLI and a browser that are both already present say
  # nothing about the driver skill, and every browser skill's Phase 0 needs it.
  drivers="$(browser_use_missing_drivers)"
  [ "${need_cli}" -eq 1 ] || [ "${need_browser}" -eq 1 ] || [ -n "${drivers}" ] || return 0

  echo
  echo "browser-use · requirements not met"
  if [ "${need_cli}" -eq 1 ]; then
    if command -v uv >/dev/null 2>&1; then
      browser_use_offer "browser-use CLI" "uv tool install --python 3.12 browser-use"
    elif command -v brew >/dev/null 2>&1; then
      browser_use_offer "uv (needed to install browser-use)" "brew install uv"
    else
      echo "  missing: browser-use CLI"
      echo "    fix: install uv (https://docs.astral.sh/uv/), then:"
      echo "         uv tool install --python 3.12 browser-use"
    fi
  fi
  if [ "${need_browser}" -eq 1 ]; then
    if command -v brew >/dev/null 2>&1; then
      browser_use_offer "a Chromium-family browser" "brew install --cask google-chrome"
    else
      echo "  missing: a Chromium-family browser"
      echo "    fix: install Google Chrome (https://www.google.com/chrome/)"
    fi
  fi
  if [ -n "${drivers}" ]; then
    while IFS="${ROW_FS}" read -r driver_path driver_fix; do
      [ -n "${driver_path}" ] || continue
      if command -v browser-use >/dev/null 2>&1; then
        browser_use_offer "browser-use driver skill (${driver_path})" "${driver_fix}"
      else
        echo "  missing: browser-use driver skill (${driver_path})"
        echo "    fix: ${driver_fix}"
      fi
    done <<EOF
${drivers}
EOF
  fi
  echo "  then, once in the browser: open chrome://inspect/#remote-debugging and"
  echo "  tick 'Allow remote debugging', and sign in to the sites you scout."
  echo
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
      unlink_legacy_skills "${dest_root}" "${repo}" "$(legacy_names_for_selected "${aside_only}")" || exit 1
    else
      install_skills_into "${dest_root}" "${repo}" "${force}" || exit 1
    fi
    if [ -n "${aside_only}" ]; then
      remove_legacy_user_skills "${repo}" "${dest_root}" "${aside_only}" "$(legacy_names_for_selected "${aside_only}")" || exit 1
    else
      remove_legacy_user_skills "${repo}" "${dest_root}" "${SKILL_NAMES}" || exit 1
    fi
  )
}

# install_driver_into ROOT — write ROOT/browser-use via the official CLI.
# No-op if dest exists or CLI missing (preflight names the command).
# claude/codex use --target; Grok and CLAUDE_SKILLS use --path.
install_driver_into() {
  local root="$1" dest="${1}/browser-use"
  if [ -e "${dest}" ] || [ -L "${dest}" ]; then
    echo "up to date: ${dest}"
    return 0
  fi
  if ! command -v browser-use >/dev/null 2>&1; then
    echo "skipped (no CLI): ${dest}"
    return 0
  fi
  echo "installing driver: ${dest}"
  if [ "${root}" = "${HOME}/.claude/skills" ]; then
    browser-use skill install --target claude --no-install
  elif [ "${root}" = "${HOME}/.agents/skills" ]; then
    browser-use skill install --target agents --no-install
  else
    browser-use skill install --path "${dest}" --no-install
  fi
}

# install_agent_home SEL LABEL — apply one agent-home channel. No plan.
# SEL is profile (SKILL_NAMES) or browser (BROWSER_SKILL_NAMES); LABEL names the
# channel in messages.
# soft=1: missing parents skip; zero installs OK if soft. soft=0: need ≥1 linked.
install_agent_home() {
  local sel="$1" label="$2" repo="${REPO_ROOT}" force="${FORCE}" soft="${SOFT_SKIP}"
  local skip_claude="${SKIP_CLAUDE}" skip_codex="${SKIP_CODEX}" skip_grok="${SKIP_GROK}"
  (
    # shellcheck source=agents/lib.sh
    . "${repo}/scripts/agents/lib.sh"
    local override dest_root target parent agent_label_s linked=0 attempted=0 names
    if [ "${sel}" = browser ]; then names="${BROWSER_SKILL_NAMES}"; else names="${SKILL_NAMES}"; fi
    override="$(resolve_override_skills)" || exit 1
    if [ -n "${override}" ]; then
      echo "== override (${override}) =="
      install_skills_into "${override}" "${repo}" "${force}" "${names}" || exit 1
      if [ "${sel}" = browser ]; then
        install_driver_into "${override}" || exit 1
      fi
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
      agent_label_s="$(agent_label "${target}")"
      if [ ! -d "${parent}" ]; then
        echo "${agent_label_s}: parent missing (${parent}); skipping."
        continue
      fi
      attempted=$((attempted + 1))
      echo "== ${agent_label_s} (${dest_root}) =="
      if install_skills_into "${dest_root}" "${repo}" "${force}" "${names}"; then
        linked=$((linked + 1))
        if [ "${sel}" = browser ]; then
          install_driver_into "${dest_root}" || exit 1
        fi
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
    agents) install_agent_home profile agents ;;
    browser-use) install_agent_home browser browser-use ;;
    *) die "unknown target: $1" ;;
  esac
}

# plan_order TARGET… — dedup, preserve aside, agents, browser-use order.
plan_order() {
  local t out="" has_aside=0 has_agents=0 has_browser=0
  for t in "$@"; do
    case "${t}" in
      aside) has_aside=1 ;;
      agents) has_agents=1 ;;
      browser-use) has_browser=1 ;;
      *) die "unknown target: ${t}" ;;
    esac
  done
  [ "${has_aside}" -eq 0 ] || out="${out}${out:+ }aside"
  [ "${has_agents}" -eq 0 ] || out="${out}${out:+ }agents"
  [ "${has_browser}" -eq 0 ] || out="${out}${out:+ }browser-use"
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
    # Skills already linked does not mean the driver is there. Re-running setup
    # is how an operator asks for the offer again, so it must not depend on a
    # link being created this run.
    case " ${ordered} " in
      *" browser-use "*) browser_use_preflight ;;
    esac
    return 0
  fi
  confirm_plan "${installs}" || return 1
  echo
  echo "applying"
  for t in ${ordered}; do
    run_target "${t}"
  done
  case " ${ordered} " in
    *" browser-use "*) browser_use_preflight ;;
  esac
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
    "browser-use skills (job-scout + job-apply + job-resume in coding agents)" \
    "All of the above" \
    "Quit"
  do
    case "${REPLY}" in
      1) run_plan aside; return 0 ;;
      2) run_plan agents; return 0 ;;
      3) run_plan browser-use; return 0 ;;
      4) run_plan aside agents browser-use; return 0 ;;
      5) echo "quit"; return 0 ;;
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
      aside|agents|browser-use|all)
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
    die "need a target (aside|agents|browser-use|all) when stdin is not a TTY"
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
    run_plan aside agents browser-use
    return 0
  fi

  run_plan "${targets[@]}"
}

main "$@"
