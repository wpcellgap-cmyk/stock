// src/components/ItemCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing, BorderRadius, Shadow } from '../theme';

function getStockStatus(quantity, minStock) {
    if (quantity === 0) return { label: 'Habis', bg: '', text: '' };
    if (quantity <= minStock) return { label: 'Stok Rendah', bg: '', text: '' };
    return { label: 'Tersedia', bg: '', text: '' };
}

export default function ItemCard({ item, onPress, onDelete }) {
    const { colors } = useTheme();
    const status = getStockStatus(item.quantity, item.min_stock);
    const priceFormatted = 'Rp ' + (item.sell_price || item.price || 0).toLocaleString('id-ID');

    // Dynamic status colors
    let statusColor;
    if (item.quantity === 0) statusColor = colors.outOfStock;
    else if (item.quantity <= item.min_stock) statusColor = colors.lowStock;
    else statusColor = colors.inStock;

    const styles = getStyles(colors);

    return (
        <TouchableOpacity
            style={[styles.card, Shadow.light]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <View style={styles.meta}>
                    <Text style={styles.price}>{priceFormatted}</Text>
                    {item.category_name ? (
                        <View style={styles.catBadge}>
                            <Text style={styles.catText}>{item.category_name}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
            <View style={styles.qtyBox}>
                <Text style={[styles.qty, { color: statusColor }]}>{item.quantity}</Text>
                <Text style={styles.qtyLabel}>stok</Text>
            </View>
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

const getStyles = (colors) => StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        marginBottom: Spacing.xs,
        minHeight: 60,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: Spacing.sm,
    },
    info: { flex: 1, justifyContent: 'center' },
    name: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: colors.textPrimary,
        lineHeight: 20,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        gap: 6,
    },
    price: {
        fontSize: FontSize.sm,
        color: colors.accent,
        fontWeight: '600',
    },
    catBadge: {
        backgroundColor: colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    catText: {
        fontSize: FontSize.xs,
        color: colors.textSecondary,
    },
    qtyBox: {
        alignItems: 'center',
        marginHorizontal: Spacing.sm,
        minWidth: 32,
    },
    qty: {
        fontSize: FontSize.xl,
        fontWeight: '900',
    },
    qtyLabel: {
        fontSize: FontSize.xs,
        color: colors.textMuted,
    },
    deleteBtn: {
        padding: 4,
    },
});
