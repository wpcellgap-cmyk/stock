// src/components/BarcodeScannerModal.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { FontSize, Spacing } from '../theme';

const SCAN_FRAME_SIZE = 260;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Posisi kotak scan di tengah layar
const FRAME_TOP = (SCREEN_H - SCAN_FRAME_SIZE) / 2;
const FRAME_LEFT = (SCREEN_W - SCAN_FRAME_SIZE) / 2;

export default function BarcodeScannerModal({ visible, onClose, onScan }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scannedData, setScannedData] = useState('');
    const [ready, setReady] = useState(false);
    const scanCountRef = useRef({ data: '', count: 0 });
    const { colors } = useTheme();

    useEffect(() => {
        if (visible) {
            setScanned(false);
            setScannedData('');
            setReady(false);
            scanCountRef.current = { data: '', count: 0 };
            // Delay 3 detik sebelum scan aktif
            const timer = setTimeout(() => setReady(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleBarCodeScanned = ({ type, data, bounds, cornerPoints }) => {
        if (scanned || !ready) return;

        // Filter: hanya terima barcode yang berada di dalam kotak scan
        if (cornerPoints && cornerPoints.length > 0) {
            // Hitung center dari cornerPoints
            let cx = 0, cy = 0;
            for (const p of cornerPoints) {
                cx += p.x;
                cy += p.y;
            }
            cx /= cornerPoints.length;
            cy /= cornerPoints.length;

            const margin = 50;
            const inFrame = (
                cx >= FRAME_LEFT - margin &&
                cx <= FRAME_LEFT + SCAN_FRAME_SIZE + margin &&
                cy >= FRAME_TOP - margin &&
                cy <= FRAME_TOP + SCAN_FRAME_SIZE + margin
            );
            if (!inFrame) return;
        } else if (bounds && bounds.origin) {
            // Fallback ke bounds jika cornerPoints tidak tersedia
            const bx = bounds.origin.x + (bounds.size?.width || 0) / 2;
            const by = bounds.origin.y + (bounds.size?.height || 0) / 2;

            const margin = 50;
            const inFrame = (
                bx >= FRAME_LEFT - margin &&
                bx <= FRAME_LEFT + SCAN_FRAME_SIZE + margin &&
                by >= FRAME_TOP - margin &&
                by <= FRAME_TOP + SCAN_FRAME_SIZE + margin
            );
            if (!inFrame) return;
        }
        // Jika tidak ada bounds maupun cornerPoints, tetap terima

        // Barcode harus terdeteksi 3x berturut-turut sebelum diterima
        if (scanCountRef.current.data === data) {
            scanCountRef.current.count += 1;
        } else {
            scanCountRef.current = { data, count: 1 };
        }

        if (scanCountRef.current.count >= 3) {
            setScanned(true);
            setScannedData(data);
        }
    };

    const handleUse = () => {
        onScan(scannedData);
        onClose();
    };

    const handleScanAgain = () => {
        setScanned(false);
        setScannedData('');
        scanCountRef.current = { data: '', count: 0 };
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
                {/* Kamera full-screen di belakang */}
                <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'code93', 'upc_a', 'upc_e', 'codabar', 'itf14', 'datamatrix', 'pdf417'],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />

                {/* Overlay gelap dengan lubang transparan di tengah */}
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {/* Atas */}
                    <View style={styles.overlayDark} />

                    {/* Baris tengah: kiri + frame + kanan */}
                    <View style={styles.middleRow}>
                        <View style={styles.overlayDarkSide} />
                        <View style={[styles.scanFrame, { borderColor: scanned ? colors.success : ready ? colors.accent : '#ffffff55' }]}>
                            {/* Corner decorations */}
                            <View style={[styles.corner, styles.cornerTL, { borderColor: scanned ? colors.success : ready ? colors.accent : '#ffffff55' }]} />
                            <View style={[styles.corner, styles.cornerTR, { borderColor: scanned ? colors.success : ready ? colors.accent : '#ffffff55' }]} />
                            <View style={[styles.corner, styles.cornerBL, { borderColor: scanned ? colors.success : ready ? colors.accent : '#ffffff55' }]} />
                            <View style={[styles.corner, styles.cornerBR, { borderColor: scanned ? colors.success : ready ? colors.accent : '#ffffff55' }]} />
                        </View>
                        <View style={styles.overlayDarkSide} />
                    </View>

                    {/* Bawah */}
                    <View style={styles.overlayDark} />
                </View>

                {/* Header & instruksi di atas overlay */}
                <View style={styles.uiLayer} pointerEvents="box-none">
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={28} color="#ffffff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.instructionArea}>
                        {!scanned && (
                            <Text style={styles.instruction}>
                                {ready ? 'Arahkan barcode ke dalam kotak' : 'Mempersiapkan kamera...'}
                            </Text>
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
    // Overlay gelap di atas dan bawah kotak
    overlayDark: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    // Baris tengah (horizontal)
    middleRow: {
        flexDirection: 'row',
        height: SCAN_FRAME_SIZE,
    },
    // Overlay gelap di kiri dan kanan kotak
    overlayDarkSide: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    // Kotak scan (lubang transparan)
    scanFrame: {
        width: SCAN_FRAME_SIZE,
        height: SCAN_FRAME_SIZE,
        borderWidth: 1,
        borderColor: 'transparent',
        position: 'relative',
    },
    // Corner decorations
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: colors.accent,
    },
    cornerTL: {
        top: -1,
        left: -1,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 12,
    },
    cornerTR: {
        top: -1,
        right: -1,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 12,
    },
    cornerBL: {
        bottom: -1,
        left: -1,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 12,
    },
    cornerBR: {
        bottom: -1,
        right: -1,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 12,
    },
    // UI Layer di atas semua
    uiLayer: {
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
    instructionArea: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    instruction: {
        color: '#ffffff',
        fontSize: FontSize.md,
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
