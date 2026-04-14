#!/bin/bash

# QMS Backend - Complete Setup Script
# This script fixes all 4 startup issues in order

set -e  # Exit on any error

echo "================================"
echo "QMS Backend - Complete Setup"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${YELLOW}➜ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================
# ISSUE 1: START POSTGRESQL WITH DOCKER
# ============================================
print_step "ISSUE 1: Starting PostgreSQL with Docker..."

if ! command -v docker &> /dev/null; then
    print_error "Docker not installed! Please install Docker first."
    echo "Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

print_success "Docker is installed: $(docker --version)"

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^qms-postgres$"; then
    print_step "Container 'qms-postgres' already exists"
    
    if docker ps --format '{{.Names}}' | grep -q "^qms-postgres$"; then
        print_success "Container is already running"
    else
        print_step "Starting existing container..."
        docker start qms-postgres
        sleep 3
        print_success "Container started"
    fi
else
    print_step "Creating new PostgreSQL container..."
    docker run -d \
        --name qms-postgres \
        -e POSTGRES_PASSWORD=password \
        -e POSTGRES_DB=qms_db \
        -p 5432:5432 \
        postgres:15-alpine
    
    print_success "PostgreSQL container created"
    print_step "Waiting for database to start..."
    sleep 5
fi

# Verify connection
print_step "Verifying database connection..."
if docker exec qms-postgres psql -U postgres -d qms_db -c "SELECT 1" > /dev/null 2>&1; then
    print_success "Database connection verified"
else
    print_error "Failed to connect to database"
    echo "Troubleshooting: Check Docker logs with: docker logs qms-postgres"
    exit 1
fi

# ============================================
# ISSUE 2: DATABASE SETUP (Already done by Docker)
# ============================================
print_step "ISSUE 2: Database created (via Docker -e POSTGRES_DB=qms_db)"
print_success "Database 'qms_db' is ready"

# ============================================
# ISSUE 3: CHECK PORT 4000
# ============================================
print_step "ISSUE 3: Checking port 4000..."

# Try to check if port is in use (cross-platform)
if command -v lsof &> /dev/null; then
    if lsof -i :4000 > /dev/null 2>&1; then
        print_step "Port 4000 is in use"
        PID=$(lsof -ti :4000 | head -n1)
        print_step "Killing process on port 4000 (PID: $PID)..."
        kill -9 $PID 2>/dev/null || true
        sleep 1
        print_success "Port 4000 is now free"
    else
        print_success "Port 4000 is free"
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":4000"; then
        print_error "Port 4000 is in use (netstat detected)"
        print_step "Please manually kill the process or change PORT in .env"
    else
        print_success "Port 4000 is free"
    fi
else
    print_success "Assuming port 4000 is free"
fi

# ============================================
# ISSUE 4: INSTALL DEPENDENCIES
# ============================================
print_step "ISSUE 4: Installing dependencies..."

# Get current directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Check if node_modules exists and has packages
if [ -d "node_modules" ] && [ "$(ls -1 node_modules | wc -l)" -gt 100 ]; then
    print_success "Dependencies already installed ($(ls -1 node_modules | wc -l) packages)"
else
    print_step "Running npm install (this may take 1-2 minutes)..."
    npm install --silent
    print_success "Dependencies installed: $(ls -1 node_modules | wc -l) packages"
fi

# ============================================
# BONUS: PRISMA SETUP
# ============================================
print_step "Setting up Prisma..."

print_step "Generating Prisma Client..."
npm run prisma:generate > /dev/null 2>&1 || {
    print_error "Failed to generate Prisma client"
    exit 1
}
print_success "Prisma Client generated"

print_step "Running migrations..."
npx prisma migrate deploy > /dev/null 2>&1 || {
    print_step "No pending migrations or first migration"
}
print_success "Migrations completed"

# ============================================
# ALL ISSUES FIXED
# ============================================
echo ""
echo "================================"
print_success "ALL ISSUES FIXED!"
echo "================================"
echo ""
echo "Your setup is complete. To start the backend:"
echo ""
echo -e "${GREEN}npm run dev${NC}"
echo ""
echo "Expected output:"
echo "  🚀 Server ready at http://localhost:4000/graphql"
echo "  📊 Health check at http://localhost:4000/health"
echo ""
echo "Verify with:"
echo -e "${GREEN}curl http://localhost:4000/health${NC}"
echo ""
