FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY server.mjs ./
COPY lib/ ./lib/
COPY public/ ./public/
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["node", "server.mjs"]
