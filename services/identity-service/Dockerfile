FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install OpenSSL
RUN apk add --no-cache openssl

# Generate JWT secrets
RUN mkdir -p /app/keys && \
    openssl rand -hex 32 > /app/keys/JWT_SECRET && \
    openssl rand -hex 32 > /app/keys/JWT_REFRESH_SECRET

# Set environment variables for JWT secrets
ENV JWT_SECRET_FILE=/app/keys/JWT_SECRET
ENV JWT_REFRESH_SECRET_FILE=/app/keys/JWT_REFRESH_SECRET

# Copy application files
COPY .babelrc ./ 
COPY package*.json ./ 

# Install dependencies
RUN npm install

COPY . .

# Run Prisma migration in production
RUN npm run build

EXPOSE 5000

# **Fix: Ensure JWT Secrets are exported at runtime**
CMD ["sh", "-c", "export JWT_SECRET=$(cat $JWT_SECRET_FILE) && \
                   export JWT_REFRESH_SECRET=$(cat $JWT_REFRESH_SECRET_FILE) && \
                   npm run migrate:prod && npm start"]
