#Build stage
FROM ghcr.io/puppeteer/puppeteer:22.7.1 AS build

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

#Production stage
FROM ghcr.io/puppeteer/puppeteer:22.7.1 AS production

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json .

RUN npm ci --only=production

COPY --from=build /app/dist ./dist

CMD npm start
