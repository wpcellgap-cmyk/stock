// src/screens/SettingsScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import GradientHeader from '../components/GradientHeader';
import ActivityTile from '../components/ActivityTile';
import { getActivities } from '../database';
import { importFile, exportCSV, exportExcel } from '../importExport';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing, BorderRadius, Shadow } from '../theme';

export default function SettingsScreen() {
    const { colors, isDark, toggleTheme } = useTheme();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        const acts = await getActivities(15);
        setActivities(acts);
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const handleImport = async () => {
        setLoading(true);
        const result = await importFile();
        setLoading(false);
        Alert.alert(result.success ? 'Berhasil' : 'Gagal', result.message);
        loadData();
    };

    const handleExportCSV = async () => {
        setLoading(true);
        const result = await exportCSV();
        setLoading(false);
        if (!result.success) Alert.alert('Gagal', result.message);
        loadData();
    };

    const handleExportExcel = async () => {
        setLoading(true);
        const result = await exportExcel();
        setLoading(false);
        if (!result.success) Alert.alert('Gagal', result.message);
        loadData();
    };

    const styles = getStyles(colors);

    const ActionCard = ({ icon, title, subtitle, gradientColors, onPress }) => (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={loading} style={{ marginBottom: Spacing.md }}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCard}
            >
                <View style={styles.actionIconBox}>
                    <Ionicons name={icon} size={28} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>{title}</Text>
                    <Text style={styles.actionSub}>{subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.screen}>
            <GradientHeader title="Pengaturan" subtitle="Data & konfigurasi" />

            {/* Theme Toggle */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tampilan</Text>
                <View style={[styles.themeCard, Shadow.light]}>
                    <View style={styles.themeRow}>
                        <View style={[styles.themeIconBox, { backgroundColor: colors.accent + '22' }]}>
                            <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.themeTitle}>Mode Gelap</Text>
                            <Text style={styles.themeSub}>{isDark ? 'Tema gelap aktif' : 'Tema terang aktif'}</Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#d1d5db', true: colors.accent + '66' }}
                            thumbColor={isDark ? colors.accent : '#f4f3f4'}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kelola Data</Text>

                <ActionCard
                    icon="cloud-download"
                    title="Import Data"
                    subtitle="CSV atau Excel file"
                    gradientColors={['#42a5f5', '#1976d2']}
                    onPress={handleImport}
                />
                <ActionCard
                    icon="document-text"
                    title="Export CSV"
                    subtitle="Format tabel sederhana"
                    gradientColors={['#66bb6a', '#388e3c']}
                    onPress={handleExportCSV}
                />
                <ActionCard
                    icon="grid"
                    title="Export Excel"
                    subtitle="Format spreadsheet lengkap"
                    gradientColors={['#ab47bc', '#7b1fa2']}
                    onPress={handleExportExcel}
                />
            </View>

            {/* Activity log */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Riwayat Aktivitas</Text>
                <View style={[styles.logCard, Shadow.light]}>
                    {activities.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                            <Ionicons name="time-outline" size={36} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Belum ada aktivitas</Text>
                        </View>
                    ) : (
                        activities.map((act, i) => <ActivityTile key={i} activity={act} />)
                    )}
                </View>
            </View>

            {/* About */}
            <View style={styles.section}>
                <View style={[styles.aboutCard, Shadow.light]}>
                    <Ionicons name="cube" size={32} color={colors.accent} />
                    <Text style={styles.aboutTitle}>Stock Manager</Text>
                    <Text style={styles.aboutVersion}>v1.0.0 • Expo + SQLite</Text>
                    <Text style={styles.aboutDesc}>Aplikasi manajemen stok offline untuk toko servis HP</Text>
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xxl },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: Spacing.md },
    // Theme toggle card
    themeCard: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
    },
    themeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    themeTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.textPrimary },
    themeSub: { fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 },
    // Action cards
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
    },
    actionIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    actionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.white },
    actionSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    logCard: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
    },
    emptyText: { color: colors.textMuted, marginTop: 8, fontSize: FontSize.sm },
    aboutCard: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xxl,
        alignItems: 'center',
        marginBottom: 20,
    },
    aboutTitle: { fontSize: FontSize.xl, fontWeight: '800', color: colors.textPrimary, marginTop: Spacing.sm },
    aboutVersion: { fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 4 },
    aboutDesc: { fontSize: FontSize.sm, color: colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' },
});
