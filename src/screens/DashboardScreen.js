// src/screens/DashboardScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import GradientHeader from '../components/GradientHeader';
import SummaryCard from '../components/SummaryCard';
import ActivityTile from '../components/ActivityTile';
import { getStats, getActivities } from '../database';
import { importFile, exportCSV } from '../importExport';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing, BorderRadius, Shadow } from '../theme';

export default function DashboardScreen({ navigation }) {
    const { colors } = useTheme();
    const [stats, setStats] = useState({ totalItems: 0, totalValue: 0, lowStock: 0, outOfStock: 0 });
    const [activities, setActivities] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const s = await getStats();
            const a = await getActivities(10);
            setStats(s);
            setActivities(a);
        } catch (e) {
            console.log('Dashboard load error:', e);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const quickActions = [
        { icon: 'add-circle', label: 'Tambah', color: colors.accent, onPress: () => navigation.navigate('ItemForm') },
        { icon: 'cloud-download', label: 'Import', color: colors.info, onPress: async () => { await importFile(); loadData(); } },
        { icon: 'cloud-upload', label: 'Export', color: colors.purple, onPress: async () => { await exportCSV(); loadData(); } },
        { icon: 'list', label: 'Semua', color: colors.success, onPress: () => navigation.navigate('Items') },
    ];

    const formatCurrency = (val) => 'Rp ' + (val || 0).toLocaleString('id-ID');

    const styles = getStyles(colors);

    return (
        <ScrollView
            style={styles.screen}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
            <GradientHeader title="Dashboard" subtitle="Ringkasan stok Anda" />

            {/* Summary Cards */}
            <View style={styles.cardsRow}>
                <SummaryCard icon="cube" label="Total Item" value={stats.totalItems} color={colors.accent} />
                <SummaryCard icon="cash" label="Nilai Stok" value={formatCurrency(stats.totalValue)} color={colors.success} />
                <SummaryCard icon="warning" label="Stok Rendah" value={stats.lowStock} color={colors.warning} />
                <SummaryCard icon="close-circle" label="Habis" value={stats.outOfStock} color={colors.danger} />
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Aksi Cepat</Text>
                <View style={styles.actionsRow}>
                    {quickActions.map((a, i) => (
                        <TouchableOpacity key={i} style={styles.actionBtn} onPress={a.onPress} activeOpacity={0.7}>
                            <View style={[styles.actionIcon, { backgroundColor: a.color + '22' }]}>
                                <Ionicons name={a.icon} size={24} color={a.color} />
                            </View>
                            <Text style={styles.actionLabel}>{a.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Aktivitas Terakhir</Text>
                {activities.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="time-outline" size={40} color={colors.textMuted} />
                        <Text style={styles.emptyText}>Belum ada aktivitas</Text>
                    </View>
                ) : (
                    activities.map((act, i) => <ActivityTile key={i} activity={act} />)
                )}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    cardsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.xxl,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: Spacing.md,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionBtn: {
        alignItems: 'center',
        flex: 1,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    actionLabel: {
        fontSize: FontSize.xs,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    emptyBox: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xxxl,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textMuted,
        marginTop: Spacing.sm,
        fontSize: FontSize.sm,
    },
});
