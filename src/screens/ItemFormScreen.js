// src/screens/ItemFormScreen.js
import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { getItemById, addItem, updateItem, getCategories, findItemByName, addStockToItem } from '../database';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing, BorderRadius, Shadow } from '../theme';

export default function ItemFormScreen({ navigation, route }) {
    const toTitleCase = (str) => str.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
    const { colors } = useTheme();

    const editId = route.params?.itemId;
    const isEdit = !!editId;
    const insets = useSafeAreaInsets();

    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [customId, setCustomId] = useState('');
    const [catId, setCatId] = useState(null);
    const [buyPrice, setBuyPrice] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [minStock, setMinStock] = useState('1');
    const [description, setDescription] = useState('');
    const [categories, setCategories] = useState([]);
    const [saving, setSaving] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        loadCategories();
        if (editId) loadItem();
    }, []);

    const loadCategories = async () => {
        const cats = await getCategories();
        setCategories(cats);
    };

    const loadItem = async () => {
        const item = await getItemById(editId);
        if (item) {
            setName(item.name);
            setSku(item.sku || '');
            setCustomId(item.custom_id || '');
            setCatId(item.category_id);
            setBuyPrice(String(item.buy_price || ''));
            setSellPrice(String(item.sell_price || ''));
            setQuantity(String(item.quantity || ''));
            setMinStock(String(item.min_stock || '1'));
            setDescription(item.description || '');
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Nama item wajib diisi');
            return;
        }
        setSaving(true);
        try {
            const data = {
                name: toTitleCase(name.trim()),
                sku: sku.trim(),
                custom_id: customId.trim(),
                category_id: catId,
                buy_price: parseFloat(buyPrice) || 0,
                sell_price: parseFloat(sellPrice) || 0,
                quantity: parseInt(quantity) || 0,
                min_stock: parseInt(minStock) || 1,
                description: description.trim(),
            };
            if (isEdit) {
                await updateItem(editId, data);
                navigation.goBack();
            } else {
                const existing = await findItemByName(data.name, data.category_id);
                if (existing) {
                    setSaving(false);
                    Alert.alert(
                        'Item Sudah Ada',
                        `"${existing.name}" sudah ada dengan stok ${existing.quantity}.\nTambah ${data.quantity} stok ke item yang ada?`,
                        [
                            { text: 'Batal', style: 'cancel' },
                            {
                                text: 'Tetap Simpan Baru',
                                onPress: async () => {
                                    setSaving(true);
                                    await addItem(data);
                                    setSaving(false);
                                    navigation.goBack();
                                },
                            },
                            {
                                text: `Tambah ${data.quantity} Stok`,
                                style: 'default',
                                onPress: async () => {
                                    setSaving(true);
                                    await addStockToItem(existing.id, data.quantity);
                                    setSaving(false);
                                    navigation.goBack();
                                },
                            },
                        ]
                    );
                    return;
                }
                await addItem(data);
                navigation.goBack();
            }
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setSaving(false);
        }
    };

    const styles = getStyles(colors);

    const renderInput = (label, value, onChangeText, props = {}) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, props.multiline && styles.inputMultiline]}
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor={colors.textMuted}
                {...props}
            />
        </View>
    );

    return (
        <View style={styles.screen}>
            {/* Header */}
            <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 12 }]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? 'Edit Item' : 'Tambah Item'}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.form}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderInput('Nama Item *', name, setName, { placeholder: 'Contoh: Tombol Luar iPhone 12' })}

                    {renderInput('ID Barang (Opsional)', customId, setCustomId, { placeholder: 'Contoh: A001' })}

                    {/* SKU Input with Scan Button */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>SKU / Kode (Opsional)</Text>
                        <View style={styles.inputWithIcon}>
                            <TextInput
                                style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }]}
                                value={sku}
                                onChangeText={setSku}
                                placeholder="Contoh: TL-IP12-BLK"
                                placeholderTextColor={colors.textMuted}
                            />
                            <TouchableOpacity
                                style={styles.scanBtn}
                                onPress={() => setShowScanner(true)}
                            >
                                <Ionicons name="scan" size={20} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Category picker */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Kategori</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                            <TouchableOpacity
                                style={[styles.catPill, !catId && styles.catPillActive]}
                                onPress={() => setCatId(null)}
                            >
                                <Text style={[styles.catPillText, !catId && styles.catPillTextActive]}>Tanpa Kategori</Text>
                            </TouchableOpacity>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.catPill, catId === cat.id && styles.catPillActive]}
                                    onPress={() => setCatId(cat.id)}
                                >
                                    <Text style={[styles.catPillText, catId === cat.id && styles.catPillTextActive]}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            {renderInput('Harga Beli (Rp)', buyPrice, setBuyPrice, { placeholder: '0', keyboardType: 'numeric' })}
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            {renderInput('Harga Jual (Rp)', sellPrice, setSellPrice, { placeholder: '0', keyboardType: 'numeric' })}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            {renderInput('Jumlah Stok', quantity, setQuantity, { placeholder: '0', keyboardType: 'numeric' })}
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            {renderInput('Minimum Stok', minStock, setMinStock, { placeholder: '1', keyboardType: 'numeric' })}
                        </View>
                    </View>
                    {renderInput('Keterangan', description, setDescription, { placeholder: 'Catatan...', multiline: true, numberOfLines: 3 })}

                    {/* Save button */}
                    <TouchableOpacity
                        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[colors.gradientStart, colors.gradientEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveBtnGradient}
                        >
                            <Ionicons name={isEdit ? 'checkmark' : 'add'} size={20} color={colors.white} />
                            <Text style={styles.saveBtnText}>{isEdit ? 'Simpan Perubahan' : 'Tambah Item'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <BarcodeScannerModal
                        visible={showScanner}
                        onClose={() => setShowScanner(false)}
                        onScan={(code) => setSku(code)}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingBottom: 16,
        paddingHorizontal: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: colors.white },
    form: { padding: Spacing.xl, paddingBottom: 100 },
    inputGroup: { marginBottom: Spacing.lg },
    label: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
    input: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        color: colors.textPrimary,
        fontSize: FontSize.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },
    catPill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surface,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    catPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    catPillText: { fontSize: FontSize.sm, color: colors.textSecondary },
    catPillTextActive: { color: colors.white, fontWeight: '600' },
    saveBtn: { marginTop: Spacing.xxl },
    saveBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: BorderRadius.md,
        gap: 8,
    },
    saveBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: colors.white },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scanBtn: {
        backgroundColor: colors.accent,
        height: 50,
        paddingHorizontal: 16,
        borderTopRightRadius: BorderRadius.md,
        borderBottomRightRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.accent,
    },
});
