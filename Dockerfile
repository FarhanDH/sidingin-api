# Build stage
FROM node:24-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package*.json pnpm-*.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Production Run
FROM node:24-alpine AS runner

RUN npm install -g pnpm

WORKDIR /app

COPY package*.json pnpm-*.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

ENV NODE_ENV=production
ENV PORT=9000

EXPOSE 9000

CMD [ "node", "dist/main.js" ]
