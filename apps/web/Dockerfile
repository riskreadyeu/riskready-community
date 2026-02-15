FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.cjs index.html ./
COPY src ./src

RUN npm ci
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /run/nginx.pid && chown nginx:nginx /run/nginx.pid

EXPOSE 80
USER nginx
