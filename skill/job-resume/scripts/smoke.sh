#!/usr/bin/env bash
# Toolchain smoke: every base CV in the profile still compiles through compile.sh.
# Usage: smoke.sh PROFILE_ROOT
# Catches a missing pdflatex/pdfinfo/pdftotext and a base .tex that stopped
# compiling — both of which otherwise surface mid-run as a confusing Loop B failure.
# Does not read scout/, write scout/applications/, or open posting URLs.
# compile.sh exit 0 or 3 is pass (profile bases still carry Education).
# exit 1 or 2 fails the smoke.

set -euo pipefail

ROOT=${1:-${PROFILE_ROOT:-}}
if [[ -z "${ROOT}" || ! -d "${ROOT}/cv" ]]; then
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

compile_base() {
  local tex=$1
  echo "compile $(basename "${tex}")"
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

shopt -s nullglob
bases=("${ROOT}"/cv/resume-*.tex)
shopt -u nullglob

if [[ ${#bases[@]} -eq 0 ]]; then
  echo "FAIL no cv/resume-*.tex in ${ROOT}" >&2
  exit 1
fi

for tex in "${bases[@]}"; do
  compile_base "${tex}"
done

echo "${#bases[@]} base(s) compiled"
exit "${fail}"
