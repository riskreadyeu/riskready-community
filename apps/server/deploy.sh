#!/bin/bash
# RiskReady Server Deployment Script

set -e

echo "🚀 RiskReady Server Deployment"
echo "=============================="

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use correct Node version
echo "📦 Using Node.js version from .nvmrc..."
nvm use

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

# Run migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate

# Build application
echo "🏗️  Building application..."
npm run build

# Restart service
echo "🔄 Restarting service..."
sudo systemctl restart riskready-server

# Check status
echo "✅ Checking service status..."
sudo systemctl status riskready-server --no-pager

echo ""
echo "✨ Deployment complete!"
echo "📊 Server running at: http://localhost (nginx proxy)"
echo "🔗 Direct access: http://localhost:3000"
echo ""
echo "📝 Useful commands:"
echo "  sudo systemctl status riskready-server   - Check service status"
echo "  sudo systemctl restart riskready-server  - Restart service"
echo "  sudo systemctl stop riskready-server     - Stop service"
echo "  sudo systemctl start riskready-server    - Start service"
echo "  sudo journalctl -u riskready-server -f   - View logs"
echo "  sudo nginx -t && sudo systemctl reload nginx - Reload nginx config"
