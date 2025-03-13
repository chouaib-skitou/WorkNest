#!/usr/bin/env bash

# Port-forwarding script for WorkNest services in the 'worknest' namespace.
# Run this script to forward the following ports:
#   - Identity Service: cluster port 5000 -> localhost:5000
#   - Project Service: cluster port 5001 -> localhost:5001
#   - Storage Service: cluster port 5002 -> localhost:5002
#   - Frontend: cluster port 80 (via NodePort) -> localhost:4200 (optional)
#   - MailHog UI: cluster port 8025 -> localhost:8025

# Identity Service
kubectl port-forward -n worknest svc/identity-service 5000:5000 &

# Project Service
kubectl port-forward -n worknest svc/project-service 5001:5001 &

# Storage Service
kubectl port-forward -n worknest svc/storage-service 5002:5002 &

# Frontend: Because we set frontend as NodePort, you can either use the NodePort (minikube ip:30080) or port-forward.
# Here, we port-forward port 80 to local port 4200.
kubectl port-forward -n worknest svc/frontend 4200:80 &

# MailHog (UI on port 8025)
kubectl port-forward -n worknest svc/mailhog 8025:8025 &


echo "Port forwarding started. Access the services as follows:"
echo "  Identity Service: http://localhost:5000"
echo "  Project Service:  http://localhost:5001"
echo "  Storage Service:  http://localhost:5002"
echo "  Frontend:         http://localhost:4200"
echo "  MailHog UI:       http://localhost:8025"
echo "Press Ctrl+C to stop port forwarding."

# Wait indefinitely so the background port-forward processes keep running.
wait
