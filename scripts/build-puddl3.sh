#!/usr/bin/env bash
# Rebuild the Puddl3 payroll app into public/puddl3/.
#
# The app lives in its own repo (Eliphaz/puddl3_app, branch feat/ui). The
# export settings below are specific to hosting it here — basePath /puddl3
# would break local dev — so they're applied as a temporary patch and reverted
# afterwards, leaving that repo exactly as it was.
#
# Usage: scripts/build-puddl3.sh [path-to-webapp]

set -euo pipefail

APP="${1:-$HOME/puddl3-webapp}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/puddl3"

# The deployed backend. Currently a free ngrok tunnel to the always-on Mac;
# swap this for the real host when the backend gets deployed properly.
API_URL="${PUDDL3_API_URL:-https://agonizing-perm-precinct.ngrok-free.dev}"

[ -d "$APP" ] || { echo "webapp not found at $APP"; exit 1; }
cd "$APP"

if [ -n "$(git status --porcelain)" ]; then
  echo "!! $APP has uncommitted changes — commit or stash first, this script"
  echo "   reverts the working tree when it's done."
  exit 1
fi

echo "==> patching next.config.js for static export"
cp next.config.js /tmp/puddl3-next.config.bak
cat > next.config.js <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/puddl3',
  trailingSlash: true,
  images: { unoptimized: true },
}

module.exports = nextConfig
EOF

echo "==> building against $API_URL"
NEXT_PUBLIC_API_URL="$API_URL" npx next build

echo "==> copying to $DEST"
rm -rf "$DEST"
cp -R out "$DEST"

echo "==> restoring $APP"
cp /tmp/puddl3-next.config.bak next.config.js
rm -rf out
git checkout -- . 2>/dev/null || true

echo "done — commit public/puddl3/ in the portfolio to deploy."
