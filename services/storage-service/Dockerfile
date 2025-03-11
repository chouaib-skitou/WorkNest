# Use a lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all application source
COPY . .

# Expose port defined in .env or default to 5002
EXPOSE 5002

# Start the service
CMD ["node", "server.js"]
