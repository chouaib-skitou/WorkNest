#!/usr/bin/env bash

# Port-forwarding script for WorkNest services in the 'worknest' namespace.
# Run this script to forward the following ports:
#   - Identity Service: cluster port 5000 -> localhost:5000
#   - Project Service:  cluster port 5001 -> localhost:5001
#   - Storage Service:  cluster port 5002 -> localhost:5002
#   - Frontend:         cluster port 80 (via NodePort) -> localhost:4200 (optional)
#   - MailHog UI:       cluster port 8025 -> localhost:8025
#   - MinIO:            cluster ports 9000 and 9001 -> localhost:9000 and localhost:9001
#   - Postgres DB:      cluster port 5432 -> localhost:5432

# Identity Service
kubectl port-forward -n worknest svc/identity-service 5000:5000 &

# Project Service
kubectl port-forward -n worknest svc/project-service 5001:5001 &

# Storage Service
kubectl port-forward -n worknest svc/storage-service 5002:5002 &

# Frontend: Port-forwarding port 80 to local 4200
kubectl port-forward -n worknest svc/frontend 4200:80 &

# MailHog (UI on port 8025)
kubectl port-forward -n worknest svc/mailhog 8025:8025 &

# MinIO: Forward both API (9000) and Console (9001)
kubectl port-forward -n worknest svc/minio 9000:9000 9001:9001 &

# Postgres DB
kubectl port-forward -n worknest svc/postgres-db 5432:5432 &

echo "Port forwarding started. Access the services as follows:"
echo "  Identity Service: http://localhost:5000"
echo "  Project Service:  http://localhost:5001"
echo "  Storage Service:  http://localhost:5002"
echo "  Frontend:         http://localhost:4200"
echo "  MailHog UI:       http://localhost:8025"
echo "  MinIO API:        http://localhost:9000"
echo "  MinIO Console:    http://localhost:9001"
echo "  Database (Postgres): http://localhost:5432"
echo "Press Ctrl+C to stop port forwarding."

# Wait indefinitely so the background port-forward processes keep running.
wait
