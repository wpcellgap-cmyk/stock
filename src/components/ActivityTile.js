// src/components/ActivityTile.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing, BorderRadius } from '../theme';

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now - d;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return d.toLocaleDateString('id-ID');
}

export default function ActivityTile({ activity }) {
    const { colors } = useTheme();

    function getActivityMeta(type) {
        switch (type) {
            case 'stock_in': return { icon: 'arrow-down-circle', color: colors.success, label: 'Stok Masuk' };
            case 'stock_out': return { icon: 'arrow-up-circle', color: colors.danger, label: 'Stok Keluar' };
            case 'import': return { icon: 'cloud-download', color: colors.info, label: 'Import' };
            case 'export': return { icon: 'cloud-upload', color: colors.purple, label: 'Export' };
            case 'delete': return { icon: 'trash', color: colors.danger, label: 'Hapus' };
            default: return { icon: 'ellipse', color: colors.textMuted, label: type };
        }
    }

    const meta = getActivityMeta(activity.type);
    const styles = getStyles(colors);

    return (
        <View style={styles.container}>
            <View style={[styles.iconBox, { backgroundColor: meta.color + '22' }]}>
                <Ionicons name={meta.icon} size={20} color={meta.color} />
            </View>
            <View style={styles.content}>
                <Text style={styles.label}>{meta.label}</Text>
                <Text style={styles.note} numberOfLines={1}>
                    {activity.item_name || activity.note || activity.file_name || '—'}
                </Text>
            </View>
            <View style={styles.right}>
                {activity.quantity_change ? (
                    <Text style={[styles.qty, { color: meta.color }]}>
                        {activity.type === 'stock_out' ? '-' : '+'}{activity.quantity_change}
                    </Text>
                ) : null}
                <Text style={styles.time}>{timeAgo(activity.created_at)}</Text>
            </View>
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    content: { flex: 1 },
    label: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    note: {
        fontSize: FontSize.xs,
        color: colors.textSecondary,
        marginTop: 2,
    },
    right: { alignItems: 'flex-end' },
    qty: {
        fontSize: FontSize.md,
        fontWeight: '800',
    },
    time: {
        fontSize: FontSize.xs,
        color: colors.textMuted,
        marginTop: 2,
    },
});
