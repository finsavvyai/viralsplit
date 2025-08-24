# Environment Variables Setup

This guide explains how to set up environment variables for the ViralSplit API.

## Local Development

1. Copy the template file:
   ```bash
   cp apps/api/env.template apps/api/.env
   ```

2. Edit `apps/api/.env` and replace the placeholder values with your actual API keys:

   ```bash
   # API Keys
   OPENAI_API_KEY=sk-your-actual-openai-api-key
   REPLICATE_API_TOKEN=your-actual-replicate-token
   ELEVENLABS_API_KEY=your-actual-elevenlabs-key
   
   # JWT Configuration
   JWT_SECRET=your-actual-secure-jwt-secret
   
   # Cloudflare R2 Storage
   CLOUDFLARE_ACCOUNT_ID=your-actual-cloudflare-account-id
   CLOUDFLARE_ACCESS_KEY_ID=your-actual-access-key-id
   CLOUDFLARE_SECRET_ACCESS_KEY=your-actual-secret-access-key
   CDN_DOMAIN=cdn.viralsplit.io
   
   # Redis Configuration
   REDIS_URL=redis://localhost:6379
   ```

## Production Deployment (Railway)

For production deployment on Railway, set the environment variables using the Railway CLI:

```bash
# Link to your Railway service
railway service

# Set environment variables
railway variables --set "OPENAI_API_KEY=sk-your-actual-openai-api-key"
railway variables --set "JWT_SECRET=your-actual-secure-jwt-secret"
railway variables --set "CLOUDFLARE_ACCOUNT_ID=your-actual-cloudflare-account-id"
railway variables --set "CLOUDFLARE_ACCESS_KEY_ID=your-actual-access-key-id"
railway variables --set "CLOUDFLARE_SECRET_ACCESS_KEY=your-actual-secret-access-key"
railway variables --set "CDN_DOMAIN=cdn.viralsplit.io"
railway variables --set "REDIS_URL=redis://localhost:6379"
railway variables --set "REPLICATE_API_TOKEN=your-actual-replicate-token"
railway variables --set "ELEVENLABS_API_KEY=your-actual-elevenlabs-key"
railway variables --set "LEMONSQUEEZY_API_KEY=your-actual-lemonsqueezy-api-key"
railway variables --set "LEMONSQUEEZY_WEBHOOK_SECRET=your-actual-lemonsqueezy-webhook-secret"
```

## Required API Keys

### OpenAI API Key
- Get from: https://platform.openai.com/api-keys
- Used for: AI content generation, script writing, trend analysis

### Cloudflare R2 Credentials
- Get from: https://dash.cloudflare.com/profile/api-tokens
- Used for: File storage and CDN

### Replicate API Token
- Get from: https://replicate.com/account/api-tokens
- Used for: AI model inference (thumbnails, video processing)

### ElevenLabs API Key
- Get from: https://elevenlabs.io/speech-synthesis
- Used for: Text-to-speech generation

### LemonSqueezy API Key
- Get from: https://app.lemonsqueezy.com/settings/api
- Used for: Payment processing and subscriptions

### LemonSqueezy Webhook Secret
- Get from: https://app.lemonsqueezy.com/settings/webhooks
- Used for: Verifying webhook signatures

### JWT Secret
- Generate a secure random string
- Used for: User authentication and session management

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for JWT_SECRET
- Rotate API keys regularly
- Use environment-specific configurations
