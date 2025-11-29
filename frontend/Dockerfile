# Use Node.js LTS for building React app
FROM node:18 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build production-ready static files
RUN npm run build

# Use lightweight Nginx to serve the built files
FROM nginx:alpine

# ✅ Copy the built React files
COPY --from=build /app/dist /usr/share/nginx/html

# ✅ Copy the custom nginx.conf (note: relative path from frontend/)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port 80 for frontend
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
