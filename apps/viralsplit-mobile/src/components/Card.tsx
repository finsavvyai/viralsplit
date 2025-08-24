import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewProps, TouchableOpacityProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, glassmorphism } from '@/styles/design-system';
import Glass from './Glass';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
  borderRadius?: keyof typeof borderRadius;
  pressable?: boolean;
  onPress?: () => void;
  shadow?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'lg',
  borderRadius: radius = 'lg',
  pressable = false,
  onPress,
  shadow = true,
  style,
  ...props
}) => {
  const { colors, theme } = useTheme();

  const getCardStyle = () => {
    const baseStyle = {
      padding: spacing[padding],
      borderRadius: borderRadius[radius],
    };

    switch (variant) {
      case 'glass':
        return baseStyle;
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          shadowColor: theme === 'dark' ? '#000' : '#000',
          shadowOffset: {
            width: 0,
            height: shadow ? 8 : 0,
          },
          shadowOpacity: shadow ? (theme === 'dark' ? 0.3 : 0.1) : 0,
          shadowRadius: shadow ? 12 : 0,
          elevation: shadow ? 8 : 0,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          shadowColor: theme === 'dark' ? '#000' : '#000',
          shadowOffset: {
            width: 0,
            height: shadow ? 4 : 0,
          },
          shadowOpacity: shadow ? (theme === 'dark' ? 0.2 : 0.05) : 0,
          shadowRadius: shadow ? 8 : 0,
          elevation: shadow ? 4 : 0,
        };
    }
  };

  if (variant === 'glass') {
    return (
      <Glass
        style={[getCardStyle(), style]}
        borderRadius={radius}
        {...props}
      >
        {children}
      </Glass>
    );
  }

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[getCardStyle(), style]}
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

export default Card;