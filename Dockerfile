FROM node as builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM ghcr.io/puppeteer/puppeteer:22.7.1

USER node

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/views ./views
COPY --from=builder /usr/src/app/public ./public
COPY .env ./

CMD ["npm", "start"]