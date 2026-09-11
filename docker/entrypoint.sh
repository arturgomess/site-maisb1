#!/bin/sh
set -eu

if [ "${SKIP_DB_SETUP:-false}" != "true" ]; then
  if [ -f "/app/node_modules/prisma/build/index.js" ]; then
    node /app/node_modules/prisma/build/index.js db push --skip-generate || echo "Prisma db push warning: continuing..."
  elif [ -f "/app/node_modules/.bin/prisma" ]; then
    /app/node_modules/.bin/prisma db push --skip-generate || echo "Prisma db push warning: continuing..."
  fi
fi

exec node /app/server.js
