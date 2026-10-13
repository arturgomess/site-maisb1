#!/bin/sh
set -eu

if [ "${SKIP_DB_SETUP:-false}" != "true" ]; then
  if [ -f "/app/node_modules/prisma/build/index.js" ]; then
    node /app/prisma/prepare-migrations.mjs || { echo "Prisma legacy baseline check failed; refusing to start without a safe migration state." >&2; exit 1; }
    node /app/node_modules/prisma/build/index.js migrate deploy || { echo "Prisma migrations failed; refusing to start without the access-control schema." >&2; exit 1; }
    node /app/node_modules/prisma/build/index.js db push --skip-generate || { echo "Prisma db push failed; refusing to start with an incompatible schema." >&2; exit 1; }
  elif [ -f "/app/node_modules/.bin/prisma" ]; then
    node /app/prisma/prepare-migrations.mjs || { echo "Prisma legacy baseline check failed; refusing to start without a safe migration state." >&2; exit 1; }
    /app/node_modules/.bin/prisma migrate deploy || { echo "Prisma migrations failed; refusing to start without the access-control schema." >&2; exit 1; }
    /app/node_modules/.bin/prisma db push --skip-generate || { echo "Prisma db push failed; refusing to start with an incompatible schema." >&2; exit 1; }
  fi
fi

exec node /app/server.js
