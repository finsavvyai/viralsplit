# ViralSplit Local Testing Guide 🚀

## 🎯 **QUICK START (5 Minutes)**

### **Prerequisites Check**
```bash
# Check if you have the required tools
node --version    # Should be 18+
python --version  # Should be 3.9+
redis-server --version
```

---

## 🔧 **BACKEND SETUP**

### **Step 1: Install Python Dependencies**
```bash
cd /Users/shaharsolomon/dev/projects/mcp-agents/viralsplit/apps/api

# Create virtual environment (if not exists)
python -m venv venv
source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

### **Step 2: Start Background Services**
```bash
# Terminal 1: Start Redis (required for Celery)
redis-server

# Terminal 2: Start Celery Worker (background tasks)
cd /Users/shaharsolomon/dev/projects/mcp-agents/viralsplit/apps/api
source venv/bin/activate
celery -A celery_app worker --loglevel=info

# Terminal 3: Start FastAPI Server
cd /Users/shaharsolomon/dev/projects/mcp-agents/viralsplit/apps/api
source venv/bin/activate
python main.py
```

**Expected Output:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### **Step 3: Test Backend Health**
```bash
# Test basic health check
curl http://localhost:8000/health

# Should return:
# {"status":"healthy","timestamp":"2025-01-XX","uptime":X.X}

# Test API documentation
open http://localhost:8000/docs
```

---

## 📱 **MOBILE APP SETUP**

### **Step 1: Install Dependencies**
```bash
cd /Users/shaharsolomon/dev/projects/mcp-agents/viralsplit/apps/viralsplit-mobile

# Install dependencies
npm install

# If you get package conflicts, force install
npm install --legacy-peer-deps
```

### **Step 2: Start Expo Development Server**
```bash
# Start Expo (should use port 8082 since 8081 is taken)
npx expo start --port 8082

# Or use the npm script
npm start
```

**Expected Output:**
```
Starting project at /Users/shaharsolomon/dev/projects/mcp-agents/viralsplit/apps/viralsplit-mobile
Starting Metro Bundler
Waiting on http://localhost:8082
Logs for your project will appear below.
```

### **Step 3: Test on Device/Simulator**

#### **iOS Simulator:**
```bash
# Install iOS Simulator (if not installed)
npx expo install --ios

# Press 'i' in the Expo terminal to launch iOS simulator
```

#### **Android Emulator:**
```bash
# Press 'a' in the Expo terminal to launch Android emulator
# Make sure Android Studio is installed with an emulator
```

#### **Physical Device:**
1. Install **Expo Go** app on your phone
2. Scan QR code from terminal
3. App should load on your device

---

## 🧪 **TESTING THE INTEGRATIONS**

### **1. Test ElevenLabs Integration**
```bash
# Test voice cloning endpoint
curl -X POST http://localhost:8000/api/voice/clone-from-video \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "video_url": "https://example.com/test-video.mp4",
    "voice_name": "Test Voice"
  }'
```

### **2. Test LemonSqueeze Billing**
```bash
# Test subscription plans
curl http://localhost:8000/api/subscription/plans

# Should return all 4 subscription tiers
```

### **3. Test AR Features**
```bash
# Test AR session creation
curl -X POST http://localhost:8000/api/ar/start-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "style": "photorealistic",
    "features": ["face_detection", "world_tracking"],
    "platform_optimization": "tiktok"
  }'
```

### **4. Test Video Processing**
```bash
# Test video upload request
curl -X POST http://localhost:8000/api/upload/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "filename": "test-video.mp4",
    "file_size": 10485760,
    "content_type": "video/mp4"
  }'
```

---

## 🔐 **AUTHENTICATION SETUP**

### **Create Test User**
```bash
# Register a test user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@viralsplit.io",
    "password": "testpassword123",
    "username": "testuser"
  }'

# Login to get JWT token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@viralsplit.io",
    "password": "testpassword123"
  }'

# Save the JWT token from response for authenticated requests
```

---

## 📊 **DATABASE SETUP (OPTIONAL)**

### **If You Want Local Database:**
```bash
# Install PostgreSQL locally
brew install postgresql  # macOS
# or use Docker
docker run --name viralsplit-db -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres

# Update .env file to use local database
DATABASE_URL=postgresql://postgres:password@localhost:5432/viralsplit_local
```

### **Using Existing Supabase (Recommended):**
Your current `.env` already has Supabase configured, so no changes needed!

---

## 🧪 **COMPREHENSIVE TESTING SCRIPT**

### **Create Test Script:**
```bash
# Create test_all.sh
cat > test_all.sh << 'EOF'
#!/bin/bash

echo "🚀 Testing ViralSplit Complete Ecosystem..."

# Test backend health
echo "1️⃣ Testing Backend Health..."
curl -s http://localhost:8000/health | jq .

