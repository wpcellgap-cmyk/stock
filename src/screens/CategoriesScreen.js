// src/screens/CategoriesScreen.js
import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import GradientHeader from '../components/GradientHeader';
import { getCategories, getCategoryItemCounts, addCategory, deleteCategory, reorderCategory } from '../database';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing, BorderRadius, Shadow } from '../theme';

const ICON_OPTIONS = [
    'phone-portrait-outline', 'git-merge-outline', 'flash-outline', 'tablet-landscape-outline',
    'battery-half-outline', 'shield-outline', 'hardware-chip-outline', 'cog-outline',
    'camera-outline', 'pricetag-outline', 'cube-outline', 'construct-outline',
    'disc-outline', 'wifi-outline', 'bluetooth-outline', 'mic-outline',
];

export default function CategoriesScreen({ navigation }) {
    const toTitleCase = (str) => str.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
    const { colors } = useTheme();

    const [categories, setCategories] = useState([]);
    const [counts, setCounts] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('cube-outline');

    const loadData = useCallback(async () => {
        try {
            const cats = await getCategories();
            const c = await getCategoryItemCounts();
            setCategories(cats);
            setCounts(c);
        } catch (e) {
            console.log('Category load error:', e);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const handleAdd = async () => {
        if (!newName.trim()) {
            Alert.alert('Error', 'Nama kategori wajib diisi');
            return;
        }
        await addCategory(toTitleCase(newName.trim()), selectedIcon);
        setNewName('');
        setSelectedIcon('cube-outline');
        setShowModal(false);
        loadData();
    };

    const handleDelete = (cat) => {
        const count = counts[cat.id] || 0;
        Alert.alert(
            'Hapus Kategori',
            `Hapus "${cat.name}"?${count > 0 ? ` (${count} item akan kehilangan kategori)` : ''}`,
            [
                { text: 'Batal', style: 'cancel' },
                { text: 'Hapus', style: 'destructive', onPress: async () => { await deleteCategory(cat.id); loadData(); } },
            ]
        );
    };

    const handleMoveUp = async (index) => {
        if (index <= 0) return;
        await reorderCategory(categories, index, index - 1);
        loadData();
    };

    const handleMoveDown = async (index) => {
        if (index >= categories.length - 1) return;
        await reorderCategory(categories, index, index + 1);
        loadData();
    };

    const styles = getStyles(colors);

    const renderCategory = ({ item: cat, index }) => (
        <View style={[styles.catCard, Shadow.light]}>
            <View style={[styles.catIcon, { backgroundColor: colors.accent + '22' }]}>
                <Ionicons name={cat.icon || 'cube-outline'} size={22} color={colors.accent} />
            </View>
            <View style={styles.catInfo}>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catCount}>{counts[cat.id] || 0} item</Text>
            </View>
            <View style={styles.reorderBtns}>
                <TouchableOpacity
                    onPress={() => handleMoveUp(index)}
                    style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                    disabled={index === 0}
                >
                    <Ionicons name="chevron-up" size={20} color={index === 0 ? colors.textMuted : colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleMoveDown(index)}
                    style={[styles.reorderBtn, index === categories.length - 1 && styles.reorderBtnDisabled]}
                    disabled={index === categories.length - 1}
                >
                    <Ionicons name="chevron-down" size={20} color={index === categories.length - 1 ? colors.textMuted : colors.accent} />
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handleDelete(cat)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.screen}>
            <GradientHeader title="Kategori" subtitle={`${categories.length} kategori`} />

            <FlatList
                data={categories}
                keyExtractor={(c) => String(c.id)}
                contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>Belum ada kategori</Text>
                    </View>
                }
                renderItem={renderCategory}
            />

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.8}>
                <Ionicons name="add" size={28} color={colors.white} />
            </TouchableOpacity>

            {/* Add Category Modal */}
            <Modal visible={showModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Tambah Kategori</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>Nama Kategori</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Contoh: Sparepart LCD"
                            placeholderTextColor={colors.textMuted}
                            value={newName}
                            onChangeText={setNewName}
                        />

                        <Text style={styles.modalLabel}>Pilih Ikon</Text>
                        <View style={styles.iconGrid}>
                            {ICON_OPTIONS.map((icon) => (
                                <TouchableOpacity
                                    key={icon}
                                    style={[styles.iconBtn, selectedIcon === icon && styles.iconBtnActive]}
                                    onPress={() => setSelectedIcon(icon)}
                                >
                                    <Ionicons name={icon} size={22} color={selectedIcon === icon ? colors.white : colors.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity onPress={handleAdd} activeOpacity={0.8}>
                            <LinearGradient
                                colors={[colors.gradientStart, colors.gradientEnd]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.modalSaveBtn}
                            >
                                <Text style={styles.modalSaveBtnText}>Simpan</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    catCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    catIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    catInfo: { flex: 1 },
    catName: { fontSize: FontSize.lg, fontWeight: '700', color: colors.textPrimary },
    catCount: { fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 },
    deleteBtn: { padding: 8, marginLeft: 4 },
    reorderBtns: {
        flexDirection: 'column',
        alignItems: 'center',
        marginRight: 4,
    },
    reorderBtn: {
        padding: 2,
    },
    reorderBtnDisabled: {
        opacity: 0.3,
    },
    emptyBox: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: colors.textMuted, marginTop: Spacing.md, fontSize: FontSize.md },
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.purple,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.xl,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: colors.textPrimary },
    modalLabel: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: Spacing.md },
    modalInput: {
        backgroundColor: colors.surfaceLight,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        color: colors.textPrimary,
        fontSize: FontSize.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: Spacing.sm,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBtnActive: { backgroundColor: colors.accent },
    modalSaveBtn: {
        paddingVertical: 14,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    modalSaveBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: colors.white },
});
