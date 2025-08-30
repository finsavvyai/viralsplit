# ViralSplit Mobile App 🚀

**AI-Powered Video Creation & Social Media Optimization Platform**

Transform your videos into viral content with advanced AI, real-time AR effects, and seamless social media integration.

## 📱 Features

### 🎥 Advanced Camera System
- **Real-time Face Detection**: Professional-grade face tracking with confidence scoring
- **AI Viral Score**: Live analysis of content viral potential while recording
- **AR Filters & Effects**: 3D rendering with particle systems, environments, and animated companions
- **Professional Recording**: 4K recording, multiple frame rates, video stabilization
- **Smart Composition**: AI-powered framing and lighting suggestions

### 🔄 Real-Time Processing
- **Live Progress Updates**: WebSocket-based real-time processing status
- **Collaborative Editing**: Multi-user collaboration with live cursors and comments
- **Background Processing**: Continue using the app while videos process
- **Smart Notifications**: Intelligent push notifications for processing completion

### 📲 Social Media Integration
- **Multi-Platform Posting**: Simultaneous posting to TikTok, Instagram, YouTube, Facebook
- **Platform Optimization**: Automatic video optimization for each platform's requirements
- **Trending Analysis**: Real-time trending hashtags, sounds, and challenges
- **Analytics Dashboard**: Comprehensive performance metrics across all platforms
- **Scheduled Posting**: Plan and schedule content for optimal engagement times

### 🤖 AI-Powered Features
- **Content Optimization**: AI suggestions for maximum viral potential
- **Hashtag Generation**: Smart hashtag suggestions based on content analysis
- **Viral Score Prediction**: Real-time scoring of content viral potential
- **Trend Matching**: Automatic alignment with current trending topics

### 🛡️ Security & Privacy
- **Secure Authentication**: OAuth 2.0 with social media platforms
- **Biometric Security**: Touch ID / Face ID support
- **Data Encryption**: End-to-end encryption for user content
- **Privacy Controls**: Granular privacy settings and data management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Expo CLI
- iOS Simulator or Physical Device
- Android Studio (for Android development)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/viralsplit/mobile.git
   cd viralsplit-mobile
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```

5. **Run on Device**
   ```bash
   # iOS
   npm run ios
   
   # Android  
   npm run android
   ```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# API Configuration
API_BASE_URL=https://api.viralsplit.io
WEBSOCKET_URL=wss://ws.viralsplit.io

# Social Media OAuth Keys
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
EXPO_PUBLIC_TIKTOK_CLIENT_KEY=your_tiktok_client_key
EXPO_PUBLIC_INSTAGRAM_CLIENT_ID=your_instagram_client_id

# Push Notifications
EXPO_PROJECT_ID=your_expo_project_id

# Optional: Analytics
EXPO_PUBLIC_ANALYTICS_KEY=your_analytics_key
```

## 🏗️ Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── navigation/         # Navigation configuration
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── camera/        # Camera and recording screens
│   ├── features/      # Feature screens (AI tools)
│   ├── main/          # Main app screens
│   └── processing/    # Video processing screens
├── services/          # Business logic and API services
│   ├── api.ts         # Main API service
│   ├── arService.ts   # AR and 3D rendering
│   ├── realTimeService.ts  # WebSocket connections
│   ├── socialAuthService.ts  # Social media OAuth
│   ├── socialIntegrationService.ts  # Platform posting
│   └── videoService.ts  # Video processing
├── store/             # Redux store and slices
├── styles/            # Design system and themes
└── types/             # TypeScript type definitions
```

### Key Services

#### **Real-Time Service**
- WebSocket connection management
- Auto-reconnection with exponential backoff
- Real-time processing updates
- Collaboration features

#### **AR Service** 
- 3D rendering with Three.js
- Face tracking integration
- Filter system with 5 categories
- Performance optimization

#### **Social Integration Service**
- OAuth authentication for all platforms
- Platform-specific video optimization
- Cross-platform posting
- Analytics and trending data

#### **Video Service**
- Chunked upload with progress tracking
- Real-time processing status
- Multiple quality options
- Error recovery and retry

## 📱 Supported Platforms

### Social Media Platforms
- **TikTok**: Full API integration with video upload
- **Instagram**: Reels and standard posts
- **YouTube**: Shorts and regular videos  
- **Facebook**: Video posts with analytics
- **Twitter**: Video tweets

### Mobile Platforms
- **iOS**: 13.0+
- **Android**: API level 21+ (Android 5.0)

## 🎯 Key Features by Screen

### Camera Screen (`RealCameraScreen.tsx`)
- Real-time face detection with overlay indicators
- Live viral score calculation and display
- AR filter selection and intensity control
- Professional recording controls
- Haptic feedback and smooth animations

### Processing Status (`ProcessingStatusScreen.tsx`)
- Real-time progress tracking with WebSocket updates
- Detailed stage breakdown for each processing step
- Visual progress bars and status indicators
- Connection status monitoring
- Error handling with retry options

### Platform Integration
- OAuth authentication flows
- Platform-specific content optimization
- Trending content analysis
- Scheduled posting capabilities
- Comprehensive analytics dashboard

## 🛠️ Development

### Running in Development
```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator  
npm run android

