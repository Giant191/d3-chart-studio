# --- Build/runtime image ---
# Small, production-focused Node image. Multi-stage isn't needed here since
# there's no compile step (plain Express + static assets), but dependencies
# are installed in a separate layer so code edits don't invalidate npm cache.
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy application source
COPY src ./src

# Cloud Run injects PORT at runtime; default to 8080 for local `docker run`
ENV PORT=8080
EXPOSE 8080

# Run as a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "src/server/index.js"]
