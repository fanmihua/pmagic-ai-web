FROM node:24-alpine AS deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install

FROM node:24-alpine AS admin-build
WORKDIR /app/admin
COPY admin/package*.json ./
RUN npm install
COPY admin ./
RUN npm run build

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server
RUN cd server && npm run prisma:generate && npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/prisma ./server/prisma
COPY index.html styles.css script.js ./
COPY assets ./assets
COPY uploads ./uploads
COPY --from=admin-build /app/admin/dist ./admin/dist
WORKDIR /app/server
EXPOSE 5173
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/src/app.js"]
