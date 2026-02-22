import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
    KeyboardAvoidingView, Platform, FlatList, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { getItems, addStockToItem, logActivity, getDatabase } from '../database';
import { exportTransactionHistoryCSV, exportExcel } from '../importExport';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing, BorderRadius, Shadow } from '../theme';

export default function TransactionScreen({ navigation }) {
    const { colors } = useTheme();
    const [type, setType] = useState('in'); // 'in', 'out', 'shopping'
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    // Shopping List State
    const [shoppingList, setShoppingList] = useState([]);
    const [listLoaded, setListLoaded] = useState(false);

    // Load shopping list from AsyncStorage on mount
    useEffect(() => {
        AsyncStorage.getItem('@shopping_list').then(data => {
            if (data) setShoppingList(JSON.parse(data));
            setListLoaded(true);
        });
    }, []);

    // Save shopping list to AsyncStorage whenever it changes
    useEffect(() => {
        if (listLoaded) {
            AsyncStorage.setItem('@shopping_list', JSON.stringify(shoppingList));
        }
    }, [shoppingList, listLoaded]);

    const loadItems = async () => {
        const data = await getItems(search, 'all');
        setItems(data);
    };

    useFocusEffect(
        useCallback(() => {
            loadItems();
        }, [search])
    );

    const handleSelect = (item) => {
        setSelectedItem(item);
        setSearch(item.name);
        setShowDropdown(false);
    };

    const handleScanResult = async (code) => {
        // Cari item berdasarkan barcode (sku atau custom_id)
        const results = await getItems(code, 'all');
        if (results.length === 1) {
            // Tepat 1 item ditemukan, langsung pilih
            handleSelect(results[0]);
        } else if (results.length > 1) {
            // Lebih dari 1 item, tampilkan dropdown dengan hasil
            setSearch(code);
            setShowDropdown(true);
        } else {
            Alert.alert('Tidak Ditemukan', `Tidak ada barang dengan kode "${code}"`);
        }
    };

    const handleSave = async () => {
        if (!selectedItem) {
            Alert.alert('Error', 'Pilih barang terlebih dahulu');
            return;
        }
        if (!quantity || parseInt(quantity) <= 0) {
            Alert.alert('Error', 'Masukkan jumlah yang valid');
            return;
        }

        const qty = parseInt(quantity);

        // Handle Shopping List Add
        if (type === 'shopping') {
            const newItem = {
                id: Date.now(), // temporary unique id
                item_id: selectedItem.id,
                name: selectedItem.name,
                qty: qty
            };
            setShoppingList([...shoppingList, newItem]);
            setQuantity('');
            setSelectedItem(null);
            setSearch('');
            return;
        }

        setLoading(true);

        try {
            const db = await getDatabase();
            if (type === 'in') {
                await addStockToItem(selectedItem.id, qty);
            } else {
                if (selectedItem.quantity < qty) {
                    Alert.alert('Stok Tidak Cukup', `Stok saat ini hanya ${selectedItem.quantity}`);
                    setLoading(false);
                    return;
                }
                // Reduce stock
                await db.runAsync(
                    'UPDATE items SET quantity = quantity - ?, updated_at = datetime("now","localtime") WHERE id = ?',
                    [qty, selectedItem.id]
                );
                await logActivity(selectedItem.id, 'stock_out', qty, `Barang Keluar: ${qty}`);
            }

            Alert.alert('Sukses', 'Stok berhasil diperbarui!', [
                {
                    text: 'OK', onPress: () => {
                        setQuantity('');
                        setSelectedItem(null);
                        setSearch('');
                        loadItems(); // Refresh items to get cleared content
                    }
                }
            ]);

        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        Alert.alert(
            'Export Data',
            'Pilih format laporan yang ingin diekspor:',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Riwayat (CSV)',
                    onPress: async () => {
                        setLoading(true);
                        const res = await exportTransactionHistoryCSV();
                        setLoading(false);
                        Alert.alert(res.success ? 'Sukses' : 'Gagal', res.message);
                    }
                },
                {
                    text: 'Laporan Lengkap (Excel)',
                    onPress: async () => {
                        setLoading(true);
                        const res = await exportExcel();
                        setLoading(false);
                        Alert.alert(res.success ? 'Sukses' : 'Gagal', res.message);
                    }
                }
            ]
        );
    };

    const handleShareWhatsApp = async () => {
        if (shoppingList.length === 0) {
            Alert.alert('Info', 'Daftar belanja masih kosong');
            return;
        }

        try {
            const stored = await AsyncStorage.getItem('shop_identity');
            const shopName = stored ? JSON.parse(stored).name : 'SAYA';
            const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

            let msg = `📦 DAFTAR PESANAN - ${shopName.toUpperCase()}\n`;
            msg += `Tanggal: ${date}\n\n`;

            shoppingList.forEach((item, index) => {
                msg += `${index + 1}. ${item.name} - (${item.qty} Pcs)\n`;
            });

            msg += `\nMohon info ketersediaan stok dan total harganya. Terima kasih!`;

            const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;

            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'WhatsApp tidak terinstall di perangkat ini');
            }
        } catch (e) {
            Alert.alert('Error', 'Gagal membuka WhatsApp');
        }
    };

    const styles = getStyles(colors, type);

    const isKw = type === 'out'; // Barang Keluar logic for styling
    const isShop = type === 'shopping'; // Shopping logic

    return (
        <View style={styles.screen}>
            {/* Header Tabs */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.tab, type === 'in' && styles.tabActive]}
                    onPress={() => setType('in')}
                >
                    <Ionicons name="arrow-down-circle" size={24} color={type === 'in' ? colors.white : colors.success} />
                    <Text style={[styles.tabText, type === 'in' && styles.tabTextActive]}>Barang Masuk</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, type === 'out' && styles.tabActiveOut]}
                    onPress={() => setType('out')}
                >
                    <Ionicons name="arrow-up-circle" size={24} color={type === 'out' ? colors.white : colors.danger} />
                    <Text style={[styles.tabText, type === 'out' && styles.tabTextActive]}>Barang Keluar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, type === 'shopping' && styles.tabActiveShop]}
                    onPress={() => setType('shopping')}
                >
                    <Ionicons name="cart" size={24} color={type === 'shopping' ? colors.white : colors.info} />
                    <Text style={[styles.tabText, type === 'shopping' && styles.tabTextActive]}>Daftar Belanja</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>
                    {isShop ? 'Daftar Belanja Manual' : isKw ? 'Catat Barang Keluar' : 'Catat Barang Masuk'}
                </Text>
                <Text style={styles.subtitle}>
                    {isShop
                        ? 'Catat barang yang perlu dibeli (tidak mengurangi stok)'
                        : isKw
                            ? 'Kurangi stok untuk penjualan atau penggunaan'
                            : 'Tambah stok dari pembelian atau retur'}
                </Text>

                {/* Form */}
                <View style={styles.formCard}>
                    {/* Search Dropdown */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Cari Barang</Text>
                        <View style={styles.inputWithScan}>
                            <TouchableOpacity
                                style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }]}
                                onPress={() => setShowDropdown(!showDropdown)}
                            >
                                <Text style={{ color: selectedItem ? colors.textPrimary : colors.textMuted }}>
                                    {selectedItem ? selectedItem.name : 'Pilih barang...'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.scanBtn}
                                onPress={() => setShowScanner(true)}
                            >
                                <Ionicons name="scan" size={22} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showDropdown && (
                        <View style={styles.dropdown}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Ketik nama barang..."
                                placeholderTextColor={colors.textMuted}
                                value={search}
                                onChangeText={setSearch}
                                autoFocus
                            />
                            <FlatList
                                data={items}
                                keyExtractor={(item) => String(item.id)}
                                style={{ maxHeight: 200 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.dropdownItem}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text style={styles.itemTitle}>{item.name}</Text>
                                        <Text style={styles.itemSub}>Stok: {item.quantity} | {item.category_name}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}

                    {/* Quantity Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Jumlah {isShop ? 'Beli' : isKw ? 'Keluar' : 'Masuk'}</Text>
                        <TextInput
                            style={styles.input}
                            value={quantity}
                            onChangeText={setQuantity}
                            placeholder="0"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Info */}
                    {selectedItem && (
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
                            <Text style={styles.infoText}>
                                Stok saat ini: <Text style={{ fontWeight: 'bold' }}>{selectedItem.quantity}</Text>
                            </Text>
                        </View>
                    )}

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[
                            styles.saveBtn,
                            isShop ? styles.btnInfo : isKw ? styles.btnDanger : styles.btnSuccess,
                            loading && { opacity: 0.7 }
                        ]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.saveBtnText}>
                            {loading ? 'Menyimpan...' : isShop ? 'Masukkan ke Daftar' : 'Simpan Transaksi'}
                        </Text>
                    </TouchableOpacity>

                    {/* Export Button */}
                    <TouchableOpacity
                        style={styles.exportBtn}
                        onPress={handleExport}
                        disabled={loading}
                    >
                        <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
                        <Text style={styles.exportBtnText}>Export Data & Riwayat</Text>
                    </TouchableOpacity>
                </View>

                {/* Shopping List Table */}
                {isShop && shoppingList.length > 0 && (
                    <View style={styles.shoppingListContainer}>
                        <View style={styles.shopHeader}>
                            <Text style={styles.shopTitle}>Isi Keranjang ({shoppingList.length})</Text>
                            <TouchableOpacity onPress={() => setShoppingList([])}>
                                <Text style={styles.clearText}>Kosongkan</Text>
                            </TouchableOpacity>
                        </View>
                        {shoppingList.map((item, index) => (
                            <View key={index} style={styles.shopItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.shopItemName}>{item.name}</Text>
                                    <Text style={styles.shopItemQty}>Jumlah: {item.qty}</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        const newList = [...shoppingList];
                                        newList.splice(index, 1);
                                        setShoppingList(newList);
                                    }}
                                    style={styles.deleteBtn}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity style={styles.waBtn} onPress={handleShareWhatsApp}>
                            <Ionicons name="logo-whatsapp" size={20} color="white" />
                            <Text style={styles.waBtnText}>Kirim ke WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <BarcodeScannerModal
                    visible={showScanner}
                    onClose={() => setShowScanner(false)}
                    onScan={handleScanResult}
                />
            </View>
        </View>
    );
}

const getStyles = (colors, type) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        paddingTop: 50, // Safe area approx
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        backgroundColor: colors.surface,
        gap: Spacing.xs, // Reduced gap to fit 3 tabs
    },
    tab: {
        flex: 1,
        flexDirection: 'column', // Stack icon and text for better fit
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: BorderRadius.md,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    tabActive: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    tabActiveOut: {
        backgroundColor: colors.danger,
        borderColor: colors.danger,
    },
    tabActiveShop: {
        backgroundColor: colors.info,
        borderColor: colors.info,
    },
    tabText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: colors.textSecondary,
        textAlign: 'center',
    },
    tabTextActive: {
        color: colors.white,
    },
    content: {
        padding: Spacing.xl,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: colors.textSecondary,
        marginBottom: Spacing.xl,
    },
    formCard: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        ...Shadow.card,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        color: colors.textPrimary,
        fontSize: FontSize.md,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdown: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: -Spacing.md, // Overlap a bit
        marginBottom: Spacing.lg,
        overflow: 'hidden',
        elevation: 5,
        zIndex: 10,
    },
    searchInput: {
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        color: colors.textPrimary,
    },
    dropdownItem: {
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border + '44',
    },
    itemTitle: {
        fontSize: FontSize.md,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    itemSub: {
        fontSize: FontSize.xs,
        color: colors.textSecondary,
        marginTop: 2,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: colors.info + '15',
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.xl,
        gap: 8,
    },
    infoText: {
        color: colors.textSecondary,
        fontSize: FontSize.sm,
    },
    inputWithScan: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scanBtn: {
        backgroundColor: type === 'out' ? colors.danger : type === 'shopping' ? colors.info : colors.success,
        height: 50,
        paddingHorizontal: 16,
        borderTopRightRadius: BorderRadius.md,
        borderBottomRightRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtn: {
        paddingVertical: 16,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        elevation: 2,
    },
    btnSuccess: { backgroundColor: colors.success },
    btnDanger: { backgroundColor: colors.danger },
    btnInfo: { backgroundColor: colors.info },
    saveBtnText: {
        color: colors.white,
        fontSize: FontSize.lg,
        fontWeight: 'bold',
    },
    exportBtn: {
        marginTop: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.md,
        gap: 8,
    },
    exportBtnText: {
        color: colors.textSecondary,
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    shoppingListContainer: {
        marginTop: Spacing.xl,
        marginBottom: 100,
    },
    shopHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    shopTitle: {
        fontSize: FontSize.lg,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    clearText: {
        color: colors.danger,
        fontWeight: '600',
    },
    shopItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    shopItemName: {
        color: colors.textPrimary,
        fontWeight: '600',
        fontSize: FontSize.md,
    },
    shopItemQty: {
        color: colors.textSecondary,
        fontSize: FontSize.sm,
    },
    deleteBtn: {
        padding: 8,
    },
    waBtn: {
        marginTop: Spacing.md,
        backgroundColor: '#25D366', // WhatsApp Green
        paddingVertical: 12,
        borderRadius: BorderRadius.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        elevation: 2,
    },
    waBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: FontSize.md,
    },
});
