#!/usr/bin/env bash
# Smoke-test the review-classifier LLM key, independent of the Spring app.
# Confirms three things in one shot: key valid + model available + JSON mode.
#
#   Usage:  bash verify-groq.sh
#
# Reads GROQ_API_KEY (and optional LLM_BASE_URL / LLM_MODEL overrides) straight
# from .env, so the secret never needs to be pasted anywhere.
set -euo pipefail
cd "$(dirname "$0")"

if [[ -f .env ]]; then
  set -a; . ./.env; set +a
fi

: "${GROQ_API_KEY:?Falta GROQ_API_KEY — agregalo a .env primero}"
BASE="${LLM_BASE_URL:-https://api.groq.com/openai/v1}"
MODEL="${LLM_MODEL:-llama-3.3-70b-versatile}"

read -r -d '' PAYLOAD <<JSON || true
{
  "model": "${MODEL}",
  "messages": [{"role": "user", "content": "Responde solo JSON {\"ok\":true}"}],
  "response_format": {"type": "json_object"}
}
JSON

echo "POST ${BASE}/chat/completions   (model=${MODEL})"
curl -s -w '\nHTTP %{http_code}\n' "${BASE}/chat/completions" \
  -H "Authorization: Bearer ${GROQ_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}"
