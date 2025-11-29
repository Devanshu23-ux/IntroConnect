# Use Node.js LTS version
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# ✅ Match your .env port (5001)
EXPOSE 5001

# Start backend server
CMD ["npm", "start"]
