#!/usr/bin/env bash
# Baixa os clipes listados em assets/creditos.txt (Mixkit, 720p) para assets/clips/.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets/clips
grep -oE '^[a-z_]+\.mp4 \| Mixkit #[0-9]+' assets/creditos.txt | while read -r arq _ _ id; do
  id="${id#\#}"
  [ -s "assets/clips/$arq" ] || curl -sS -A "Mozilla/5.0" -o "assets/clips/$arq" "https://assets.mixkit.co/videos/$id/$id-720.mp4"
  echo "ok $arq"
done
