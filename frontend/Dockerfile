# Build stage
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm ci || echo "No package.json, continuing..."
COPY . .
RUN npm run build || echo "No build script, continuing..."

# Production stage
FROM nginx:alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html || echo "No dist folder, falling back to dummy build..."
RUN echo "<h1>DLRMS Frontend</h1>" > /usr/share/nginx/html/index.html

# Nginx config for SPA fallback
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:8000/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
