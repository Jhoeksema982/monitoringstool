FROM node:20-alpine AS builder
WORKDIR /app

# Install all dependencies (including dev) and build the frontend
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy built frontend and server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/validation ./validation
COPY --from=builder /app/supabase ./supabase
COPY --from=builder /app/*.js ./
COPY --from=builder /app/src ./src

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server.js"]
