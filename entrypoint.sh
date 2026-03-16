#!/bin/sh
set -e

# Copy static files from build to writable volume
echo "Copying static files to writable volume..."
cp -r /usr/share/nginx/html-template/* /usr/share/nginx/html/

# Generate runtime configuration file
echo "Generating runtime configuration..."
cat > /usr/share/nginx/html/config.js <<EOF
window.__ENV__ = {
  GRAPHQL_URL: "${VITE_GRAPHQL_URL:-https://gateway.lab.informationcart.com}",
  COGNITO_DOMAIN: "${VITE_COGNITO_DOMAIN:-homelab-auth.auth.us-east-1.amazoncognito.com}",
  COGNITO_CLIENT_ID: "${VITE_COGNITO_CLIENT_ID:-5j475mtdcm4qevh7q115qf1sfj}",
  COGNITO_REDIRECT_URI: "${VITE_COGNITO_REDIRECT_URI:-http://localhost:5173/callback}",
  COGNITO_ISSUER: "${VITE_COGNITO_ISSUER:-https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ZL7M5Qa7K}",
  APP_VERSION: "${VITE_APP_VERSION:-dev}",
  APP_NAME: "${VITE_APP_NAME:-otel-data-ui}",
  NRBA_ACCOUNT_ID: "${VITE_NRBA_ACCOUNT_ID:-}",
  NRBA_APPLICATION_ID: "${VITE_NRBA_APPLICATION_ID:-}",
  NRBA_LICENSE_KEY: "${VITE_NRBA_LICENSE_KEY:-}",
  NRBA_TRUST_KEY: "${VITE_NRBA_TRUST_KEY:-}",
  NRBA_AGENT_ID: "${VITE_NRBA_AGENT_ID:-}"
};
EOF

echo "Generated runtime configuration:"
sed 's/\(LICENSE_KEY:\s*"\)[^"]*/\1[REDACTED]/g; s/\(TRUST_KEY:\s*"\)[^"]*/\1[REDACTED]/g' /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g "daemon off;"
