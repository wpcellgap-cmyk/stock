// src/screens/ItemsScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import GradientHeader from '../components/GradientHeader';
import ItemCard from '../components/ItemCard';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { getItems, deleteItem, getCategories } from '../database';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing, BorderRadius } from '../theme';

const FILTERS = [
    { key: 'all', label: 'Semua' },
    { key: 'in', label: 'Tersedia' },
    { key: 'low', label: 'Stok Rendah' },
    { key: 'out', label: 'Habis' },
];

export default function ItemsScreen({ navigation }) {
    const { colors } = useTheme();
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [categories, setCategories] = useState([]);
    const [selectedCat, setSelectedCat] = useState(null);
    const [showScanner, setShowScanner] = useState(false);

    // Handle route params for initial filter
    React.useEffect(() => {
        if (navigation.getState().routes[navigation.getState().index].params?.filter) {
            setFilter(navigation.getState().routes[navigation.getState().index].params.filter);
            // Clear params to avoid getting stuck on this filter when navigating back
            navigation.setParams({ filter: undefined });
        }
    }, [navigation.getState().routes[navigation.getState().index].params]);

    const loadData = useCallback(async () => {
        try {
            const data = await getItems(search, filter, selectedCat);
            setItems(data);
            const cats = await getCategories();
            setCategories(cats);
        } catch (e) {
            console.log('Items load error:', e);
        }
    }, [search, filter, selectedCat]);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const handleDelete = (item) => {
        Alert.alert('Hapus Item', `Hapus "${item.name}"?`, [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: async () => { await deleteItem(item.id); loadData(); } },
        ]);
    };

    const styles = getStyles(colors);

    return (
        <View style={styles.screen}>
            <GradientHeader
                title="Inventaris"
                subtitle={`${items.length} item`}
                rightContent={
                    <TouchableOpacity onPress={() => navigation.navigate('Categories')} style={{ marginTop: 4 }}>
                        <Ionicons name="folder-open-outline" size={24} color="white" />
                    </TouchableOpacity>
                }
            />

            {/* Search */}
            <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Cari item..."
                    placeholderTextColor={colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                {search ? (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => setShowScanner(true)}>
                        <Ionicons name="scan" size={20} color={colors.accent} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter chips */}
            <View style={styles.filtersRow}>
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.chip, filter === f.key && styles.chipActive]}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Category quick filter */}
            <FlatList
                horizontal
                data={[{ id: null, name: 'Semua' }, ...categories]}
                keyExtractor={(c) => String(c.id ?? 'all')}
                showsHorizontalScrollIndicator={false}
                style={styles.catList}
                contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
                renderItem={({ item: cat }) => (
                    <TouchableOpacity
                        style={[styles.catChip, selectedCat === cat.id && styles.catChipActive]}
                        onPress={() => setSelectedCat(cat.id)}
                    >
                        <Text style={[styles.catChipText, selectedCat === cat.id && styles.catChipTextActive]}>
                            {cat.name}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* Items list */}
            <FlatList
                data={items}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}
                style={{ flex: 1 }}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>Tidak ada item ditemukan</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <ItemCard
                        item={item}
                        onPress={() => navigation.navigate('ItemForm', { itemId: item.id })}
                        onDelete={() => handleDelete(item)}
                    />
                )}
            />

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('ItemForm')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color={colors.white} />
            </TouchableOpacity>

            <BarcodeScannerModal
                visible={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={(code) => setSearch(code)}
            />
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        height: 44,
    },
    searchInput: {
        flex: 1,
        color: colors.textPrimary,
        marginLeft: Spacing.sm,
        fontSize: FontSize.md,
    },
    filtersRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        gap: Spacing.sm,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: colors.surface,
    },
    chipActive: { backgroundColor: colors.accent },
    chipText: { fontSize: FontSize.lg, color: colors.textSecondary, fontWeight: '600' },
    chipTextActive: { color: colors.white },
    catList: { marginTop: Spacing.md, maxHeight: 44 },
    catChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: colors.surfaceLight,
        marginRight: 8,
    },
    catChipActive: { backgroundColor: colors.purple },
    catChipText: { fontSize: FontSize.md, color: colors.textSecondary },
    catChipTextActive: { color: colors.white },
    emptyBox: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        color: colors.textMuted,
        marginTop: Spacing.md,
        fontSize: FontSize.md,
    },
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
});
