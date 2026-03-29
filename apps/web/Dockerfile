# NOTE: For production, pin to specific digest: FROM node:20-alpine@sha256:<digest>
# Run: docker pull node:20-alpine && docker inspect --format='{{index .RepoDigests 0}}' node:20-alpine
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.cjs index.html ./
COPY src ./src

RUN npm ci
RUN npm run build

# NOTE: For production, pin to specific digest: FROM nginx:1.27-alpine@sha256:<digest>
# Run: docker pull nginx:1.27-alpine && docker inspect --format='{{index .RepoDigests 0}}' nginx:1.27-alpine
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
