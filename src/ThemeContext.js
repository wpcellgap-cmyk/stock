// src/ThemeContext.js — Dark/Light theme context with persistence
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@app_theme';

const DarkColors = {
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
    background: '#0f0f23',
    surface: '#1a1a2e',
    surfaceLight: '#25253d',
    card: '#16213e',
    textPrimary: '#e8e8f0',
    textSecondary: '#8888aa',
    textMuted: '#555577',
    accent: '#667eea',
    accentLight: '#8ba4f0',
    purple: '#764ba2',
    purpleLight: '#9b6dc6',
    success: '#00c853',
    warning: '#ffa726',
    danger: '#ef5350',
    info: '#42a5f5',
    inStock: '#00c853',
    lowStock: '#ffa726',
    outOfStock: '#ef5350',
    border: '#2a2a4a',
    white: '#ffffff',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.5)',
};

const LightColors = {
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
    background: '#f0f2f5',
    surface: '#ffffff',
    surfaceLight: '#f5f5f8',
    card: '#ffffff',
    textPrimary: '#1a1a2e',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    accent: '#667eea',
    accentLight: '#8ba4f0',
    purple: '#764ba2',
    purpleLight: '#9b6dc6',
    success: '#16a34a',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    inStock: '#16a34a',
    lowStock: '#f59e0b',
    outOfStock: '#ef4444',
    border: '#e5e7eb',
    white: '#ffffff',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.3)',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(true);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(THEME_KEY).then((val) => {
            if (val !== null) setIsDark(val === 'dark');
            setLoaded(true);
        });
    }, []);

    const toggleTheme = async () => {
        const newVal = !isDark;
        setIsDark(newVal);
        await AsyncStorage.setItem(THEME_KEY, newVal ? 'dark' : 'light');
    };

    const colors = isDark ? DarkColors : LightColors;

    return (
        <ThemeContext.Provider value={{ colors, isDark, toggleTheme, loaded }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
