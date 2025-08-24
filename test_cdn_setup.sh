#!/bin/bash

# ViralSplit CDN Setup Test Script

echo "🔍 Testing ViralSplit CDN Setup"
echo "================================"

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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to test DNS resolution
test_dns_resolution() {
    local domain=$1
    print_status "Testing DNS resolution for $domain..."
    
    if command_exists nslookup; then
        if nslookup "$domain" >/dev/null 2>&1; then
            print_success "DNS resolution successful for $domain"
            return 0
        else
            print_error "DNS resolution failed for $domain"
            return 1
        fi
    elif command_exists dig; then
        if dig "$domain" +short | grep -q .; then
            print_success "DNS resolution successful for $domain"
            return 0
        else
            print_error "DNS resolution failed for $domain"
            return 1
        fi
    else
        print_warning "Neither nslookup nor dig found. Skipping DNS test."
        return 0
    fi
}

# Function to test HTTPS connectivity
test_https_connectivity() {
    local domain=$1
    print_status "Testing HTTPS connectivity to $domain..."
    
    if command_exists curl; then
        if curl -s -I "https://$domain" >/dev/null 2>&1; then
            print_success "HTTPS connectivity successful for $domain"
            return 0
        else
            print_error "HTTPS connectivity failed for $domain"
            return 1
        fi
    else
        print_warning "curl not found. Skipping HTTPS test."
        return 0
    fi
}

