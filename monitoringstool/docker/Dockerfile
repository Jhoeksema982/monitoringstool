FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/supabase ./supabase
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server/server.js"]