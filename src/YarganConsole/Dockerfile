# --- Build -------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# DEMO=true ile API'siz demo imajı üretilir: docker build --build-arg DEMO=true
ARG DEMO=false
RUN if [ "$DEMO" = "true" ]; then npm run build:demo; else npm run build; fi

# --- Serve -------------------------------------------------------------------
FROM nginx:1.27-alpine

# nginx resmi imajı /etc/nginx/templates/*.template içindeki ${DEGISKEN}'leri
# açılışta ortam değişkenleriyle doldurur. Varsayılanlar: API'ler host'ta dotnet run ile.
ENV DEVICE_API_URL=http://host.docker.internal:5098 \
    RULE_API_URL=http://host.docker.internal:5165 \
    SATOPS_API_URL=http://host.docker.internal:5131 \
    USER_API_URL=http://host.docker.internal:5050 \
    LOGIN_API_URL=http://host.docker.internal:5002 \
    MQTT_WS_URL=http://host.docker.internal:9001 \
    NGINX_ENVSUBST_FILTER="_URL$"

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
