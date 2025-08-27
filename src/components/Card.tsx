import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getColors, getShadows, spacing, borderRadius } from '../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  shadow?: 'small' | 'medium' | 'large' | 'none';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  padding = 'md',
  shadow = 'small'
}) => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const shadows = getShadows(isDarkMode);
  
  const cardStyle: ViewStyle = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing[padding],
    ...(shadow !== 'none' && shadows[shadow]),
  };

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

export default Card; 