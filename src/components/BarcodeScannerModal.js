// src/components/BarcodeScannerModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing } from '../theme';

export default function BarcodeScannerModal({ visible, onClose, onScan }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const { colors } = useTheme();

    useEffect(() => {
        if (visible) {
            setScanned(false);
        }
    }, [visible]);

    const handleBarCodeScanned = ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        onScan(data);
        setTimeout(() => onClose(), 300);
    };

    if (!visible) return null;

    const styles = getStyles(colors);

    if (!permission) {
        return (
            <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
                <View style={styles.container}>
                    <Text style={styles.message}>Memuat kamera...</Text>
                </View>
            </Modal>
        );
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
                <View style={styles.container}>
                    <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
                    <Text style={styles.message}>Izin kamera diperlukan untuk scan barcode</Text>
                    <TouchableOpacity style={styles.button} onPress={requestPermission}>
                        <Text style={styles.buttonText}>Izinkan Akses Kamera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelText}>Batal</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.scannerContainer}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />

                <View style={styles.overlay}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={28} color="#ffffff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.scanArea}>
                        <View style={[styles.scanFrame, { borderColor: colors.accent }]} />
                        <Text style={styles.instruction}>Arahkan kamera ke barcode/QR code</Text>
                    </View>

                    {scanned && (
                        <View style={styles.scannedBadge}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <Text style={styles.scannedText}>Berhasil scan!</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    message: {
        fontSize: FontSize.lg,
        color: colors.textPrimary,
        textAlign: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.xxl,
    },
    button: {
        backgroundColor: colors.accent,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: Spacing.md,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: FontSize.md,
        fontWeight: '700',
    },
    cancelBtn: {
        padding: Spacing.md,
    },
    cancelText: {
        color: colors.textSecondary,
        fontSize: FontSize.md,
    },
    scannerContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 3,
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    instruction: {
        color: '#ffffff',
        fontSize: FontSize.md,
        marginTop: Spacing.xl,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: 8,
    },
    scannedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,200,83,0.9)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        alignSelf: 'center',
        marginBottom: 100,
    },
    scannedText: {
        color: '#ffffff',
        fontSize: FontSize.md,
        fontWeight: '700',
        marginLeft: 8,
    },
});
