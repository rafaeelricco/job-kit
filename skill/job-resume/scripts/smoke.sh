#!/usr/bin/env bash
# Corpus smoke: four score-9 status:new dossiers + compile.sh on predicted bases.
# Usage: smoke.sh PROFILE_ROOT
# Does not write scout/applications/. Does not open posting URLs.
# compile.sh exit 0 or 3 is pass (profile bases still carry Education).
# exit 1 or 2 fails the smoke.

set -euo pipefail

ROOT=${1:-${PROFILE_ROOT:-}}
if [[ -z "${ROOT}" || ! -d "${ROOT}/scout/jobs" || ! -d "${ROOT}/cv" ]]; then
  echo "usage: smoke.sh PROFILE_ROOT" >&2
  exit 1
fi
ROOT=$(cd "${ROOT}" && pwd)
HERE=$(cd "$(dirname "$0")" && pwd)
COMPILE="${HERE}/compile.sh"
[[ -x "${COMPILE}" ]] || { echo "not executable: ${COMPILE}" >&2; exit 1; }

need() { command -v "$1" >/dev/null || { echo "missing: $1" >&2; exit 1; }; }
need pdflatex
need pdfinfo
need pdftotext

fail=0

check_dossier() {
  local rel=$1
  local f="${ROOT}/${rel}"
  echo "dossier ${rel}"
  if [[ ! -f "${f}" ]]; then
    echo "  FAIL missing file"
    fail=1
    return
  fi
  local st sc
  st=$(awk '/^status:/{print $2; exit}' "${f}")
  sc=$(awk '/^score:/{print $2; exit}' "${f}")
  if [[ "${st}" != "new" ]]; then
    echo "  FAIL status=${st} want new"
    fail=1
  fi
  if [[ "${sc}" != "9" ]]; then
    echo "  FAIL score=${sc} want 9"
    fail=1
  fi
  if ! grep -q '^url: "' "${f}"; then
    echo "  FAIL no url"
    fail=1
  fi
}

compile_base() {
  local id=$1
  local tex="${ROOT}/cv/resume-${id}.tex"
  echo "compile resume-${id}.tex"
  if [[ ! -f "${tex}" ]]; then
    echo "  FAIL missing tex"
    fail=1
    return
  fi
  local out rc
  out=$(mktemp -d)
  set +e
  "${COMPILE}" "${tex}" "${out}"
  rc=$?
  set -e
  echo "  exit ${rc}"
  if [[ ${rc} -ne 0 && ${rc} -ne 3 ]]; then
    echo "  FAIL compile exit ${rc}"
    fail=1
  fi
  rm -rf "${out}"
}

# Vanta / Sr. Fullstack — predict senior-fullstack
check_dossier "scout/jobs/2026-08-19-vanta--sr-fullstack-software-engineer-integrations-platform.md"
compile_base senior-fullstack

# Oddball / Lead Front End — predict senior-frontend
check_dossier "scout/jobs/2026-08-20-oddball--lead-front-end-engineer.md"
compile_base senior-frontend

# Avenue Code / Senior AI Engineer — predict ai-systems
check_dossier "scout/jobs/2026-08-18-avenue-code--senior-ai-engineer.md"
compile_base ai-systems

# Vercel / Internal Agent — predict product-engineer-agents
check_dossier "scout/jobs/2026-08-18-vercel--member-of-the-technical-staff-internal-agent.md"
compile_base product-engineer-agents

exit "${fail}"
