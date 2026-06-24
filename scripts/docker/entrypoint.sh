#!/bin/sh
set -e

echo "▶ Running database migrations..."
if ! npm run db:migrate; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  STARTUP FAILED: migrations did not complete."
  echo "  Check the error above, fix your .env file,"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

if [ "$NODE_ENV" = "production" ]; then
  echo "▶ Skipping database seeds in production environment."
else
  echo "▶ Running database seeds..."
  if ! npm run db:seed; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  STARTUP FAILED: seeds did not complete."
    echo "  Check the error above, fix your .env file,"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
  fi
fi

echo "▶ Starting server..."
exec "$@"
