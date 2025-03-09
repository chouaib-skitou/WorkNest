#!/bin/bash
set -e

echo "Deleting old Kubernetes deployments..."
kubectl delete deployment identity-service project-service frontend || true

echo "Deleting old Kubernetes services..."
kubectl delete service identity-service project-service frontend || true

echo "Building Docker images..."
docker build -t worknest/identity-service:latest ./services/identity-service
docker build -t worknest/project-service:latest ./services/project-service
docker build -t worknest/frontend:latest ./frontend

echo "Loading images into minikube (if using minikube)..."
if minikube status >/dev/null 2>&1; then
  minikube image load worknest/identity-service:latest
  minikube image load worknest/project-service:latest
  minikube image load worknest/frontend:latest
fi

echo "Applying Kubernetes Secrets..."
kubectl create secret generic jwt-secret --from-literal=JWT_SECRET=$(openssl rand -hex 64) --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret generic jwt-refresh-secret --from-literal=JWT_REFRESH_SECRET=$(openssl rand -hex 64) --dry-run=client -o yaml | kubectl apply -f -

echo "Deploying Kubernetes services..."
kubectl apply -f deployment/k8s/

echo "Deployment complete! Checking pod status..."
kubectl get pods
