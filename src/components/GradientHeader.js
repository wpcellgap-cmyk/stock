// src/components/GradientHeader.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing } from '../theme';

export default function GradientHeader({ title, subtitle, rightContent }) {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    return (
        <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, { paddingTop: insets.top + 12 }]}
        >
            <View style={styles.content}>
                <View style={styles.textArea}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                {rightContent ? <View>{rightContent}</View> : null}
            </View>
            <View style={styles.badge}>
                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                <Text style={styles.badgeText}>Offline • SQLite</Text>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 20,
        paddingHorizontal: Spacing.xl,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    textArea: { flex: 1 },
    title: {
        fontSize: FontSize.xxxl,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: Spacing.md,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: FontSize.xs,
        fontWeight: '600',
    },
});
