# syntax=docker/dockerfile:1

# ---- Build : Debian (glibc) pour les binaires natifs de Vite, Tailwind et Rolldown ----
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Chemin relatif par défaut : nginx relaie /api vers l'API, même origine, pas de CORS.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---- Exécution : fichiers statiques servis par nginx ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
