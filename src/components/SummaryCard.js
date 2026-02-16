// src/components/SummaryCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing, BorderRadius, Shadow } from '../theme';

export default function SummaryCard({ icon, label, value, color }) {
    const { colors } = useTheme();
    const c = color || colors.accent;

    const styles = getStyles(colors);

    return (
        <View style={[styles.card, Shadow.card]}>
            <View style={[styles.iconBox, { backgroundColor: c + '22' }]}>
                <Ionicons name={icon} size={22} color={c} />
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.md,
        paddingVertical: 4,
        paddingHorizontal: Spacing.sm,
        alignItems: 'center',
        width: '47%',
        marginBottom: Spacing.xs,
    },
    iconBox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    value: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    label: {
        fontSize: FontSize.xs,
        color: colors.textSecondary,
        marginTop: 0,
        textAlign: 'center',
    },
});
