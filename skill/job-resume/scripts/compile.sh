#!/usr/bin/env bash
# Loop B geometry CLI. Main is the only caller.
# Usage: compile.sh TEX_PATH OUT_DIR
#
# glyphtounicode: bases `\input{glyphtounicode}` and `\pdfgentounicode=1`.
# cv/ does not ship the file. Choice:
#   1. Prepend dirname of `kpsewhich glyphtounicode.tex` to TEXINPUTS
#      (trailing colon keeps the texmf tree).
#   2. kpsewhich empty → compile a working copy in OUT_DIR with those two
#      lines commented. Delete the working copy after pdflatex.
# Never vendor the mapping into cv/. Never mutate TEX_PATH when it sits
# outside OUT_DIR. Never copy any PDF to resume.pdf.
#
# stdout, on exit 0, 2, and 3:
#   Pages: N
#   /abs/path/STEM.txt
# Pages is 0 on exit 2 — no usable PDF this run.
# Exit:
#   0  pdflatex ok AND Pages==1 AND no Overfull \vbox
#   1  usage / missing binary / TEX unreadable / OUT_DIR not writable
#   2  pdflatex failed, or the PDF cannot be inspected or extracted
#   3  pdflatex ok AND (Pages!=1 OR Overfull \vbox in the log)
# Overfull \hbox is not a fail.

set -euo pipefail

usage() { echo "usage: compile.sh TEX_PATH OUT_DIR" >&2; exit 1; }

[[ $# -eq 2 ]] || usage
TEX=$1
OUT_DIR=$2

need() { command -v "$1" >/dev/null || { echo "missing: $1" >&2; exit 1; }; }
need pdflatex
need pdfinfo
need pdftotext

[[ -f "$TEX" && -r "$TEX" ]] || { echo "unreadable: $TEX" >&2; exit 1; }
mkdir -p "$OUT_DIR"
OUT_DIR=$(cd "$OUT_DIR" && pwd)
TEX=$(cd "$(dirname "$TEX")" && pwd)/$(basename "$TEX")

STEM=$(basename "$TEX" .tex)
JOBNAME=$STEM
WORK=$TEX

glyph=""
if command -v kpsewhich >/dev/null; then
  glyph=$(kpsewhich glyphtounicode.tex 2>/dev/null || true)
fi
TEX_DIR=$(dirname "$TEX")
if [[ -n "$glyph" ]]; then
  export TEXINPUTS="$(dirname "$glyph"):${TEX_DIR}:${OUT_DIR}:"
else
  WORK="$OUT_DIR/${STEM}.work.tex"
  awk '
    $0 ~ /^[[:space:]]*\\input\{glyphtounicode\}/ { print "%" $0; next }
    $0 ~ /^[[:space:]]*\\pdfgentounicode[[:space:]]*=[[:space:]]*1/ { print "%" $0; next }
    { print }
  ' "$TEX" > "$WORK"
  export TEXINPUTS="${TEX_DIR}:${OUT_DIR}:"
fi

set +e
pdflatex -interaction=nonstopmode -halt-on-error \
  -output-directory="$OUT_DIR" -jobname="$JOBNAME" "$WORK" >/dev/null
tex_rc=$?
set -e

[[ "$WORK" != "$TEX" && -f "$WORK" ]] && rm -f "$WORK"

PDF="$OUT_DIR/${STEM}.pdf"
LOG="$OUT_DIR/${STEM}.log"
TXT="$OUT_DIR/${STEM}.txt"

if [[ $tex_rc -ne 0 || ! -f "$PDF" ]]; then
  echo "Pages: 0"
  echo "$TXT"
  exit 2
fi

set +e
info=$(pdfinfo "$PDF" 2>/dev/null)
info_rc=$?
set -e
if [[ $info_rc -ne 0 ]]; then
  echo "pdfinfo failed on $PDF (status $info_rc)" >&2
  echo "Pages: 0"
  echo "$TXT"
  exit 2
fi
pages=$(printf '%s\n' "$info" | awk '/^Pages:/ { print $2; exit }')
[[ -n "$pages" ]] || pages=0

set +e
pdftotext -layout "$PDF" "$TXT"
txt_rc=$?
set -e
if [[ $txt_rc -ne 0 ]]; then
  echo "pdftotext failed on $PDF (status $txt_rc)" >&2
  echo "Pages: 0"
  echo "$TXT"
  exit 2
fi

echo "Pages: $pages"
echo "$TXT"

vbox=0
[[ -f "$LOG" ]] && grep -q 'Overfull \\vbox' "$LOG" && vbox=1

if [[ "$pages" == "1" && $vbox -eq 0 ]]; then
  exit 0
fi
exit 3
