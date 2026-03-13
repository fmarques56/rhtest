# build stage
FROM node:18-alpine AS build-stage
WORKDIR /app
ARG CODESPACE_NAME
ARG GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
ARG LOCAL_WORKSPACE_URL
COPY package.json ./
RUN npm install
COPY . .
RUN if [ -n "$LOCAL_WORKSPACE_URL" ]; then \
		echo VITE_CODESPACES_WORKSPACE_URL=$LOCAL_WORKSPACE_URL > .env; \
	else \
		echo VITE_CODESPACES_WORKSPACE_URL=https://$CODESPACE_NAME-8080.$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN > .env; \
	fi
RUN npm run build

# production stage
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
