FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate && npm run db:migrate-os && npm run db:migrate-proposal-flow && npm run db:seed && npm run db:seed-permissions && npm start"]
