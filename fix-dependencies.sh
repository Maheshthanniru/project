#!/bin/bash

# 🔧 Fix Dependencies Script for Vercel Deployment
# This script resolves dependency conflicts and ensures clean installation

echo "🔧 Fixing dependency conflicts..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Remove existing node_modules and package-lock.json
print_status "Cleaning existing dependencies..."
rm -rf node_modules package-lock.json

# Clear npm cache
print_status "Clearing npm cache..."
npm cache clean --force

# Install dependencies with legacy peer deps to resolve conflicts
print_status "Installing dependencies with legacy peer deps..."
if npm install --legacy-peer-deps; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Verify installation
print_status "Verifying installation..."
if npm list vite @vitejs/plugin-react; then
    print_success "Vite and React plugin versions verified"
else
    print_error "Version verification failed"
    exit 1
fi

# Run type checking
print_status "Running TypeScript type checking..."
if npm run type-check; then
    print_success "TypeScript compilation passed"
else
    print_error "TypeScript compilation failed"
    exit 1
fi

# Test build
print_status "Testing build process..."
if npm run build; then
    print_success "Build test passed"
else
    print_error "Build test failed"
    exit 1
fi

print_success "Dependency conflicts resolved successfully! 🎉"
echo ""
echo "📋 Next Steps:"
echo "1. Commit the updated package.json and package-lock.json"
echo "2. Push to your repository"
echo "3. Redeploy on Vercel"
echo ""


