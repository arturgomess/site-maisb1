FROM node:22-alpine AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
# Next standalone uses HOSTNAME as its bind address when it is present. Docker
# injects the container hostname automatically, so force an address reachable
# by the reverse proxy and the container network.
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/prisma ./prisma
# The production entrypoint runs Prisma migrations before starting Next.js.
# Copy the complete installed tree so Prisma's transitive runtime dependencies
# (for example `effect`) are available in the standalone image.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/docker/entrypoint.sh ./docker/entrypoint.sh

RUN mkdir -p /app/public/uploads \
  && chmod +x /app/docker/entrypoint.sh \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
