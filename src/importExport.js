// src/importExport.js — CSV/Excel import & export
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { bulkInsertItems, getAllItemsForExport, logActivity } from './database';

// ─── Smart column mapping ───────────────────────────
const COLUMN_MAP = {
    name: ['name', 'nama', 'item', 'produk', 'product', 'barang', 'nama barang', 'nama item'],
    sku: ['sku', 'kode', 'code', 'barcode'],
    custom_id: ['custom_id', 'id_barang', 'id barang', 'kode toko', 'manual_id'],
    category: ['category', 'kategori', 'jenis', 'tipe', 'type'],
    buy_price: ['buy_price', 'harga beli', 'buy price', 'modal', 'cost', 'biaya'],
    sell_price: ['sell_price', 'harga jual', 'sell price', 'harga', 'price'],
    quantity: ['quantity', 'qty', 'jumlah', 'stok', 'stock', 'jumlah (stok)'],
    min_stock: ['min_stock', 'min stock', 'min stok', 'minimum', 'min', 'reorder'],
    description: ['description', 'desc', 'keterangan', 'deskripsi', 'catatan', 'note'],
};

function mapColumns(headers) {
    const mapping = {};
    headers.forEach((h) => {
        const lower = h.toLowerCase().trim();
        for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
            if (aliases.includes(lower)) {
                mapping[h] = field;
                break;
            }
        }
    });
    return mapping;
}

// ─── Import CSV / Excel ─────────────────────────────
export async function importFile() {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '*/*'],
            copyToCacheDirectory: true,
        });

        if (result.canceled) return { success: false, message: 'Dibatalkan' };

        const file = result.assets[0];
        let rows = [];

        const isExcel = file.name?.endsWith('.xlsx') || file.name?.endsWith('.xls') ||
            file.mimeType?.includes('spreadsheetml') || file.mimeType?.includes('ms-excel');

        if (isExcel) {
            // ── Read Excel as base64 (binary format) ──
            try {
                const XLSX = require('xlsx');
                const base64Content = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
                const workbook = XLSX.read(base64Content, { type: 'base64' });
                const sheetName = workbook.SheetNames[0];
                const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

                if (data.length === 0) {
                    return { success: false, message: 'File Excel kosong' };
                }

                const headers = Object.keys(data[0] || {});
                const colMap = mapColumns(headers);
                rows = data.map((row) => {
                    const mapped = {};
                    for (const [original, field] of Object.entries(colMap)) {
                        mapped[field] = row[original];
                    }
                    return mapped;
                });
            } catch (e) {
                return { success: false, message: 'Error membaca file Excel: ' + e.message };
            }
        } else {
            // ── Read CSV as text ──
            const content = await FileSystem.readAsStringAsync(file.uri);
            // Strip BOM if present
            const cleanContent = content.replace(/^\uFEFF/, '');
            const parsed = Papa.parse(cleanContent, { header: true, skipEmptyLines: true });
            if (parsed.errors.length > 0) {
                return { success: false, message: 'Error parsing CSV: ' + parsed.errors[0].message };
            }
            const colMap = mapColumns(parsed.meta.fields || []);
            rows = parsed.data.map((row) => {
                const mapped = {};
                for (const [original, field] of Object.entries(colMap)) {
                    mapped[field] = row[original];
                }
                return mapped;
            });
        }

        if (rows.length === 0) {
            return { success: false, message: 'File kosong atau format tidak sesuai' };
        }

        const result2 = await bulkInsertItems(rows);
        const { inserted, updated, skipped, total } = result2;
        let msg = [];
        if (inserted > 0) msg.push(`${inserted} item baru`);
        if (updated > 0) msg.push(`${updated} item diperbarui (stok ditambah)`);
        if (skipped > 0) msg.push(`${skipped} baris dilewati`);
        await logActivity(null, 'import', total, `Import dari ${file.name}: ${msg.join(', ')}`, file.name);

        return { success: true, message: `Berhasil import: ${msg.join(', ')}`, count: total };
    } catch (e) {
        return { success: false, message: 'Error: ' + e.message };
    }
}

