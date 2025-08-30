# Development Tools

This directory contains development utilities, testing scripts, and monitoring tools for the ViralSplit platform.

## Structure

```
tools/
├── testing/          # Test scripts and utilities
├── monitoring/       # System monitoring and notifications
├── setup/           # Development environment setup
└── README.md        # This file
```

## Testing Tools (`testing/`)

Scripts for testing various aspects of the application:

```bash
./tools/testing/test_api.sh                 # Test API endpoints
./tools/testing/test_websocket_api.sh       # Test WebSocket functionality
./tools/testing/test_complete_system.sh     # Full system integration test
./tools/testing/test_cdn_setup.sh          # Test CDN configuration
./tools/testing/test_voice.sh              # Test voice features
./tools/testing/test_celery.sh             # Test background processing
```

## Setup Tools (`setup/`)

Development environment setup and management:

```bash
./tools/setup/start-dev.sh          # Start development environment
./tools/setup/restart-dev.sh        # Restart all development services
./tools/setup/status.sh            # Check service status
./tools/setup/dev.sh               # Development utilities
./tools/setup/setup-cdn.sh         # CDN setup and configuration
```

## Monitoring Tools (`monitoring/`)

System monitoring and notification utilities:

```bash
./tools/monitoring/notifier.sh      # System notification functions
```

The notifier provides functions for:
- Deployment status notifications
- System health alerts  
- Integration with deployment scripts

## Usage Examples

### Run Full System Test
```bash
./tools/testing/test_complete_system.sh
```

### Start Development Environment
```bash
./tools/setup/start-dev.sh
```

### Test API Endpoints
```bash
./tools/testing/test_api.sh
```

### Check System Status
```bash
./tools/setup/status.sh
```

## Integration

These tools integrate with:
- Main application services
- Deployment pipeline
- Version management system
- CI/CD workflows

All scripts are designed to work from any directory and will locate the project root automatically.