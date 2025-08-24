# ViralSplit API Test Suite

This directory contains comprehensive tests for the ViralSplit API, including unit tests, integration tests, and functional tests.

## Test Structure

```
tests/
├── __init__.py              # Test package initialization
├── conftest.py              # Pytest configuration and fixtures
├── test_auth.py             # Authentication service tests
├── test_storage.py          # Storage service tests
├── test_video_processor.py  # Video processing tests
├── test_api_endpoints.py    # API endpoint tests
└── README.md               # This file
```

## Test Categories

### 1. Unit Tests (`test_auth.py`, `test_storage.py`, `test_video_processor.py`)
- **Purpose**: Test individual functions and methods in isolation
- **Scope**: Single service/component functionality
- **Dependencies**: Mocked external dependencies
- **Speed**: Fast execution

### 2. Integration Tests (`test_storage.py`, `test_video_processor.py`)
- **Purpose**: Test interaction between multiple components
- **Scope**: Service-to-service communication
- **Dependencies**: Some real dependencies, others mocked
- **Speed**: Medium execution time

### 3. Functional Tests (`test_api_endpoints.py`)
- **Purpose**: Test complete API workflows
- **Scope**: End-to-end functionality
- **Dependencies**: Full application stack
- **Speed**: Slower execution

## Running Tests

### Prerequisites
1. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```

2. Install test dependencies:
   ```bash
   pip install -r requirements-test.txt
   ```

### Running All Tests
```bash
./run_tests.sh
```

### Running Specific Test Categories
```bash
# Unit tests only
pytest tests/ -m "unit"

# Integration tests only
pytest tests/ -m "integration"

# Functional tests only
pytest tests/ -m "functional"

# Authentication tests
pytest tests/ -m "auth"

# Storage tests
pytest tests/ -m "storage"

# Video processing tests
pytest tests/ -m "video"

# API endpoint tests
pytest tests/ -m "api"
```

### Running Individual Test Files
```bash
# Run authentication tests
pytest tests/test_auth.py -v

# Run storage tests
pytest tests/test_storage.py -v

# Run video processor tests
pytest tests/test_video_processor.py -v

# Run API endpoint tests
pytest tests/test_api_endpoints.py -v
```

### Running with Coverage
```bash
# Run with coverage report
pytest tests/ --cov=services --cov=main --cov-report=term-missing

# Generate HTML coverage report
pytest tests/ --cov=services --cov=main --cov-report=html:htmlcov

# Generate XML coverage report (for CI/CD)
pytest tests/ --cov=services --cov=main --cov-report=xml
```

## Test Coverage

The test suite covers the following areas:

### Authentication Service (`test_auth.py`)
- ✅ Password hashing and verification
- ✅ JWT token creation and validation
- ✅ User registration and login
- ✅ Social account management
- ✅ Credit management
- ✅ Error handling for invalid credentials
- ✅ Token expiration handling

### Storage Service (`test_storage.py`)
- ✅ R2 storage initialization
- ✅ Unique file key generation
- ✅ Video upload and download
- ✅ Presigned URL generation
- ✅ File deletion
- ✅ CDN URL generation
- ✅ Error handling for storage operations
- ✅ File naming conventions

### Video Processor Service (`test_video_processor.py`)
- ✅ Platform configuration management
- ✅ Video transformation with FFmpeg
- ✅ Multi-platform video processing
- ✅ Error handling for processing failures
- ✅ File cleanup
- ✅ Edge cases and error scenarios

### API Endpoints (`test_api_endpoints.py`)
- ✅ Authentication endpoints (register, login, me)
- ✅ Social account management endpoints
- ✅ Video upload workflow
- ✅ Video transformation endpoints
- ✅ Project status and management
- ✅ Error handling and validation
- ✅ Authorization and access control

## Test Fixtures

### Common Fixtures (`conftest.py`)
- `client`: FastAPI test client
- `test_user`: Sample user data
- `auth_headers`: Authentication header helper
- `mock_storage`: Mocked storage service
- `mock_video_processor`: Mocked video processor
- `temp_video_file`: Temporary video file for testing
- `clear_test_data`: Data cleanup fixture

## Mocking Strategy

### External Dependencies
- **Cloudflare R2**: Mocked using `unittest.mock`
- **FFmpeg**: Mocked subprocess calls
- **Redis/Celery**: Mocked for background tasks
- **File System**: Temporary files and cleanup

### Internal Dependencies
- **Services**: Mocked when testing API endpoints
- **Database**: In-memory storage for tests
- **Authentication**: Mocked JWT tokens

## Test Data Management

### In-Memory Storage
- User data stored in `users_db` dictionary
- Social accounts stored in `social_accounts_db` dictionary
- Projects stored in `projects_db` dictionary

### Cleanup Strategy
- Each test cleans up its own data
- Fixtures ensure proper setup and teardown
- Temporary files are automatically cleaned up

## Performance Considerations

### Test Execution Time
- Unit tests: < 1 second each
- Integration tests: 1-5 seconds each
- Functional tests: 5-30 seconds each

### Resource Usage
- Minimal disk I/O (temporary files)
- No network calls (mocked)
- Memory usage: < 100MB for full test suite

## Continuous Integration

### GitHub Actions Integration
```yaml
- name: Run Tests
  run: |
    cd apps/api
    source venv/bin/activate
    pip install -r requirements-test.txt
    pytest tests/ --cov=services --cov=main --cov-report=xml
```

### Coverage Requirements
- Minimum coverage: 80%
- Critical paths: 90%
- New features: 100%

## Debugging Tests

### Verbose Output
```bash
pytest tests/ -v -s
```

### Debug Specific Test
```bash
pytest tests/test_auth.py::TestAuthService::test_hash_password -v -s
```

### Show Coverage for Specific File
```bash
pytest tests/ --cov=services.auth --cov-report=term-missing
```

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear test function names
3. **Single Responsibility**: Each test should test one thing
4. **Independent**: Tests should not depend on each other
5. **Fast**: Keep tests fast and efficient

### Test Data
1. **Realistic**: Use realistic test data
2. **Minimal**: Use minimal data needed for the test
3. **Clean**: Clean up test data after each test
4. **Isolated**: Test data should not affect other tests

### Mocking
1. **External Dependencies**: Mock external services
2. **Slow Operations**: Mock slow operations
3. **Unpredictable**: Mock unpredictable behavior
4. **Verify**: Verify that mocks are called correctly

## Troubleshooting

### Common Issues

#### Import Errors
```bash
# Ensure you're in the correct directory
cd apps/api

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-test.txt
```

#### FFmpeg Not Found
```bash
# Install FFmpeg (macOS)
brew install ffmpeg

# Install FFmpeg (Ubuntu)
sudo apt-get install ffmpeg
```

#### Permission Errors
```bash
# Make test runner executable
chmod +x run_tests.sh
```

#### Coverage Report Not Generated
```bash
# Ensure coverage is installed
pip install pytest-cov

# Run with coverage
pytest tests/ --cov=services --cov=main --cov-report=html
```

## Contributing

### Adding New Tests
1. Create test file in `tests/` directory
2. Follow naming convention: `test_<module>.py`
3. Use appropriate test markers
4. Add to this documentation

### Test Guidelines
1. Test both success and failure cases
2. Test edge cases and error conditions
3. Use descriptive test names
4. Keep tests independent and fast
5. Mock external dependencies
6. Clean up test data

### Code Coverage
1. Aim for 80%+ coverage
2. Focus on critical business logic
3. Test error handling paths
4. Update coverage requirements as needed
