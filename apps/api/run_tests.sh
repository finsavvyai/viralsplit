#!/bin/bash

# Test runner script for ViralSplit API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Running ViralSplit API Tests${NC}"

# Check if virtual environment is activated
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo -e "${YELLOW}⚠️  Virtual environment not detected. Activating...${NC}"
    source venv/bin/activate
fi

# Install test dependencies if not already installed
echo -e "${BLUE}📦 Installing test dependencies...${NC}"
pip install -r requirements-test.txt

# Run linting
echo -e "${BLUE}🔍 Running linting...${NC}"
if command -v flake8 &> /dev/null; then
    flake8 services/ main.py --max-line-length=100 --ignore=E501,W503
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠️  flake8 not found, skipping linting${NC}"
fi

# Run type checking
echo -e "${BLUE}🔍 Running type checking...${NC}"
if command -v mypy &> /dev/null; then
    mypy services/ main.py --ignore-missing-imports
    echo -e "${GREEN}✅ Type checking passed${NC}"
else
    echo -e "${YELLOW}⚠️  mypy not found, skipping type checking${NC}"
fi

# Run unit tests
echo -e "${BLUE}🧪 Running unit tests...${NC}"
pytest tests/ -m "unit" --cov=services --cov=main --cov-report=term-missing --cov-report=html:htmlcov

# Run integration tests
echo -e "${BLUE}🔗 Running integration tests...${NC}"
pytest tests/ -m "integration" --cov=services --cov=main --cov-report=term-missing

# Run functional tests
echo -e "${BLUE}⚡ Running functional tests...${NC}"
pytest tests/ -m "functional" --cov=services --cov=main --cov-report=term-missing

# Run all tests with coverage
echo -e "${BLUE}📊 Running full test suite with coverage...${NC}"
pytest tests/ --cov=services --cov=main --cov-report=term-missing --cov-report=html:htmlcov --cov-report=xml

# Show coverage summary
echo -e "${BLUE}📈 Coverage Summary:${NC}"
if [ -f "htmlcov/index.html" ]; then
    echo -e "${GREEN}📊 Coverage report generated: htmlcov/index.html${NC}"
fi

if [ -f "coverage.xml" ]; then
    echo -e "${GREEN}📊 Coverage XML report generated: coverage.xml${NC}"
fi

echo -e "${GREEN}🎉 All tests completed!${NC}"

# Optional: Open coverage report in browser
if command -v open &> /dev/null && [ -f "htmlcov/index.html" ]; then
    echo -e "${BLUE}🌐 Opening coverage report in browser...${NC}"
    open htmlcov/index.html
elif command -v xdg-open &> /dev/null && [ -f "htmlcov/index.html" ]; then
    echo -e "${BLUE}🌐 Opening coverage report in browser...${NC}"
    xdg-open htmlcov/index.html
fi
