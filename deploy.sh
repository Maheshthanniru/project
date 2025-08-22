#!/bin/bash

# 🚀 Thirumala Admin Dashboard - Vercel Deployment Script
# This script prepares and validates the project for Vercel deployment

echo "🚀 Starting deployment preparation..."

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
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_status "Checking project structure..."

# Check for required files
required_files=("vite.config.ts" "vercel.json" "tsconfig.json" "src/main.tsx")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

print_success "Project structure validated"

# Check Node.js version
print_status "Checking Node.js version..."
node_version=$(node --version)
required_version="v18.0.0"

if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" = "$required_version" ]; then
    print_success "Node.js version $node_version is compatible"
else
    print_warning "Node.js version $node_version detected. Recommended: $required_version or higher"
fi

# Install dependencies
print_status "Installing dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
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

# Run linting
print_status "Running ESLint..."
if npm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting issues found. Consider running 'npm run lint:fix'"
fi

# Build the project
print_status "Building project for production..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Check build output
if [ -d "dist" ]; then
    print_success "Build output directory created"
    dist_size=$(du -sh dist | cut -f1)
    print_status "Build size: $dist_size"
else
    print_error "Build output directory not found"
    exit 1
fi

# Check for environment variables
print_status "Checking environment variables..."
if [ -f ".env" ]; then
    print_success "Local .env file found"
else
    print_warning "No local .env file found. Make sure to set environment variables in Vercel."
fi

# Display deployment checklist
echo ""
echo "📋 Deployment Checklist:"
echo "========================"
echo "✅ Project structure validated"
echo "✅ Dependencies installed"
echo "✅ TypeScript compilation passed"
echo "✅ Build completed successfully"
echo ""
echo "🔧 Next Steps:"
echo "=============="
echo "1. Push your code to GitHub/GitLab"
echo "2. Connect your repository to Vercel"
echo "3. Set environment variables in Vercel dashboard:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "4. Deploy your project"
echo ""
echo "📖 For detailed instructions, see: VERCEL_DEPLOYMENT_GUIDE.md"
echo ""

print_success "Deployment preparation completed successfully! 🎉"

# Optional: Deploy to Vercel if vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo ""
    read -p "Do you want to deploy to Vercel now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deploying to Vercel..."
        vercel --prod
    fi
else
    print_warning "Vercel CLI not found. Install with: npm i -g vercel"
fi
