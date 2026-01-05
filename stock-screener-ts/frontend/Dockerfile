# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build arg pentru VITE_API_BASE (ex: http://localhost:3000 sau http://backend:3000)
ARG VITE_API_BASE=http://localhost:3000
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

# ---------- runtime (nginx) ----------
FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html

# SPA routing (react-router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist ./

EXPOSE 80
