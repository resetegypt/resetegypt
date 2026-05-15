#!/usr/bin/env bash
# Lanceur court de la mise en service "messagerie praticien".
# Le terminal bugue sur le collage de longues commandes -> on tape juste : bash go.sh
exec bash "$(dirname "$0")/scripts/mailbox-go-live.sh"
