#!/bin/bash

# Production Build Script for Thirumala Business Management System
# This script prepares the application for production deployment

set -e  # Exit on any error

echo "🚀 Thirumala Business Management System - Production Build"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version: $(node --version)"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        print_success ".env file created from template"
        print_warning "Please update .env with your production values"
    else
        print_error "env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist
rm -rf node_modules/.vite
print_success "Cleanup completed"

# Install dependencies
print_status "Installing dependencies..."
npm ci --only=production
print_success "Dependencies installed"

# Run security audit
print_status "Running security audit..."
if npm audit --audit-level moderate; then
    print_success "Security audit passed"
else
    print_warning "Security audit found issues. Consider running 'npm audit fix'"
fi

# Type checking
print_status "Running TypeScript type checking..."
if npm run type-check; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    exit 1
fi

# Linting
print_status "Running linting..."
if npm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting found issues. Consider running 'npm run lint:fix'"
fi

# Build application
print_status "Building application..."
if npm run build; then
    print_success "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Check build output
if [ ! -d "dist" ]; then
    print_error "Build output directory 'dist' not found"
    exit 1
fi

print_success "Build output size: $(du -sh dist | cut -f1)"

# Create production manifest
print_status "Creating production manifest..."
cat > dist/manifest.json << EOF
{
  "name": "Thirumala Business Management System",
  "version": "$(node -p "require('./package.json').version")",
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)"
}
EOF
print_success "Production manifest created"

# Security checks
print_status "Running security checks..."

# Check for sensitive files in build
if find dist -name "*.env*" -o -name "*.key*" -o -name "*.pem*" | grep -q .; then
    print_error "Sensitive files found in build output"
    find dist -name "*.env*" -o -name "*.key*" -o -name "*.pem*"
    exit 1
fi

# Check for source maps in production
if find dist -name "*.map" | grep -q .; then
    print_warning "Source maps found in production build"
    print_status "Removing source maps for security..."
    find dist -name "*.map" -delete
    print_success "Source maps removed"
fi

print_success "Security checks completed"

# Create deployment package
print_status "Creating deployment package..."
DEPLOY_PACKAGE="thirumala-production-$(date +%Y%m%d-%H%M%S).tar.gz"

tar -czf "$DEPLOY_PACKAGE" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.vscode \
    --exclude=*.log \
    --exclude=coverage \
    --exclude=.nyc_output \
    --exclude=dist \
    .

print_success "Deployment package created: $DEPLOY_PACKAGE"

# Final checks
print_status "Running final checks..."

# Check if server.js exists
if [ ! -f "server.js" ]; then
    print_error "server.js not found"
    exit 1
fi

# Check if Docker files exist
if [ ! -f "Dockerfile" ] || [ ! -f "docker-compose.yml" ]; then
    print_warning "Docker files not found. Docker deployment may not work."
fi

# Check if nginx.conf exists
if [ ! -f "nginx.conf" ]; then
    print_warning "nginx.conf not found. Nginx configuration may be needed."
fi

print_success "Final checks completed"

# Summary
echo ""
echo "🎉 Production Build Summary"
echo "=========================="
echo "✅ Node.js version: $(node --version)"
echo "✅ Dependencies installed"
echo "✅ Type checking passed"
echo "✅ Application built"
echo "✅ Security checks completed"
echo "✅ Build size: $(du -sh dist | cut -f1)"
echo "✅ Deployment package: $DEPLOY_PACKAGE"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env with production values"
echo "2. Set up Supabase project and run migration"
echo "3. Deploy using Docker or direct server deployment"
echo "4. Configure SSL certificate"
echo "5. Set up monitoring and backups"
echo ""
echo "📖 See PRODUCTION_DEPLOYMENT.md for detailed instructions"
echo ""

print_success "Production build completed successfully!" 