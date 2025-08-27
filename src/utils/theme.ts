// Design System - Uber-inspired theme
export const lightColors = {
  // Primary Colors (Uber-inspired)
  primary: '#00D4AA', // Uber green
  primaryDark: '#00B894',
  primaryLight: '#E8FDF9', // Light teal background
  secondary: '#2D3436',
  
  // Functional Colors
  success: '#00D4AA',
  warning: '#FDCB6E',
  error: '#E74C3C',
  info: '#74B9FF',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#2D3436',
  background: '#F8F9FA',
  
  // Gray Scale
  gray50: '#F8F9FA',
  gray100: '#E9ECEF',
  gray200: '#DEE2E6',
  gray300: '#CED4DA',
  gray400: '#ADB5BD',
  gray500: '#6C757D',
  gray600: '#495057',
  gray700: '#343A40',
  gray800: '#212529',
  gray900: '#000000',
  
  // Text Colors
  textPrimary: '#2D3436',
  textSecondary: '#6C757D',
  textTertiary: '#ADB5BD',
  textInverse: '#FFFFFF',
};

export const darkColors = {
  // Primary Colors (same as light)
  primary: '#00D4AA', // Uber green
  primaryDark: '#00B894',
  primaryLight: '#1A2F2A', // Dark teal background
  secondary: '#E9ECEF',
  
  // Functional Colors
  success: '#00D4AA',
  warning: '#FDCB6E',
  error: '#E74C3C',
  info: '#74B9FF',
  
  // Neutral Colors - Maximum contrast for dark mode
  white: '#404040', // Much lighter cards that really pop out
  black: '#FFFFFF',
  background: '#0D0D0D', // Even darker background for maximum contrast
  
  // Gray Scale - Maximum contrast hierarchy
  gray50: '#0D0D0D', // Darkest background
  gray100: '#1A1A1A', // Very dark
  gray200: '#404040', // Card backgrounds - much lighter
  gray300: '#606060', // Borders - more visible
  gray400: '#808080', // Inactive elements
  gray500: '#A0A0A0', // Secondary text
  gray600: '#C0C0C0', // Light secondary
  gray700: '#D0D0D0', // Lighter
  gray800: '#E0E0E0', // Very light
  gray900: '#FFFFFF', // Pure white text
  
  // Text Colors - High contrast
  textPrimary: '#FFFFFF', // Pure white for main text
  textSecondary: '#B3B3B3', // Light gray for secondary text
  textTertiary: '#808080', // Medium gray for tertiary text
  textInverse: '#121212', // Dark text for light backgrounds
};

// Function to get colors based on theme
export const getColors = (isDarkMode: boolean) => {
  return isDarkMode ? darkColors : lightColors;
};

// Export default light colors for backward compatibility
export const colors = lightColors;

export const typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  
  // Font weights
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Static shadows for light theme
export const lightShadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Enhanced shadows for dark theme with borders
export const darkShadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#606060',
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#606060',
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#606060',
  },
};

// Function to get shadows based on theme
export const getShadows = (isDarkMode: boolean) => {
  return isDarkMode ? darkShadows : lightShadows;
};

// Export default light shadows for backward compatibility
export const shadows = lightShadows;

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
}; 