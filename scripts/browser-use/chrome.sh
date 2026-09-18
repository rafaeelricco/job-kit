#!/usr/bin/env bash
# Start a dedicated automation Chrome for browser-use, or reuse the one already
# listening. Compatible with macOS Bash 3.2.
#
# Why: Chrome 147+ closes /json/version on the default profile, so the harness
# must read DevToolsActivePort under Chrome's own data folder. macOS app-data
# protection blocks that read for sandboxed agents (Operation not permitted).
# A separate --user-data-dir keeps HTTP discovery open, so the agent connects
# through BU_CDP_URL without touching Chrome's files.
set -euo pipefail

PORT="${BU_CHROME_PORT:-9333}"
PROFILE="${XDG_CONFIG_HOME:-${HOME}/.config}/browser-harness/chrome-profile"
URL="http://127.0.0.1:${PORT}"

# cdp_up — 0 when a DevTools endpoint answers on PORT.
cdp_up() { curl -fsS -m 1 "${URL}/json/version" >/dev/null 2>&1; }

# chrome_app — print the first installed macOS app bundle the harness accepts.
# Mirrors have_chromium's list in install.sh, so a browser that passes preflight
# is a browser this helper can start. Args: none. Side effects: none.
chrome_app() {
  local app
  for app in "Google Chrome" "Google Chrome Canary" "Chromium" "Brave Browser" \
    "Microsoft Edge" "Arc" "Comet" "Dia"; do
    if [ -d "/Applications/${app}.app" ] ||
      [ -d "${HOME}/Applications/${app}.app" ]; then
      printf '%s\n' "${app}"
      return 0
    fi
  done
  return 1
}

if ! cdp_up; then
  mkdir -p "${PROFILE}"
  set -- --remote-debugging-port="${PORT}" --user-data-dir="${PROFILE}" \
    --no-first-run --no-default-browser-check
  APP=""
  if [ "$(uname -s)" = Darwin ]; then
    APP="$(chrome_app || true)"
  fi
  if [ -n "${APP}" ]; then
    open -na "${APP}" --args "$@"
  elif command -v google-chrome >/dev/null 2>&1; then
    nohup google-chrome "$@" >/dev/null 2>&1 &
  elif command -v chromium >/dev/null 2>&1; then
    nohup chromium "$@" >/dev/null 2>&1 &
  else
    echo "error: no Chromium-family browser found" >&2
    exit 1
  fi
  tries=0
  until cdp_up; do
    tries=$((tries + 1))
    if [ "${tries}" -gt 15 ]; then
      echo "error: Chrome did not answer on ${URL} within 15s" >&2
      exit 1
    fi
    sleep 1
  done
fi

echo "ready: ${URL} (profile ${PROFILE})"
echo "export BU_CDP_URL=${URL}"
