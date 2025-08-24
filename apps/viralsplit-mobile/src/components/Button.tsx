import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { typography, borderRadius, spacing, animationConfig } from '@/styles/design-system';
import Glass from './Glass';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'glass' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  gradient?: [string, string];
  haptic?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  gradient,
  haptic = true,
  style,
  onPress,
  disabled,
  ...props
}) => {
  const { colors } = useTheme();

  const handlePress = (event: any) => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(event);
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: iconPosition === 'right' ? 'row-reverse' : 'row',
    };

    switch (size) {
      case 'small':
        return {
          ...baseStyle,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.md,
          minHeight: 32,
        };
      case 'large':
        return {
          ...baseStyle,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          borderRadius: borderRadius.xl,
          minHeight: 56,
        };
      default:
        return {
          ...baseStyle,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.lg,
          minHeight: 44,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = size === 'small' ? typography.callout : typography.headline;
    
    switch (variant) {
      case 'primary':
        return { ...baseStyle, color: '#FFFFFF', fontWeight: '600' };
      case 'secondary':
        return { ...baseStyle, color: colors.text, fontWeight: '600' };
      case 'tertiary':
      case 'glass':
        return { ...baseStyle, color: colors.primary, fontWeight: '600' };
      case 'outline':
        return { ...baseStyle, color: colors.primary, fontWeight: '600' };
      default:
        return baseStyle;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#FFFFFF' : colors.primary} 
          size="small" 
        />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={getIconSize()}
              color={getTextStyle().color}
              style={[
                iconPosition === 'left' ? { marginRight: spacing.sm } : { marginLeft: spacing.sm }
              ]}
            />
          )}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </>
  );

  const buttonStyle = [
    getButtonStyle(),
    fullWidth && { width: '100%' as const },
    disabled && { opacity: 0.6 },
    style,
  ];

  if (variant === 'glass') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        <Glass style={buttonStyle} variant="accent">
          {renderContent()}
        </Glass>
      </TouchableOpacity>
    );
  }

  if (variant === 'primary' && gradient) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        style={buttonStyle}
        activeOpacity={0.8}
        {...props}
      >
        <LinearGradient
          colors={gradient}
          style={[StyleSheet.absoluteFill, { borderRadius: getButtonStyle().borderRadius }]}
        />
        {renderContent()}
      </TouchableOpacity>
    );
  }

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.surface;
      case 'tertiary':
        return 'transparent';
      case 'outline':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getBorderStyle = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 1.5,
        borderColor: colors.primary,
      };
    }
    return {};
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        buttonStyle,
        { backgroundColor: getBackgroundColor() },
        getBorderStyle(),
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default Button;