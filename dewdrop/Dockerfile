# Build stage
FROM node:20 AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci
RUN npm install react-markdown

# Copy the rest of the source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.25.3-alpine

# Copy the built app from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