# Function to test R2 bucket access
test_r2_bucket() {
    print_status "Testing R2 bucket access..."
    
    # Check if environment variables are set
    if [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ -z "$CLOUDFLARE_ACCESS_KEY_ID" ] || [ -z "$CLOUDFLARE_SECRET_ACCESS_KEY" ]; then
        print_warning "Cloudflare environment variables not set. Loading from .env file..."
        
        if [ -f "apps/api/.env" ]; then
            export $(grep -v '^#' apps/api/.env | xargs)
        else
            print_error "No .env file found. Please set Cloudflare environment variables."
            return 1
        fi
    fi
    
    # Test R2 bucket access using Python
    python3 -c "
import boto3
import os
from botocore.exceptions import ClientError

try:
    # Create S3 client for R2
    s3 = boto3.client('s3',
        endpoint_url=f'https://{os.getenv(\"CLOUDFLARE_ACCOUNT_ID\")}.r2.cloudflarestorage.com',
        aws_access_key_id=os.getenv('CLOUDFLARE_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('CLOUDFLARE_SECRET_ACCESS_KEY')
    )
    
    # Test bucket access
    response = s3.head_bucket(Bucket='viralsplit-media')
    print('✅ R2 bucket access successful')
    
    # Test file upload
    test_content = 'Hello ViralSplit CDN Test!'
    s3.put_object(
        Bucket='viralsplit-media',
        Key='test/cdn-test.txt',
        Body=test_content,
        ContentType='text/plain'
    )
    print('✅ R2 file upload successful')
    
    # Test file download
    response = s3.get_object(Bucket='viralsplit-media', Key='test/cdn-test.txt')
    downloaded_content = response['Body'].read().decode('utf-8')
    if downloaded_content == test_content:
        print('✅ R2 file download successful')
    else:
        print('❌ R2 file download failed - content mismatch')
    
    # Clean up test file
    s3.delete_object(Bucket='viralsplit-media', Key='test/cdn-test.txt')
    print('✅ R2 test file cleanup successful')
    
except ClientError as e:
    print(f'❌ R2 bucket test failed: {e}')
    exit(1)
except Exception as e:
    print(f'❌ R2 test error: {e}')
    exit(1)
"
    
    if [ $? -eq 0 ]; then
        print_success "R2 bucket tests passed"
        return 0
    else
        print_error "R2 bucket tests failed"
        return 1
    fi
}

# Function to test CDN domain
test_cdn_domain() {
    local cdn_domain=$1
    
    if [ -z "$cdn_domain" ]; then
        print_warning "CDN domain not specified. Using default..."
        cdn_domain="cdn.viralsplit.io"
    fi
    
    print_status "Testing CDN domain: $cdn_domain"
    
    # Test DNS resolution
    if test_dns_resolution "$cdn_domain"; then
        # Test HTTPS connectivity
        if test_https_connectivity "$cdn_domain"; then
            print_success "CDN domain $cdn_domain is working correctly"
            return 0
        else
            print_error "CDN domain $cdn_domain has connectivity issues"
            return 1
        fi
    else
        print_error "CDN domain $cdn_domain has DNS issues"
        return 1
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    local api_url=$1
    
    if [ -z "$api_url" ]; then
        print_warning "API URL not specified. Using localhost..."
        api_url="http://localhost:8000"
    fi
    
    print_status "Testing API endpoints at $api_url"
    
    if command_exists curl; then
        # Test health endpoint
        if curl -s "$api_url/health" >/dev/null 2>&1; then
            print_success "API health endpoint accessible"
        else
            print_error "API health endpoint not accessible"
            return 1
        fi
        
        # Test API documentation
        if curl -s "$api_url/docs" >/dev/null 2>&1; then
            print_success "API documentation accessible"
        else
            print_warning "API documentation not accessible"
        fi
    else
        print_warning "curl not found. Skipping API tests."
    fi
    
    return 0
}

# Function to run comprehensive tests
run_comprehensive_tests() {
    print_status "Starting comprehensive CDN setup tests..."
    
    local test_results=0
    
    # Test 1: Environment variables
    print_status "Test 1: Checking environment variables..."
    if [ -f "apps/api/.env" ]; then
        print_success "Environment file found"
        
        # Check for required variables
        required_vars=("CLOUDFLARE_ACCOUNT_ID" "CLOUDFLARE_ACCESS_KEY_ID" "CLOUDFLARE_SECRET_ACCESS_KEY" "CDN_DOMAIN")
        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" apps/api/.env; then
                print_success "$var is configured"
            else
                print_warning "$var is not configured"
                test_results=$((test_results + 1))
            fi
        done
    else
        print_error "Environment file not found"
        test_results=$((test_results + 1))
    fi
    
    # Test 2: R2 bucket access
    print_status "Test 2: Testing R2 bucket access..."
    if test_r2_bucket; then
        print_success "R2 bucket access working"
    else
        print_error "R2 bucket access failed"
        test_results=$((test_results + 1))
    fi
    
    # Test 3: CDN domain
    print_status "Test 3: Testing CDN domain..."
    cdn_domain=$(grep "^CDN_DOMAIN=" apps/api/.env | cut -d'=' -f2 2>/dev/null)
    if test_cdn_domain "$cdn_domain"; then
        print_success "CDN domain working"
    else
        print_error "CDN domain failed"
        test_results=$((test_results + 1))
    fi
    
    # Test 4: API endpoints (if API is running)
    print_status "Test 4: Testing API endpoints..."
    if test_api_endpoints; then
        print_success "API endpoints working"
    else
        print_warning "API endpoints not accessible (API may not be running)"
    fi
    
    # Test 5: File upload/download through CDN
    print_status "Test 5: Testing file upload/download through CDN..."
    if [ -n "$cdn_domain" ]; then
        # Upload test file to R2 and test CDN access
        python3 -c "
import boto3
import os
import requests
from botocore.exceptions import ClientError

try:
    # Load environment variables
    if os.path.exists('apps/api/.env'):
        with open('apps/api/.env', 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    
    # Create S3 client for R2
    s3 = boto3.client('s3',
        endpoint_url=f'https://{os.getenv(\"CLOUDFLARE_ACCOUNT_ID\")}.r2.cloudflarestorage.com',
        aws_access_key_id=os.getenv('CLOUDFLARE_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('CLOUDFLARE_SECRET_ACCESS_KEY')
    )
    
    # Upload test file
    test_content = 'CDN Test File - $(date)'
    s3.put_object(
        Bucket='viralsplit-media',
        Key='test/cdn-integration-test.txt',
        Body=test_content,
        ContentType='text/plain'
    )
    
    # Test CDN access
    cdn_domain = os.getenv('CDN_DOMAIN', 'cdn.viralsplit.io')
    cdn_url = f'https://{cdn_domain}/test/cdn-integration-test.txt'
    
    response = requests.get(cdn_url, timeout=10)
    if response.status_code == 200 and response.text == test_content:
        print('✅ CDN integration test successful')
    else:
        print(f'❌ CDN integration test failed: {response.status_code}')
    
    # Clean up
    s3.delete_object(Bucket='viralsplit-media', Key='test/cdn-integration-test.txt')
    
except Exception as e:
    print(f'❌ CDN integration test error: {e}')
"
        
        if [ $? -eq 0 ]; then
            print_success "CDN integration test passed"
        else
            print_error "CDN integration test failed"
            test_results=$((test_results + 1))
        fi
    fi
    
    return $test_results
}

# Main execution
main() {
    print_status "Starting ViralSplit CDN setup tests..."
    
    # Check prerequisites
    if ! command_exists python3; then
        print_error "Python 3 is required for testing"
        exit 1
    fi
    
    # Install required Python packages if needed
    print_status "Checking Python dependencies..."
    python3 -c "import boto3, requests" 2>/dev/null || {
        print_status "Installing required Python packages..."
        pip3 install boto3 requests
    }
    
    # Run comprehensive tests
    run_comprehensive_tests
    test_exit_code=$?
    
    echo ""
    echo "========================================"
    echo "Test Results Summary"
    echo "========================================"
    
    if [ $test_exit_code -eq 0 ]; then
        print_success "All CDN setup tests passed! 🎉"
        echo ""
        print_status "Your ViralSplit CDN is ready for production use."
        print_status "You can now deploy your application to the cloud."
    else
        print_error "Some tests failed. Please check the issues above."
        echo ""
        print_status "Common solutions:"
        print_status "1. Verify Cloudflare R2 bucket configuration"
        print_status "2. Check DNS propagation (can take up to 48 hours)"
        print_status "3. Ensure environment variables are set correctly"
        print_status "4. Verify API credentials have proper permissions"
    fi
    
    exit $test_exit_code
}

# Run main function
main
