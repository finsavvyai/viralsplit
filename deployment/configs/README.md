# Configuration Files

This directory contains environment configuration templates and deployment configurations.

## Environment Setup

1. Copy the environment template:
   ```bash
   cp deployment/configs/env.template apps/api/.env
   ```

2. Edit `apps/api/.env` with your actual API keys and configuration values.

## Available Configurations

- `env.template` - Environment variables template for the API
- Additional deployment configurations will be added here as needed

## Required Environment Variables

See the main README.md for a complete list of required environment variables.