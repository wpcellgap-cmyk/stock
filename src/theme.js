// src/theme.js — Design tokens for the Stock Manager app

export const Colors = {
    // Primary gradient
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',

    // Backgrounds
    background: '#0f0f23',
    surface: '#1a1a2e',
    surfaceLight: '#25253d',
    card: '#16213e',

    // Text
    textPrimary: '#e8e8f0',
    textSecondary: '#8888aa',
    textMuted: '#555577',

    // Accents
    accent: '#667eea',
    accentLight: '#8ba4f0',
    purple: '#764ba2',
    purpleLight: '#9b6dc6',

    // Status
    success: '#00c853',
    warning: '#ffa726',
    danger: '#ef5350',
    info: '#42a5f5',

    // Stock status
    inStock: '#00c853',
    lowStock: '#ffa726',
    outOfStock: '#ef5350',

    // Misc
    border: '#2a2a4a',
    white: '#ffffff',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.5)',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const FontSize = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    title: 32,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 50,
};

export const Shadow = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    light: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
};
