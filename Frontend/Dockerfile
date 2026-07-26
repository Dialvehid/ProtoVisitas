# --- Build stage ------------------------------------------------------------
FROM node:20-bookworm AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_URL=http://localhost:8000
ARG VITE_GOOGLE_MAPS_API_KEY=
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}

RUN npm run build

# --- Runtime stage ----------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
