#!/usr/bin/env bash
set -e

# This script builds and pushes Docker images for the WorkNest services.
# It assumes the following directory structure:
#   - Frontend:            ./frontend/
#   - Identity Service:    ./services/identity-service/
#   - Project Service:     ./services/project-service/
#   - Storage Service:     ./services/storage-service/
#
# Make sure you are logged in to Docker Hub and your username is set correctly.
# Update the DOCKER_USERNAME variable below if needed.

DOCKER_USERNAME="username"

echo "Building and pushing WorkNest images..."

# Build and push Frontend
echo "------------------------------"
echo "Building frontend image..."
docker build -t ${DOCKER_USERNAME}/frontend:latest frontend/
echo "Pushing frontend image..."
docker push ${DOCKER_USERNAME}/frontend:latest

# Build and push Identity Service
echo "------------------------------"
echo "Building identity-service image..."
docker build -t ${DOCKER_USERNAME}/identity-service:latest services/identity-service/
echo "Pushing identity-service image..."
docker push ${DOCKER_USERNAME}/identity-service:latest

# Build and push Project Service
echo "------------------------------"
echo "Building project-service image..."
docker build -t ${DOCKER_USERNAME}/project-service:latest services/project-service/
echo "Pushing project-service image..."
docker push ${DOCKER_USERNAME}/project-service:latest

# Build and push Storage Service
echo "------------------------------"
echo "Building storage-service image..."
docker build -t ${DOCKER_USERNAME}/storage-service:latest services/storage-service/
echo "Pushing storage-service image..."
docker push ${DOCKER_USERNAME}/storage-service:latest

echo "------------------------------"
echo "All images have been built and pushed successfully!"