# Test subscription plans
echo "2️⃣ Testing Subscription Plans..."
curl -s http://localhost:8000/api/subscription/plans | jq '.plans[] | {name: .name, price: .price_display}'

# Test voice problem solutions
echo "3️⃣ Testing Voice Problem Solutions..."
curl -s http://localhost:8000/api/voice/problem-solutions | jq '.total_market_opportunity'

# Test AR challenges
echo "4️⃣ Testing AR Challenges..."
curl -s http://localhost:8000/api/ar/challenges | jq '.challenges[] | {name: .name, viral_score: .viral_score}'

# Test viral score predictor
echo "5️⃣ Testing Viral Score Predictor..."
curl -s "http://localhost:8000/api/viral/score-predictor?content_type=educational&platform=tiktok" | jq '.viral_score'

echo "✅ All tests completed!"
EOF

chmod +x test_all.sh
./test_all.sh
```

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues & Solutions:**

#### **Backend Issues:**
```bash
# If FastAPI won't start:
pkill -f "python main.py"  # Kill existing processes
source venv/bin/activate   # Reactivate virtual environment
python main.py             # Restart

# If Redis connection fails:
brew services start redis  # Start Redis service (macOS)

# If Celery worker fails:
celery -A celery_app purge  # Clear task queue
celery -A celery_app worker --loglevel=info  # Restart worker
```

#### **Mobile App Issues:**
```bash
# If Metro bundler fails:
npx expo start --clear     # Clear cache and restart

# If dependencies have conflicts:
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# If iOS simulator doesn't work:
npx expo install --ios
```

#### **Database Issues:**
```bash
# If Supabase connection fails, check .env file:
cat .env | grep SUPABASE

# Test Supabase connection:
curl -H "apikey: YOUR_SUPABASE_KEY" "YOUR_SUPABASE_URL/rest/v1/"
```

---

## 🎯 **TESTING WORKFLOWS**

### **1. Complete User Journey Test:**
```bash
# 1. Register user
# 2. Login and get JWT
# 3. Check subscription status
# 4. Clone voice from video
# 5. Create multilingual content
# 6. Generate AR avatar
# 7. Create viral content
# 8. Check analytics
```

### **2. Mobile App Feature Test:**
1. **Authentication Flow** - Register → Login → Profile
2. **Camera Features** - Record → AR filters → Voice cloning
3. **Content Creation** - Script generation → Video processing
4. **Collaboration** - Real-time editing → Comments
5. **Analytics** - View metrics → Viral predictions

### **3. Integration Test:**
- **ElevenLabs** ↔ **Cloudflare R2** ↔ **Supabase**
- **OpenAI** ↔ **Video Processing** ↔ **CDN Delivery**
- **LemonSqueeze** ↔ **Credits System** ↔ **Feature Access**

---

## 📱 **MOBILE TESTING CHECKLIST**

### **Core Features:**
- [ ] App launches successfully
- [ ] Authentication works (login/register)
- [ ] Camera opens and records video
- [ ] AR features activate (face detection)
- [ ] Voice cloning interface loads
- [ ] Subscription plans display
- [ ] Analytics dashboard shows data

### **Advanced Features:**
- [ ] Real-time collaboration connects
- [ ] Push notifications work
- [ ] Voice cloning from video
- [ ] Multilingual content generation
- [ ] AR challenges load
- [ ] Viral score prediction works

---

## 🚀 **PERFORMANCE TESTING**

### **Load Testing Backend:**
```bash
# Install Apache Bench
brew install httpie

# Test API performance
ab -n 100 -c 10 http://localhost:8000/health
ab -n 50 -c 5 http://localhost:8000/api/subscription/plans
```

### **Mobile Performance:**
- Check FPS in AR mode (should be 30+ fps)
- Monitor memory usage during video processing
- Test app performance on older devices

---

## 🎉 **SUCCESS INDICATORS**

### **Backend Ready:**
✅ All endpoints return 200 OK  
✅ Database connections work  
✅ Background tasks process  
✅ File uploads to R2 succeed  
✅ ElevenLabs voice generation works  

### **Mobile Ready:**
✅ App launches on iOS/Android  
✅ Authentication flow complete  
✅ Camera and AR features work  
✅ Real-time features connect  
✅ All screens render properly  

### **Integration Ready:**
✅ All services communicate  
✅ Billing system processes payments  
✅ CDN delivers content globally  
✅ Analytics track user behavior  
✅ Error handling works properly  

---

## 🎯 **NEXT STEPS AFTER TESTING**

1. **Fix Any Issues** - Address bugs found during testing
2. **Performance Optimization** - Improve slow endpoints
3. **Security Review** - Validate authentication & permissions
4. **Production Deploy** - Deploy to Railway/Render
5. **App Store Submission** - Submit iOS/Android apps

**Your complete ecosystem is ready for local testing!** 🚀

*Run the test script and let me know what issues you encounter!* 🧪✨