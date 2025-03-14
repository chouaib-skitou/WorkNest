#!/usr/bin/env bash
set -e

echo "🔄 Resetting WorkNest deployment in Kubernetes..."

# Delete the namespace (which removes all associated resources)
echo "Deleting namespace 'worknest'..."
kubectl delete namespace worknest --ignore-not-found=true

# Wait until the namespace is fully deleted
echo "Waiting for namespace 'worknest' to be removed..."
while kubectl get namespace worknest >/dev/null 2>&1; do
  echo "Namespace 'worknest' still exists, waiting..."
  sleep 5
done

echo "Namespace 'worknest' deleted."

# Redeploy all resources using the deploy.sh script
# echo "Redeploying all resources..."
# ./deploy.sh

echo "✅ WorkNest Kubernetes reset complete."
