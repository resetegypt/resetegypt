#!/usr/bin/env bash
# ============================================================================
# setup-vercel-env.sh
#
# Configure toutes les env vars prod manquantes sur les 4 projets Vercel :
#   - reset-api    (backend Fastify)
#   - reset-site   (marketing Next.js)
#   - reset-web    (app staff Vite)
#   - reset-booking (booking public Vite)
#
# Usage :
#   VERCEL_TOKEN=vcp_xxx bash scripts/setup-vercel-env.sh                    # dry-run (list)
#   VERCEL_TOKEN=vcp_xxx bash scripts/setup-vercel-env.sh --apply            # apply
#
# Optionnel — vars pré-générées (sinon fallback ou skip) :
#   ENCRYPTION_KEY=xxx           (sinon généré via openssl)
#   R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET  → Cloudflare R2 backup
#   SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT                       → Sentry sourcemaps
# ============================================================================

set -euo pipefail

APPLY=false
[[ "${1:-}" == "--apply" ]] && APPLY=true

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "❌ VERCEL_TOKEN env var required."
  echo "   Get one at: https://vercel.com/account/tokens"
  exit 1
fi

API_URL="https://api.vercel.com"
TEAM_ID="team_7GVOlF2lMHuM9xFjE1D1WC4E"

# Projets identifiés depuis .vercel/project.json
declare -A PROJECTS=(
  ["reset-api"]="prj_2X62xM7iHqwDA3FvnpeOvWcbxxVx"
  ["reset-site"]="prj_sRceGZZXOGqjyJpY1BwmsETKHwdB"
  # Ajoute web + booking IDs quand tu les récupères via `vercel link`
)

# Génère ENCRYPTION_KEY si absent
if [[ -z "${ENCRYPTION_KEY:-}" ]]; then
  ENCRYPTION_KEY=$(openssl rand -base64 32)
  echo "🔑 Generated new ENCRYPTION_KEY (>=32 chars)"
fi

# Vars à set sur chaque projet
declare -A API_VARS=(
  ["ENCRYPTION_KEY"]="$ENCRYPTION_KEY"
)

declare -A SITE_VARS=(
  ["NEXT_PUBLIC_BOOKING_URL"]="https://book.reset-egypt.com"
  ["NEXT_PUBLIC_SITE_URL"]="https://reset-egypt.com"
  ["NEXT_PUBLIC_CONTACT_EMAIL"]="contact@reset-egypt.com"
  ["NEXT_PUBLIC_WHATSAPP_NUMBER"]="201234567890"
)

# R2 vars (uniquement si le user a fourni les 4)
if [[ -n "${R2_ACCOUNT_ID:-}" && -n "${R2_ACCESS_KEY_ID:-}" && -n "${R2_SECRET_ACCESS_KEY:-}" && -n "${R2_BUCKET:-}" ]]; then
  API_VARS["R2_ACCOUNT_ID"]="$R2_ACCOUNT_ID"
  API_VARS["R2_ACCESS_KEY_ID"]="$R2_ACCESS_KEY_ID"
  API_VARS["R2_SECRET_ACCESS_KEY"]="$R2_SECRET_ACCESS_KEY"
  API_VARS["R2_BUCKET"]="$R2_BUCKET"
  echo "☁️  R2 credentials detected — will set on reset-api"
fi

# Sentry (auth token pour sourcemaps upload au build)
if [[ -n "${SENTRY_AUTH_TOKEN:-}" && -n "${SENTRY_ORG:-}" && -n "${SENTRY_PROJECT:-}" ]]; then
  API_VARS["SENTRY_AUTH_TOKEN"]="$SENTRY_AUTH_TOKEN"
  API_VARS["SENTRY_ORG"]="$SENTRY_ORG"
  API_VARS["SENTRY_PROJECT"]="$SENTRY_PROJECT"
  echo "📊 Sentry credentials detected — will set on reset-api"
fi

# Fonction: set une env var sur un projet
set_env() {
  local project_id="$1"
  local key="$2"
  local value="$3"

  if $APPLY; then
    # Supprime si existe (Vercel API renvoie 409 sinon)
    curl -s -X DELETE \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      "$API_URL/v9/projects/$project_id/env/$key?teamId=$TEAM_ID&target=production" > /dev/null 2>&1 || true

    # Créer la nouvelle valeur
    local response
    response=$(curl -s -X POST \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      "$API_URL/v10/projects/$project_id/env?teamId=$TEAM_ID" \
      -d "{\"key\":\"$key\",\"value\":\"$value\",\"target\":[\"production\"],\"type\":\"encrypted\"}")

    if echo "$response" | grep -q '"error"'; then
      echo "  ❌ $key — $(echo "$response" | head -c 200)"
      return 1
    else
      echo "  ✅ $key"
    fi
  else
    echo "  [DRY-RUN] would set $key = ${value:0:12}... (target: production)"
  fi
}

# Applique par projet
for project_name in "${!PROJECTS[@]}"; do
  project_id="${PROJECTS[$project_name]}"
  echo ""
  echo "📦 Project: $project_name ($project_id)"

  # Sélection des vars selon le projet
  case "$project_name" in
    "reset-api")
      for key in "${!API_VARS[@]}"; do
        set_env "$project_id" "$key" "${API_VARS[$key]}"
      done
      ;;
    "reset-site")
      for key in "${!SITE_VARS[@]}"; do
        set_env "$project_id" "$key" "${SITE_VARS[$key]}"
      done
      ;;
  esac
done

echo ""
if $APPLY; then
  echo "🎉 Done. Redeploy manually via Vercel dashboard OR :"
  echo "   vercel --prod --token=\$VERCEL_TOKEN --cwd=apps/api"
  echo "   vercel --prod --token=\$VERCEL_TOKEN --cwd=apps/site"
else
  echo "💡 Dry-run terminé. Relance avec --apply pour appliquer :"
  echo "   VERCEL_TOKEN=\$VERCEL_TOKEN bash scripts/setup-vercel-env.sh --apply"
fi
