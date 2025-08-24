import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import PagerView from 'react-native-pager-view';
import { useAppDispatch } from '@/store';
import { setOnboarded } from '@/store/slices/uiSlice';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface OnboardingPage {
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
}

const onboardingPages: OnboardingPage[] = [
  {
    title: 'AI-Powered Viral Videos',
    subtitle: 'Create content that goes viral',
    description: 'Upload one video and get 20+ platform-optimized variations with AI-powered viral predictions.',
    icon: 'videocam',
    gradient: ['#9333EA', '#EC4899'],
  },
  {
    title: 'Smart Camera with Real-Time AI',
    subtitle: 'Get live feedback while recording',
    description: 'Our AI analyzes your video in real-time, suggesting improvements for maximum viral potential.',
    icon: 'camera',
    gradient: ['#EC4899', '#F59E0B'],
  },
  {
    title: 'Multi-Platform Optimization',
    subtitle: 'Perfect for every social network',
    description: 'Automatically optimize for TikTok, Instagram, YouTube, Twitter, and more with platform-specific AI.',
    icon: 'phone-portrait',
    gradient: ['#F59E0B', '#10B981'],
  },
  {
    title: 'Content Remix Engine',
    subtitle: 'Multiply your content effortlessly',
    description: 'Transform one video into dozens of variations with different styles, lengths, and viral elements.',
    icon: 'layers',
    gradient: ['#10B981', '#3B82F6'],
  },
];

const OnboardingScreen: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const dispatch = useAppDispatch();
  const { colors } = useTheme();

  const handleNext = () => {
    if (currentPage < onboardingPages.length - 1) {
      const nextPage = currentPage + 1;
      // pagerRef.current?.setPage(nextPage);
      setCurrentPage(nextPage);
    }
  };

  const handleGetStarted = () => {
    dispatch(setOnboarded(true));
  };

  const renderPage = (page: OnboardingPage, index: number) => (
    <View key={index} style={styles.pageContainer}>
      <LinearGradient colors={page.gradient} style={styles.pageGradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name={page.icon} size={80} color="#FFFFFF" />
            </View>
            
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.subtitle}>{page.subtitle}</Text>
            <Text style={styles.description}>{page.description}</Text>
          </View>
          
          <View style={styles.footer}>
            <View style={styles.pagination}>
              {onboardingPages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.paginationDot,
                    i === currentPage && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.button}
              onPress={currentPage === onboardingPages.length - 1 ? handleGetStarted : handleNext}
            >
              <Text style={styles.buttonText}>
                {currentPage === onboardingPages.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons 
                name={currentPage === onboardingPages.length - 1 ? 'rocket' : 'arrow-forward'} 
                size={20} 
                color="#FFFFFF" 
                style={styles.buttonIcon}
              />
            </TouchableOpacity>
            
            {currentPage < onboardingPages.length - 1 && (
              <TouchableOpacity style={styles.skipButton} onPress={handleGetStarted}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {renderPage(onboardingPages[currentPage], currentPage)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  pageGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
});

export default OnboardingScreen;