# syntax=docker/dockerfile:1
FROM node:22-slim

WORKDIR /app

# Native deps for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++   && rm -rf /var/lib/apt/lists/*

COPY package.json ./
# If you use npm lockfile, copy it here too
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
