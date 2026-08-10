#!/usr/bin/env bash
# Thin wrapper: Aside channel → unified scripts/install.sh.
# Compatible with macOS Bash 3.2. Kept for remote/ownership/activate paths.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
exec bash "${SCRIPT_DIR}/../install.sh" aside "$@"
