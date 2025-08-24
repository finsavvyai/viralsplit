import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Apple's Human Interface Guidelines spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Dynamic Type sizes following Apple's guidelines
export const typography = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: 'bold' as const,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 'bold' as const,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 'bold' as const,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600' as const,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
  },
} as const;

// Glassmorphism effects
export const glassmorphism = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  dark: {
    backgroundColor: 'rgba(28, 28, 30, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  accent: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.2)',
    backdropFilter: 'blur(20px)',
    shadowColor: '#9333EA',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

// Border radius following Apple's design
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  round: 50,
} as const;

// Apple's animation curves
export const animationConfig = {
  quick: {
    duration: 200,
    useNativeDriver: true,
  },
  smooth: {
    duration: 300,
    useNativeDriver: true,
  },
  gentle: {
    duration: 500,
    useNativeDriver: true,
  },
  spring: {
    tension: 180,
    friction: 12,
    useNativeDriver: true,
  },
} as const;

// Responsive breakpoints
export const breakpoints = {
  small: width < 380,
  medium: width >= 380 && width < 768,
  large: width >= 768,
  isTablet: width >= 768,
  isPhone: width < 768,
} as const;

// Safe area helpers
export const safeArea = {
  top: Platform.OS === 'ios' ? 44 : 0,
  bottom: Platform.OS === 'ios' ? 34 : 0,
} as const;

// Haptic feedback patterns
export const hapticFeedback = {
  selection: 'selection',
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const;

export default {
  spacing,
  typography,
  glassmorphism,
  borderRadius,
  animationConfig,
  breakpoints,
  safeArea,
  hapticFeedback,
};