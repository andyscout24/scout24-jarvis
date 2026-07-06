#!/usr/bin/env bash
set -euo pipefail

SOCIAL_REPORTING_PROJECT_PATH="${SOCIAL_REPORTING_PROJECT_PATH:-/opt/external/social_reporting}"
SOCIAL_REPORTING_VENV_PATH="${SOCIAL_REPORTING_VENV_PATH:-/opt/venvs/social_reporting}"
SOCIAL_REPORTING_PYTHON_PATH="${SOCIAL_REPORTING_PYTHON_PATH:-${SOCIAL_REPORTING_VENV_PATH}/bin/python}"

export SOCIAL_REPORTING_PROJECT_PATH
export SOCIAL_REPORTING_PYTHON_PATH

if [ -d "${SOCIAL_REPORTING_PROJECT_PATH}" ] && [ -f "${SOCIAL_REPORTING_PROJECT_PATH}/requirements.txt" ]; then
  if [ ! -x "${SOCIAL_REPORTING_PYTHON_PATH}" ]; then
    echo "[dashboard] Erzeuge Python-Venv fuer social_reporting unter ${SOCIAL_REPORTING_VENV_PATH}"
    python3 -m venv "${SOCIAL_REPORTING_VENV_PATH}"
    "${SOCIAL_REPORTING_VENV_PATH}/bin/pip" install --no-cache-dir -r "${SOCIAL_REPORTING_PROJECT_PATH}/requirements.txt"
  fi
else
  echo "[dashboard] Warnung: social_reporting Projekt unter ${SOCIAL_REPORTING_PROJECT_PATH} nicht gefunden."
fi

exec node server.mjs
