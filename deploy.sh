#!/bin/bash

# ViralSplit Cloud Deployment Script

echo "🚀 ViralSplit Cloud Deployment Script"
echo "======================================"

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

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the viralsplit root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for deployment platform
select_platform() {
    echo ""
    echo "Select your deployment platform:"
    echo "1) Railway (Recommended for startups)"
    echo "2) Render"
    echo "3) DigitalOcean App Platform"
    echo "4) AWS ECS/Fargate"
    echo "5) Exit"
    echo ""
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1) deploy_railway ;;
        2) deploy_render ;;
        3) deploy_digitalocean ;;
        4) deploy_aws ;;
        5) print_status "Exiting..."; exit 0 ;;
        *) print_error "Invalid choice. Please try again."; select_platform ;;
    esac
}

# Railway deployment
deploy_railway() {
    print_status "Setting up Railway deployment..."
    
    if ! command_exists railway; then
        print_status "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    print_status "Please login to Railway..."
    railway login
    
    print_status "Initializing Railway project..."
    railway init
    
    print_warning "Please configure your environment variables in Railway dashboard:"
    echo "Required variables:"
    echo "- CLOUDFLARE_ACCOUNT_ID"
    echo "- CLOUDFLARE_ACCESS_KEY_ID"
    echo "- CLOUDFLARE_SECRET_ACCESS_KEY"
    echo "- CDN_DOMAIN"
    echo "- JWT_SECRET"
    echo "- REDIS_URL"
    echo "- ENVIRONMENT=production"
    
    read -p "Press Enter when you've configured the environment variables..."
    
    print_status "Adding Redis service..."
    railway add redis
    
    print_status "Deploying API..."
    railway up
    
    print_status "Creating Celery worker service..."
    railway service create viral-split-worker
    
    print_status "Configuring worker environment..."
    railway service viral-split-worker
    railway variables set CELERY_WORKER=true
    railway variables set REDIS_URL=$(railway variables get REDIS_URL)
    
    print_status "Deploying worker..."
    railway up --service viral-split-worker
    
    print_success "Railway deployment completed!"
    print_status "Your API URL: $(railway domain)"
}

# Render deployment
deploy_render() {
    print_status "Setting up Render deployment..."
    
    print_warning "Please follow these steps:"
    echo "1. Go to https://render.com"
    echo "2. Connect your GitHub repository"
    echo "3. Select 'Blueprint' deployment"
    echo "4. Update environment variables in the dashboard"
    echo "5. Deploy all services"
    
    print_status "The render.yaml file is already configured in your repository."
    print_success "Render deployment instructions provided!"
}

# DigitalOcean deployment
deploy_digitalocean() {
    print_status "Setting up DigitalOcean App Platform deployment..."
    
    if ! command_exists doctl; then
        print_status "Installing DigitalOcean CLI..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install doctl
        else
            snap install doctl
        fi
    fi
    
    print_status "Please authenticate with DigitalOcean..."
    doctl auth init
    
    print_warning "Please update the .do/app.yaml file with your repository details"
    print_status "Then run: doctl apps create --spec .do/app.yaml"
    
    print_success "DigitalOcean deployment instructions provided!"
}

# AWS deployment
deploy_aws() {
    print_status "Setting up AWS ECS/Fargate deployment..."
    
    print_warning "AWS deployment requires manual setup:"
    echo "1. Create ECS cluster"
    echo "2. Create task definitions for API and workers"
    echo "3. Set up Application Load Balancer"
    echo "4. Configure environment variables"
    echo "5. Deploy services"
    
    print_status "Please refer to the CLOUD_DEPLOYMENT_GUIDE.md for detailed AWS instructions."
    print_success "AWS deployment instructions provided!"
}

# Main deployment flow
main() {
    print_status "Starting ViralSplit deployment..."
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists git; then
        print_error "Git is not installed"
        exit 1
    fi
    
    if ! command_exists docker; then
        print_warning "Docker is not installed. Some deployment options may not work."
    fi
    
    # Check if environment files exist
    if [ ! -f "apps/api/.env" ]; then
        print_warning "apps/api/.env not found. Please create it with your production credentials."
    fi
    
    # Start Redis if not running
    print_status "Checking Redis status..."
    if ! redis-cli ping >/dev/null 2>&1; then
        print_status "Starting Redis server..."
        redis-server --daemonize yes
        sleep 2
        if redis-cli ping >/dev/null 2>&1; then
            print_success "Redis started successfully"
        else
            print_error "Failed to start Redis"
            exit 1
        fi
    else
        print_success "Redis is already running"
    fi
    
    # Run tests before deployment
    print_status "Running tests before deployment..."
    cd apps/api
    if python3 -m pytest tests/ -q; then
        print_success "All tests passed!"
    else
        print_error "Tests failed. Please fix them before deploying."
        exit 1
    fi
    cd ../..
    
    # Select deployment platform
    select_platform
}

# Run main function
main
