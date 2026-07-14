FROM node:22.14.0-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build

WORKDIR /app
COPY . .
RUN npm run build

FROM node:22.14.0-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/OrderFlowApp/server/server.mjs"]
