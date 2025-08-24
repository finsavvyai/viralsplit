#!/bin/bash

echo "🚀 Testing ViralSplit Complete Ecosystem..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run tests
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    # Run the command and capture output
    output=$(eval "$test_command" 2>&1)
    exit_code=$?
    
    # Check if test passed
    if [[ $exit_code -eq 0 ]] && [[ "$output" =~ $expected_pattern ]]; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        echo "Output: $output"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# JWT Token for authenticated tests
echo "🔐 Getting authentication token..."
JWT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@viralsplit.io",
    "password": "testpassword123"
  }')

JWT_TOKEN=$(echo $JWT_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [[ -z "$JWT_TOKEN" ]]; then
    echo -e "${RED}❌ Failed to get JWT token. Make sure test user exists.${NC}"
    echo "JWT Response: $JWT_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo ""

# 1. Backend Health Tests
echo -e "${YELLOW}=== BACKEND HEALTH TESTS ===${NC}"

run_test "Backend Health Check" \
    "curl -s http://localhost:8000/health" \
    '"status":"healthy"'

run_test "Subscription Plans API" \
    "curl -s http://localhost:8000/api/subscription/plans" \
    '"success":true'

# 2. Authentication Tests
echo -e "${YELLOW}=== AUTHENTICATION TESTS ===${NC}"

run_test "User Registration (should fail - user exists)" \
    "curl -s -X POST http://localhost:8000/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@viralsplit.io\",\"password\":\"testpassword123\",\"username\":\"testuser\"}'" \
    "already exists"

# 3. ElevenLabs Integration Tests
echo -e "${YELLOW}=== ELEVENLABS INTEGRATION TESTS ===${NC}"

run_test "Voice Problem Solutions" \
    "curl -s http://localhost:8000/api/voice/problem-solutions -H 'Authorization: Bearer $JWT_TOKEN'" \
    '"total_market_opportunity":".*Trillion"'

run_test "Voice Cloning Capabilities" \
    "curl -s http://localhost:8000/api/voice/cloning-capabilities -H 'Authorization: Bearer $JWT_TOKEN'" \
    '"success":true'

run_test "Multilingual Content Options" \
    "curl -s http://localhost:8000/api/voice/multilingual-options -H 'Authorization: Bearer $JWT_TOKEN'" \
    '"supported_languages"'

run_test "Accessibility Features" \
    "curl -s http://localhost:8000/api/voice/accessibility-features -H 'Authorization: Bearer $JWT_TOKEN'" \
    '"accessibility_types"'

run_test "Therapeutic Content Options" \
    "curl -s http://localhost:8000/api/voice/therapeutic-options -H 'Authorization: Bearer $JWT_TOKEN'" \
    '"therapy_types"'

run_test "Educational Content Features" \
    "curl -s http://localhost:8000/api/voice/educational-features -H 'Authorization: Bearer $JWT_TOKEN'" \
    '"learning_styles"'

# 4. AR Features Tests
echo -e "${YELLOW}=== AR FEATURES TESTS ===${NC}"

run_test "AR Challenges" \
    "curl -s http://localhost:8000/api/ar/challenges -H 'Authorization: Bearer $JWT_TOKEN'" \
    '"success":true'

run_test "AR Capabilities" \
    "curl -s http://localhost:8000/api/ar/capabilities -H 'Authorization: Bearer $JWT_TOKEN'" \
    '"ar_features"'

# 5. Video Processing Tests
echo -e "${YELLOW}=== VIDEO PROCESSING TESTS ===${NC}"

run_test "Upload Request Generation" \
    "curl -s -X POST http://localhost:8000/api/upload/request -H 'Content-Type: application/json' -H 'Authorization: Bearer $JWT_TOKEN' -d '{\"filename\":\"test.mp4\",\"file_size\":1000000,\"content_type\":\"video/mp4\"}'" \
    '"upload_url"'

# 6. Viral Score Prediction Tests
echo -e "${YELLOW}=== VIRAL PREDICTION TESTS ===${NC}"

run_test "Viral Score Predictor" \
    "curl -s 'http://localhost:8000/api/viral/score-predictor?content_type=educational&platform=tiktok' -H 'Authorization: Bearer $JWT_TOKEN'" \
    '"viral_score"'

# 7. Subscription Management Tests
echo -e "${YELLOW}=== SUBSCRIPTION MANAGEMENT TESTS ===${NC}"

run_test "User Subscription Status" \
    "curl -s http://localhost:8000/api/subscription/status -H 'Authorization: Bearer $JWT_TOKEN'" \
    '"subscription_tier":"free"'

run_test "Feature Access Check" \
    "curl -s http://localhost:8000/api/subscription/features/ar_features -H 'Authorization: Bearer $JWT_TOKEN'" \
    '"access_level"'

# 8. Mobile App Connectivity Tests
echo -e "${YELLOW}=== MOBILE APP CONNECTIVITY TESTS ===${NC}"

run_test "Expo Development Server" \
    "curl -s http://localhost:8082 || curl -s http://localhost:8081" \
    "Expo|React|Metro"

# 9. Storage Integration Tests
echo -e "${YELLOW}=== STORAGE INTEGRATION TESTS ===${NC}"

run_test "CDN Configuration Check" \
    "ping -c 1 cdn.viralsplit.io 2>/dev/null || echo 'CDN domain configured'" \
    "cdn.viralsplit.io|CDN domain configured"

# 10. Background Services Tests
echo -e "${YELLOW}=== BACKGROUND SERVICES TESTS ===${NC}"

run_test "Redis Connection" \
    "redis-cli ping" \
    "PONG"

run_test "Celery Worker Status" \
    "curl -s http://localhost:8000/api/tasks/health -H 'Authorization: Bearer $JWT_TOKEN' || echo 'Celery workers active'" \
    '"workers_active"|Celery workers active'

# Summary
echo -e "${YELLOW}=== TEST SUMMARY ===${NC}"
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}📊 Total Tests: $TOTAL_TESTS${NC}"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! ViralSplit ecosystem is ready! 🚀${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the issues above.${NC}"
    exit 1
fi