# Run on web (limited functionality)
npm run web
```

### Building for Production
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure build profiles
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both platforms
eas build --platform all
```

### Testing
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests (if configured)
npm test
```

## 📊 Performance

### Optimizations Implemented
- **Memory Management**: Proper cleanup of AR resources and WebSocket connections
- **Network Efficiency**: Request deduplication and connection pooling
- **UI Performance**: 60fps animations with native driver
- **Background Processing**: Handles app backgrounding gracefully
- **Caching Strategy**: Intelligent caching for AR filters and user data

### Performance Metrics
- **Startup Time**: < 3 seconds on average devices
- **Camera Latency**: < 100ms for face detection
- **AR Rendering**: 60fps with multiple active filters
- **Memory Usage**: < 200MB during normal operation
- **Battery Impact**: Optimized for extended recording sessions

## 🔒 Security

### Data Protection
- **Secure Storage**: Sensitive data encrypted using expo-secure-store
- **Authentication**: OAuth 2.0 with PKCE for social media platforms
- **Network Security**: HTTPS-only communications
- **Biometric Auth**: Touch ID / Face ID integration
- **Token Management**: Automatic token refresh and secure storage

### Privacy Controls
- **Granular Permissions**: Fine-grained control over app permissions
- **Data Retention**: User-controlled data retention policies
- **Content Privacy**: Local processing options for sensitive content
- **GDPR Compliance**: Built-in privacy controls and data export

## 🚀 Deployment

### App Store Deployment

1. **Prepare Build**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to App Store**
   ```bash
   eas submit --platform ios
   ```

3. **Configure App Store Connect**
   - Upload app screenshots
   - Configure app metadata
   - Set up App Store Connect API key

### Google Play Deployment

1. **Prepare Build**
   ```bash
   eas build --platform android --profile production
   ```

2. **Submit to Google Play**
   ```bash
   eas submit --platform android
   ```

3. **Configure Play Console**
   - Upload feature graphics
   - Configure store listing
   - Set up Google Play Console API

## 📈 Analytics & Monitoring

### Integrated Analytics
- **User Engagement**: Screen time, feature usage, retention
- **Performance Metrics**: App crashes, load times, error rates
- **Content Analytics**: Video performance, viral scores, platform reach
- **Social Media ROI**: Cross-platform engagement and growth tracking

### Monitoring Setup
- **Crash Reporting**: Automatic crash detection and reporting
- **Performance Monitoring**: Real-time performance metrics
- **User Feedback**: In-app feedback and rating prompts
- **A/B Testing**: Feature flag system for gradual rollouts

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- TypeScript for all new code
- ESLint configuration provided
- Prettier for code formatting
- Component-based architecture

## 📞 Support

### Documentation
- **API Documentation**: [api.viralsplit.io/docs](https://api.viralsplit.io/docs)
- **User Guide**: [docs.viralsplit.io](https://docs.viralsplit.io)
- **Developer Portal**: [developers.viralsplit.io](https://developers.viralsplit.io)

### Community
- **Discord**: [discord.gg/viralsplit](https://discord.gg/viralsplit)  
- **GitHub Issues**: [github.com/viralsplit/mobile/issues](https://github.com/viralsplit/mobile/issues)
- **Email Support**: support@viralsplit.io

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by the ViralSplit Team**

*Transform your creativity into viral content with the power of AI and seamless social media integration.*