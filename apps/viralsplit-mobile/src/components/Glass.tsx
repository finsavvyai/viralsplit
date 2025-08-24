import React from 'react';
import { View, ViewStyle, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { glassmorphism, borderRadius } from '@/styles/design-system';

interface GlassProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
  variant?: 'default' | 'accent' | 'subtle';
  borderRadius?: keyof typeof borderRadius;
  noBorder?: boolean;
}

const Glass: React.FC<GlassProps> = ({
  children,
  style,
  intensity = 20,
  variant = 'default',
  borderRadius: radius = 'lg',
  noBorder = false,
  ...props
}) => {
  const { theme } = useTheme();
  
  const getGlassStyle = (): ViewStyle => {
    const baseStyle = theme === 'dark' ? glassmorphism.dark : glassmorphism.light;
    
    switch (variant) {
      case 'accent':
        return glassmorphism.accent;
      case 'subtle':
        return {
          ...baseStyle,
          backgroundColor: theme === 'dark' 
            ? 'rgba(28, 28, 30, 0.4)' 
            : 'rgba(255, 255, 255, 0.4)',
          borderColor: theme === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.1)',
        };
      default:
        return baseStyle;
    }
  };

  const glassStyle = getGlassStyle();

  return (
    <BlurView
      intensity={intensity}
      style={[
        styles.container,
        {
          borderRadius: borderRadius[radius],
          ...glassStyle,
          borderWidth: noBorder ? 0 : glassStyle.borderWidth,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default Glass;