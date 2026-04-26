FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY render.js server.js ./

CMD ["node", "server.js"]
