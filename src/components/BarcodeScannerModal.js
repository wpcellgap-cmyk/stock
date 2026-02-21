// src/components/BarcodeScannerModal.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing } from '../theme';

const SCAN_FRAME_SIZE = 250;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function BarcodeScannerModal({ visible, onClose, onScan }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scannedData, setScannedData] = useState('');
    const { colors } = useTheme();

    useEffect(() => {
        if (visible) {
            setScanned(false);
            setScannedData('');
        }
    }, [visible]);

    const isInsideScanFrame = (bounds) => {
        if (!bounds || !bounds.origin) return true; // fallback: accept if no bounds info

        const frameLeft = (SCREEN_W - SCAN_FRAME_SIZE) / 2;
        const frameTop = (SCREEN_H - SCAN_FRAME_SIZE) / 2;
        const frameRight = frameLeft + SCAN_FRAME_SIZE;
        const frameBottom = frameTop + SCAN_FRAME_SIZE;

        // Center point of the barcode
        const barcodeX = bounds.origin.x + (bounds.size?.width || 0) / 2;
        const barcodeY = bounds.origin.y + (bounds.size?.height || 0) / 2;

        // Allow some margin (30px) for better UX
        const margin = 30;
        return (
            barcodeX >= frameLeft - margin &&
            barcodeX <= frameRight + margin &&
            barcodeY >= frameTop - margin &&
            barcodeY <= frameBottom + margin
        );
    };

    const handleBarCodeScanned = ({ type, data, bounds }) => {
        if (scanned) return;
        if (!isInsideScanFrame(bounds)) return; // ignore scans outside the frame

        setScanned(true);
        setScannedData(data);
    };

    const handleUse = () => {
        onScan(scannedData);
        onClose();
    };

    const handleScanAgain = () => {
        setScanned(false);
        setScannedData('');
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
                        <View style={[styles.scanFrame, { borderColor: scanned ? colors.success : colors.accent }]} />
                        {!scanned && (
                            <Text style={styles.instruction}>Arahkan barcode ke dalam kotak</Text>
                        )}
                    </View>

                    {scanned && (
                        <View style={styles.resultContainer}>
                            <View style={styles.resultCard}>
                                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                                <Text style={styles.resultLabel}>Hasil Scan:</Text>
                                <Text style={styles.resultData} numberOfLines={2}>{scannedData}</Text>
                                <View style={styles.resultButtons}>
                                    <TouchableOpacity style={styles.scanAgainBtn} onPress={handleScanAgain}>
                                        <Ionicons name="refresh" size={18} color={colors.white} />
                                        <Text style={styles.scanAgainText}>Scan Ulang</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.useBtn, { backgroundColor: colors.success }]} onPress={handleUse}>
                                        <Ionicons name="checkmark" size={18} color={colors.white} />
                                        <Text style={styles.useBtnText}>Gunakan</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
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
        width: SCAN_FRAME_SIZE,
        height: SCAN_FRAME_SIZE,
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
    resultContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 60,
    },
    resultCard: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderRadius: 16,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    resultLabel: {
        color: '#aaa',
        fontSize: FontSize.sm,
        marginTop: 8,
    },
    resultData: {
        color: '#ffffff',
        fontSize: FontSize.xl,
        fontWeight: '700',
        marginTop: 4,
        textAlign: 'center',
    },
    resultButtons: {
        flexDirection: 'row',
        marginTop: Spacing.lg,
        gap: 12,
    },
    scanAgainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 6,
    },
    scanAgainText: {
        color: '#ffffff',
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    useBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 6,
    },
    useBtnText: {
        color: '#ffffff',
        fontSize: FontSize.md,
        fontWeight: '700',
    },
});
