import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getColors, typography, spacing, borderRadius, shadows } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}) => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    const sizeStyles = {
      small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
      medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
      large: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: colors.primary,
        ...shadows.small,
      },
      secondary: {
        backgroundColor: colors.secondary,
        ...shadows.small,
      },
      outline: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.gray300,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      ...(disabled && { opacity: 0.5 }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles = {
      small: { fontSize: typography.sm },
      medium: { fontSize: typography.base },
      large: { fontSize: typography.lg },
    };

    const variantStyles = {
      primary: { color: colors.white },
      secondary: { color: colors.white },
      outline: { color: colors.primary },
      ghost: { color: colors.primary },
    };

    return {
      fontWeight: typography.semibold,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'secondary' ? colors.white : colors.primary}
          style={{ marginRight: spacing.sm }}
        />
      )}
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button; 