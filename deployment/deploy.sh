#!/usr/bin/env bash

# This script applies all Kubernetes manifests for the WorkNest deployment.

set -e  # Exit on error

echo "🏗  Creating namespace..."
kubectl apply -f k8s/00-namespace.yaml

echo "🐘 Deploying Postgres..."
kubectl apply -f k8s/01-postgres.yaml

echo "📨 Deploying MailHog..."
kubectl apply -f k8s/02-mailhog.yaml

echo "💾 Deploying MinIO..."
kubectl apply -f k8s/03-minio.yaml

echo "🔧 Deploying MinIO initialization Job..."
kubectl apply -f k8s/04-minio-init.yaml

echo "🔑 Deploying Identity Service..."
kubectl apply -f k8s/05-identity-service.yaml

echo "📁 Deploying Project Service..."
kubectl apply -f k8s/06-project-service.yaml

echo "📦 Deploying Storage Service..."
kubectl apply -f k8s/07-storage-service.yaml

echo "🌐 Deploying Frontend..."
kubectl apply -f k8s/08-frontend.yaml

echo "✅ All services deployed."
echo "You can check pods with: kubectl get pods -n worknest"
