// src/screens/DashboardScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

    // Shop Identity State
    const [shopData, setShopData] = useState({ name: 'Nama Toko', address: 'Alamat Toko', phone: '08123456789' });
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', address: '', phone: '' });

    const loadData = useCallback(async () => {
        try {
            const s = await getStats();
            const a = await getActivities(10);
            setStats(s);
            setActivities(a);

            // Load Shop Data
            const storedShop = await AsyncStorage.getItem('shop_identity');
            if (storedShop) {
                setShopData(JSON.parse(storedShop));
            }
        } catch (e) {
            console.log('Dashboard load error:', e);
        }
    }, []);

    const saveShopData = async () => {
        try {
            await AsyncStorage.setItem('shop_identity', JSON.stringify(editForm));
            setShopData(editForm);
            setShowEditModal(false);
            Alert.alert('Sukses', 'Identitas toko berhasil diperbarui');
        } catch (e) {
            Alert.alert('Error', 'Gagal menyimpan data');
        }
    };

    const openEditModal = () => {
        setEditForm(shopData);
        setShowEditModal(true);
    };

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
        <View style={{ flex: 1 }}>
            <ScrollView
                style={styles.screen}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
            >
                <GradientHeader
                    title="Dashboard"
                    subtitle="Ringkasan stok Anda"
                    rightContent={
                        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginTop: 4 }}>
                            <Ionicons name="settings-outline" size={24} color="white" />
                        </TouchableOpacity>
                    }
                />

                {/* Shop Identity Card */}
                <View style={styles.shopCard}>
                    <View style={styles.shopInfo}>
                        <Text style={styles.shopName}>{shopData.name}</Text>
                        <Text style={styles.shopDetail}>{shopData.address}</Text>
                        <Text style={styles.shopDetail}>{shopData.phone}</Text>
                    </View>
                    <TouchableOpacity onPress={openEditModal} style={styles.editBtn}>
                        <Ionicons name="pencil" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Summary Cards */}
                <View style={styles.cardsRow}>
                    <TouchableOpacity onPress={() => navigation.navigate('Items')} activeOpacity={0.8} style={{ width: '47%' }}>
                        <SummaryCard icon="cube" label="Total Item" value={stats.totalItems} color={colors.accent} fullWidth />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Reports')} activeOpacity={0.8} style={{ width: '47%' }}>
                        <SummaryCard icon="cash" label="Nilai Stok" value={formatCurrency(stats.totalValue)} color={colors.success} fullWidth />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Items', { filter: 'low' })} activeOpacity={0.8} style={{ width: '47%' }}>
                        <SummaryCard icon="warning" label="Stok Rendah" value={stats.lowStock} color={colors.warning} fullWidth />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Items', { filter: 'out' })} activeOpacity={0.8} style={{ width: '47%' }}>
                        <SummaryCard icon="close-circle" label="Habis" value={stats.outOfStock} color={colors.danger} fullWidth />
                    </TouchableOpacity>
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

            {/* Edit Modal */}
            <Modal
                visible={showEditModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Identitas Toko</Text>

                        <Text style={styles.label}>Nama Toko</Text>
                        <TextInput
                            style={styles.input}
                            value={editForm.name}
                            onChangeText={(t) => setEditForm({ ...editForm, name: t })}
                            placeholder="Nama Toko"
                        />

                        <Text style={styles.label}>Alamat</Text>
                        <TextInput
                            style={styles.input}
                            value={editForm.address}
                            onChangeText={(t) => setEditForm({ ...editForm, address: t })}
                            placeholder="Alamat Lengkap"
                        />

                        <Text style={styles.label}>No. Telepon</Text>
                        <TextInput
                            style={styles.input}
                            value={editForm.phone}
                            onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
                            placeholder="08xxx"
                            keyboardType="phone-pad"
                        />

                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setShowEditModal(false)}>
                                <Text style={styles.btnTextCancel}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={saveShopData}>
                                <Text style={styles.btnTextSave}>Simpan</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
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
        marginTop: Spacing.xl, // Increased margin
    },
    section: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.xxl,
    },
    sectionTitle: {
        fontSize: FontSize.xl,
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
        fontSize: FontSize.sm,
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
    shopCard: {
        backgroundColor: colors.surface,
        marginHorizontal: Spacing.lg,
        marginTop: -20, // Overlap gradient
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        ...Shadow.card,
        elevation: 4,
    },
    shopInfo: {
        flex: 1,
        paddingRight: Spacing.md,
    },
    shopName: {
        fontSize: 20, // Requested
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    shopDetail: {
        fontSize: 14, // Requested
        color: colors.textSecondary, // Dark gray equivalent in theme
        marginTop: 2,
    },
    editBtn: {
        padding: 4,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.surface,
        width: '100%',
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        ...Shadow.card,
    },
    modalTitle: {
        fontSize: FontSize.xl,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        color: colors.textPrimary,
        fontSize: FontSize.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalBtns: {
        flexDirection: 'row',
        marginTop: Spacing.xl,
        gap: Spacing.md,
    },
    btn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    btnCancel: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    btnSave: {
        backgroundColor: colors.accent,
    },
    btnTextCancel: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    btnTextSave: {
        color: colors.white,
        fontWeight: 'bold',
    },
});