// ─── Export CSV ─────────────────────────────────────
export async function exportCSV() {
    try {
        const items = await getAllItemsForExport();
        if (items.length === 0) return { success: false, message: 'Tidak ada data untuk diekspor' };

        const data = items.map((item) => ({
            'Nama Barang': item.name,
            'ID Barang': item.custom_id || '',
            SKU: item.sku || '',
            Kategori: item.category_name || '',
            'Harga Beli': item.buy_price || 0,
            'Harga Jual': item.sell_price || item.price || 0,
            'Jumlah (Stok)': item.quantity,
            'Min Stok': item.min_stock,
            Keterangan: item.description || '',
        }));

        const csv = '\uFEFF' + Papa.unparse(data);
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const fileName = `stock_export_${dateStr}.csv`;
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Stok (CSV)' });
        await logActivity(null, 'export', items.length, `Export ${items.length} item ke CSV`, fileName);

        return { success: true, message: `${items.length} item diekspor ke CSV` };
    } catch (e) {
        return { success: false, message: 'Error: ' + e.message };
    }
}

// ─── Export Transaction History CSV ─────────────────
export async function exportTransactionHistoryCSV() {
    try {
        const { getActivities } = require('./database');
        const activities = await getActivities(10000); // Get recent 10000 activities

        if (activities.length === 0) return { success: false, message: 'Tidak ada riwayat transaksi' };

        const data = activities.map((act) => ({
            'Tanggal': act.created_at,
            'Tipe': act.type === 'stock_in' ? 'Masuk' : act.type === 'stock_out' ? 'Keluar' : act.type,
            'Nama Barang': act.item_name || 'Item dihapus',
            'Jumlah': act.quantity_change,
            'Catatan': act.note || '',
            'Status': act.status || 'success'
        }));

        const csv = '\uFEFF' + Papa.unparse(data);
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const fileName = `riwayat_transaksi_${dateStr}.csv`;
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Riwayat Transaksi' });

        return { success: true, message: `${activities.length} riwayat diekspor ke CSV` };
    } catch (e) {
        return { success: false, message: 'Error: ' + e.message };
    }
}

// ─── Export Excel ───────────────────────────────────
// ─── Export Excel ───────────────────────────────────
export async function exportExcel() {
    try {
        const items = await getAllItemsForExport();
        const { getActivities } = require('./database');
        const activities = await getActivities(10000); // Limit 10k for performance

        if (items.length === 0 && activities.length === 0) return { success: false, message: 'Tidak ada data untuk diekspor' };

        const XLSX = require('xlsx');
        const wb = XLSX.utils.book_new();

        // Sheet 1: Stock Items
        if (items.length > 0) {
            const dataItems = items.map((item) => ({
                'Nama Barang': item.name,
                'ID Barang': item.custom_id || '',
                SKU: item.sku || '',
                Kategori: item.category_name || '',
                'Harga Beli': item.buy_price || 0,
                'Harga Jual': item.sell_price || item.price || 0,
                'Jumlah (Stok)': item.quantity,
                'Min Stok': item.min_stock,
                Keterangan: item.description || '',
            }));
            const wsItems = XLSX.utils.json_to_sheet(dataItems);
            // Auto-fit columns for Items
            const headersItems = ['Nama Barang', 'ID Barang', 'SKU', 'Kategori', 'Harga Beli', 'Harga Jual', 'Jumlah (Stok)', 'Min Stok', 'Keterangan'];
            wsItems['!cols'] = headersItems.map((h) => ({ wch: 20 })); // Simplified auto-width
            XLSX.utils.book_append_sheet(wb, wsItems, 'Stok Saat Ini');
        }

        // Sheet 2: Transaction History
        if (activities.length > 0) {
            const dataHistory = activities.map((act) => ({
                'Tanggal': act.created_at,
                'Tipe': act.type === 'stock_in' ? 'Masuk' : act.type === 'stock_out' ? 'Keluar' : act.type,
                'Nama Barang': act.item_name || 'Item dihapus',
                'Jumlah': act.quantity_change,
                'Catatan': act.note || '',
                'Status': act.status || 'success'
            }));
            const wsHistory = XLSX.utils.json_to_sheet(dataHistory);
            // Auto-fit columns for History
            const headersHistory = ['Tanggal', 'Tipe', 'Nama Barang', 'Jumlah', 'Catatan', 'Status'];
            wsHistory['!cols'] = headersHistory.map((h) => ({ wch: 20 }));
            XLSX.utils.book_append_sheet(wb, wsHistory, 'Riwayat Transaksi');
        }

        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const fileName = `stock_report_${dateStr}.xlsx`;
        const fileUri = FileSystem.documentDirectory + fileName;
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

        await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: 'base64' });
        await Sharing.shareAsync(fileUri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Export Laporan (Excel)' });
        await logActivity(null, 'export', 0, `Export Laporan Lengkap (Excel)`, fileName);

        return { success: true, message: `Laporan berhasil diekspor` };
    } catch (e) {
        return { success: false, message: 'Error: ' + e.message };
    }
}
