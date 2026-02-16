// src/screens/ReportsScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import GradientHeader from '../components/GradientHeader';
import { getStats, getLowStockItems } from '../database';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing, BorderRadius, Shadow } from '../theme';

export default function ReportsScreen() {
    const { colors } = useTheme();
    const [stats, setStats] = useState({ totalItems: 0, totalValue: 0, lowStock: 0, outOfStock: 0, inStock: 0 });
    const [lowItems, setLowItems] = useState([]);

    useFocusEffect(
        useCallback(() => {
            (async () => {
                const s = await getStats();
                const li = await getLowStockItems();
                setStats(s);
                setLowItems(li);
            })();
        }, [])
    );

    const healthPercent = stats.totalItems > 0
        ? Math.round((stats.inStock / stats.totalItems) * 100)
        : 0;

    const formatCurrency = (v) => 'Rp ' + (v || 0).toLocaleString('id-ID');

    const statCards = [
        { icon: 'cube', label: 'Total Item', value: stats.totalItems, color: colors.accent },
        { icon: 'cash', label: 'Nilai Stok', value: formatCurrency(stats.totalValue), color: colors.success },
        { icon: 'warning', label: 'Stok Rendah', value: stats.lowStock, color: colors.warning },
        { icon: 'close-circle', label: 'Habis', value: stats.outOfStock, color: colors.danger },
    ];

    const styles = getStyles(colors);

    return (
        <ScrollView style={styles.screen}>
            <GradientHeader title="Laporan" subtitle="Analisis & insight stok" />

            {/* Stats grid */}
            <View style={styles.statsGrid}>
                {statCards.map((s, i) => (
                    <View key={i} style={[styles.statCard, Shadow.light]}>
                        <Ionicons name={s.icon} size={20} color={s.color} />
                        <Text style={styles.statValue}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* Stock Health */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kesehatan Stok</Text>
                <View style={[styles.healthCard, Shadow.light]}>
                    <View style={styles.healthRow}>
                        <Text style={styles.healthPercent}>{healthPercent}%</Text>
                        <Text style={styles.healthLabel}>Stok sehat</Text>
                    </View>
                    <View style={styles.healthBarBg}>
                        <View style={[styles.healthBarFill, { width: `${healthPercent}%`, backgroundColor: healthPercent > 60 ? colors.success : healthPercent > 30 ? colors.warning : colors.danger }]} />
                    </View>
                    <View style={styles.healthLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                            <Text style={styles.legendText}>Tersedia: {stats.inStock}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                            <Text style={styles.legendText}>Rendah: {stats.lowStock}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                            <Text style={styles.legendText}>Habis: {stats.outOfStock}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Low Stock Alerts */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚠️ Peringatan Stok Rendah</Text>
                {lowItems.length === 0 ? (
                    <View style={[styles.healthCard, Shadow.light, { alignItems: 'center' }]}>
                        <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                        <Text style={[styles.healthLabel, { marginTop: 8 }]}>Semua stok aman!</Text>
                    </View>
                ) : (
                    lowItems.map((item, i) => (
                        <View key={i} style={[styles.alertCard, Shadow.light]}>
                            <View style={[styles.alertDot, { backgroundColor: item.quantity === 0 ? colors.danger : colors.warning }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.alertName}>{item.name}</Text>
                                <Text style={styles.alertSub}>{item.category_name || 'Tanpa kategori'}</Text>
                            </View>
                            <View style={styles.alertQty}>
                                <Text style={[styles.alertQtyText, { color: item.quantity === 0 ? colors.danger : colors.warning }]}>
                                    {item.quantity}
                                </Text>
                                <Text style={styles.alertMin}>min: {item.min_stock}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
    },
    statCard: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        width: '48%',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    statValue: { fontSize: FontSize.xxl, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
    statLabel: { fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 },
    section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xxl },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: Spacing.md },
    healthCard: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
    },
    healthRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.md },
    healthPercent: { fontSize: FontSize.title, fontWeight: '900', color: colors.textPrimary, marginRight: 8 },
    healthLabel: { fontSize: FontSize.sm, color: colors.textSecondary },
    healthBarBg: {
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.surfaceLight,
        overflow: 'hidden',
        marginBottom: Spacing.md,
    },
    healthBarFill: { height: '100%', borderRadius: 5 },
    healthLegend: { flexDirection: 'row', justifyContent: 'space-around' },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
    legendText: { fontSize: FontSize.xs, color: colors.textSecondary },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    alertDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.md },
    alertName: { fontSize: FontSize.md, fontWeight: '600', color: colors.textPrimary },
    alertSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    alertQty: { alignItems: 'flex-end' },
    alertQtyText: { fontSize: FontSize.xl, fontWeight: '900' },
    alertMin: { fontSize: FontSize.xs, color: colors.textMuted },
});
