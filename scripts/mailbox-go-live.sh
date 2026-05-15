#!/usr/bin/env bash
# =============================================================================
#  Messagerie praticien — script de mise en service
# =============================================================================
#  Configure les env vars Vercel pour le module mailbox + crée la mailbox du
#  praticien en base. Idempotent.
#
#  PRÉREQUIS (à faire AVANT, via dashboards Supabase + Cloudflare) :
#    1. Supabase Storage -> New bucket -> "email-attachments" -> NOT public
#    2. Cloudflare Email Routing -> route dr.X@reset-egypt.com -> Worker
#       (Worker deploy: voir workers/inbound-email/README.md)
#
#  USAGE :
#    1. Copie  scripts/mailbox-go-live.env.example  →  scripts/mailbox-go-live.env
#    2. Remplis les valeurs (jamais commit, déjà gitignored)
#    3. bash scripts/mailbox-go-live.sh
#
#  Le script est ré-exécutable (idempotent).
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/scripts/mailbox-go-live.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ $ENV_FILE introuvable."
  echo "   Copie scripts/mailbox-go-live.env.example → scripts/mailbox-go-live.env et remplis-le."
  exit 1
fi

# Source les secrets depuis le .env local (gitignored)
# shellcheck disable=SC1090
set -a; . "$ENV_FILE"; set +a

# Validation des variables requises
for v in SUPABASE_URL SUPABASE_SERVICE_KEY INBOUND_EMAIL_SECRET DR_EMAIL DR_DISPLAY_NAME; do
  if [[ -z "${!v:-}" ]]; then
    echo "❌ Variable manquante dans $ENV_FILE : $v"
    exit 1
  fi
done

cd "$ROOT"

# -----------------------------------------------------------------------------
# Mode 1 — via Vercel API (si VERCEL_TOKEN fourni)
# -----------------------------------------------------------------------------
set_env_api() {
  local name="$1" value="$2" project="reset-api"
  local team_param="?teamId=$VERCEL_TEAM_ID"

  # Supprime l'éventuel doublon
  local existing
  existing=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v9/projects/$project/env$team_param" \
    | python -c "import json,sys; d=json.load(sys.stdin); [print(e['id']) for e in d.get('envs',[]) if e.get('key')=='$name']" 2>/dev/null || true)

  if [[ -n "$existing" ]]; then
    while IFS= read -r id; do
      curl -s -X DELETE -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v9/projects/$project/env/$id$team_param" >/dev/null
    done <<< "$existing"
  fi

  # Ajoute
  curl -s -X POST -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
    "https://api.vercel.com/v10/projects/$project/env$team_param" \
    -d "{\"key\":\"$name\",\"value\":\"$value\",\"type\":\"encrypted\",\"target\":[\"production\",\"preview\"]}" \
    >/dev/null
  echo "  ✅ $name posé"
}

# -----------------------------------------------------------------------------
# Mode 2 — fallback Vercel CLI (login interactif requis)
# -----------------------------------------------------------------------------
set_env_cli() {
  local name="$1" value="$2"
  vercel env rm "$name" production --yes >/dev/null 2>&1 || true
  printf '%s' "$value" | vercel env add "$name" production
}

echo "==> [1/2] Variables d'environnement Vercel (projet reset-api)"
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  echo "   (via Vercel API — recommandé)"
  set_env_api INBOUND_EMAIL_SECRET "$INBOUND_EMAIL_SECRET"
  set_env_api SUPABASE_URL          "$SUPABASE_URL"
  set_env_api SUPABASE_SERVICE_KEY  "$SUPABASE_SERVICE_KEY"
else
  echo "   (via Vercel CLI — VERCEL_TOKEN non fourni, login interactif requis)"
  cd "$ROOT/apps/api"
  set_env_cli INBOUND_EMAIL_SECRET "$INBOUND_EMAIL_SECRET"
  set_env_cli SUPABASE_URL          "$SUPABASE_URL"
  set_env_cli SUPABASE_SERVICE_KEY  "$SUPABASE_SERVICE_KEY"
  cd "$ROOT"
fi

echo ""
echo "==> [2/2] Création de la boîte mail praticien en base"
cd "$ROOT/apps/api"
pnpm exec tsx scripts/create-mailbox.ts "$DR_EMAIL" "$DR_EMAIL" "$DR_DISPLAY_NAME"

echo ""
echo "✅ Env vars Vercel posées + mailbox $DR_EMAIL créée en base."
echo ""
echo "   Pour que les env vars s'appliquent, prochaine étape :"
echo "     git push                                  # déclenche redeploy auto reset-api"
echo "   OU déploie manuellement :"
echo "     curl -X POST -H \"Authorization: Bearer \$VERCEL_TOKEN\" \\"
echo "       https://api.vercel.com/v13/deployments?teamId=$VERCEL_TEAM_ID \\"
echo "       -d '{\"name\":\"reset-api\",\"gitSource\":{\"type\":\"github\",\"ref\":\"main\",\"repoId\":1236384598},\"target\":\"production\"}'"
echo ""
echo "   Étape suivante — déployer le Worker Cloudflare. Depuis workers/inbound-email/ :"
echo "     pnpm exec wrangler login"
echo "     printf '%s' 'https://api.reset-egypt.com'        | pnpm exec wrangler secret put RESET_API_URL"
echo "     printf '%s' '$INBOUND_EMAIL_SECRET'              | pnpm exec wrangler secret put INBOUND_EMAIL_SECRET"
echo "     printf '%s' 'resetegypt@gmail.com'               | pnpm exec wrangler secret put GMAIL_FALLBACK"
echo "     pnpm exec wrangler deploy"
echo ""
echo "   Puis dans le dashboard Cloudflare :"
echo "     Email -> Email Routing -> route $DR_EMAIL -> Worker reset-inbound-email"
