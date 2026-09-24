FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:24-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4311
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server/app.mjs /app/server/relay.mjs /app/server/index.mjs ./server/
USER node
EXPOSE 4311
CMD ["node", "server/index.mjs"]
