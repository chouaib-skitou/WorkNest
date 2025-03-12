FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install OpenSSL
RUN apk add --no-cache openssl

# Copy application files
COPY .babelrc ./
COPY package*.json ./

# Install dependencies
RUN npm install

COPY . .

# Run Prisma migration in production
RUN npm run build

EXPOSE 5000

# Fix: Ensure JWT Secrets are available before running the app
CMD ["sh", "-c", "npm run generate:jwt && npm run migrate:prod && npm start"]
