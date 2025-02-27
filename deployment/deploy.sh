#!/bin/bash
set -e

STACK_NAME="my_stack"

echo "Removing existing stack '${STACK_NAME}'..."
docker stack rm ${STACK_NAME}

echo "Waiting for the stack to be removed..."
# Adjust the sleep duration if needed
sleep 15

echo "Removing old JWT secrets (if any)..."
docker secret rm jwt_secret || true
docker secret rm jwt_refresh_secret || true

echo "Generating new JWT keys for identity-service..."
# Navigate to the JWT config directory (adjust relative path if needed)
cd ../services/identity-service/config/jwt
mkdir -p .
# Generate new keys (64 hex characters each)
openssl rand -hex 64 > JWT_SECRET
openssl rand -hex 64 > JWT_REFRESH_SECRET
echo "New JWT keys generated in $(pwd)"

echo "Creating Docker secrets for JWT..."
docker secret create jwt_secret JWT_SECRET
docker secret create jwt_refresh_secret JWT_REFRESH_SECRET

echo "Returning to deployment directory..."
cd ../../../../deployment

echo "Building worknest/identity-service image..."
cd ../services/identity-service
docker build -t worknest/identity-service:latest .

echo "Building worknest/project-service image..."
cd ../project-service
docker build -t worknest/project-service:latest .

echo "Building worknest/frontend image..."
cd ../../frontend
docker build -t worknest/frontend:latest .

echo "Returning to deployment directory..."
cd ../deployment

echo "Deploying stack..."
docker stack deploy -c docker-compose.yml ${STACK_NAME}

echo "Deployment complete. To check services, run: docker stack services ${STACK_NAME}"
