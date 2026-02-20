FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY public ./public
EXPOSE 9999
ENV DATA_DIR=/data
ENV OBSIDIAN_VAULT_PATH=/data
CMD ["node", "dist/main"]
