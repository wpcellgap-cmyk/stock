// src/database.js — SQLite helper for Stock Manager
import * as SQLite from 'expo-sqlite';

let db = null;

export async function getDatabase() {
    if (db) return db;
    db = await SQLite.openDatabaseAsync('stockmanager.db');
    await initDatabase(db);
    return db;
}

async function initDatabase(database) {
    await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'cube-outline',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT,
      category_id INTEGER,
      price REAL DEFAULT 0,
      quantity INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 5,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER,
      type TEXT NOT NULL,
      quantity_change INTEGER DEFAULT 0,
      note TEXT,
      file_name TEXT,
      status TEXT DEFAULT 'success',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

    // Migration: Add custom_id column
    await database.runAsync('ALTER TABLE items ADD COLUMN custom_id TEXT').catch(() => { });

    // Migration: Add buy_price and sell_price columns
    await database.runAsync('ALTER TABLE items ADD COLUMN buy_price REAL DEFAULT 0').catch(() => { });
    await database.runAsync('ALTER TABLE items ADD COLUMN sell_price REAL DEFAULT 0').catch(() => { });
    // Migrate old price data to sell_price (one-time)
    await database.runAsync('UPDATE items SET sell_price = price WHERE sell_price = 0 AND price > 0').catch(() => { });

    // Seed default categories if empty
    const row = await database.getFirstAsync('SELECT COUNT(*) as count FROM categories');
    if (row.count === 0) {
        const defaults = [
            ['Tombol Luar', 'phone-portrait-outline'],
            ['Flex On', 'git-merge-outline'],
            ['Konektor Cas', 'flash-outline'],
            ['LCD', 'tablet-landscape-outline'],
            ['Baterai', 'battery-half-outline'],
            ['Casing', 'shield-outline'],
            ['IC', 'hardware-chip-outline'],
            ['Mesin', 'cog-outline'],
            ['Kamera', 'camera-outline'],
            ['Aksesoris', 'pricetag-outline'],
        ];
        for (const [name, icon] of defaults) {
            await database.runAsync('INSERT INTO categories (name, icon) VALUES (?, ?)', [name, icon]);
        }
    }
}

// ─── Category CRUD ─────────────────────────────────
export async function getCategories() {
    const database = await getDatabase();
    return database.getAllAsync('SELECT * FROM categories ORDER BY name');
}

export async function addCategory(name, icon = 'cube-outline') {
    const database = await getDatabase();
    const result = await database.runAsync('INSERT INTO categories (name, icon) VALUES (?, ?)', [name, icon]);
    return result.lastInsertRowId;
}

export async function updateCategory(id, name, icon) {
    const database = await getDatabase();
    await database.runAsync('UPDATE categories SET name = ?, icon = ? WHERE id = ?', [name, icon, id]);
}

export async function deleteCategory(id) {
    const database = await getDatabase();
    await database.runAsync('UPDATE items SET category_id = NULL WHERE category_id = ?', [id]);
    await database.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function getCategoryItemCounts() {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
        'SELECT category_id, COUNT(*) as count FROM items WHERE category_id IS NOT NULL GROUP BY category_id'
    );
    const map = {};
    rows.forEach(r => { map[r.category_id] = r.count; });
    return map;
}

// ─── Item CRUD ──────────────────────────────────────
export async function getItems(search = '', filter = 'all', categoryId = null) {
    const database = await getDatabase();
    let query = 'SELECT items.*, categories.name as category_name FROM items LEFT JOIN categories ON items.category_id = categories.id WHERE 1=1';
    const params = [];

    if (search) {
        const s = search.toLowerCase();
        query += ' AND (LOWER(items.name) LIKE ? OR LOWER(items.sku) LIKE ? OR LOWER(items.custom_id) LIKE ? OR LOWER(categories.name) LIKE ?)';
        params.push(`%${s}%`, `%${s}%`, `%${s}%`, `%${s}%`);
    }
    if (filter === 'low') {
        query += ' AND items.quantity > 0 AND items.quantity <= items.min_stock';
    } else if (filter === 'out') {
        query += ' AND items.quantity = 0';
    } else if (filter === 'in') {
        query += ' AND items.quantity > items.min_stock';
    }
    if (categoryId) {
        query += ' AND items.category_id = ?';
        params.push(categoryId);
    }
    query += ' ORDER BY items.updated_at DESC';
    return database.getAllAsync(query, params);
}

export async function getItemById(id) {
    const database = await getDatabase();
    return database.getFirstAsync(
        'SELECT items.*, categories.name as category_name FROM items LEFT JOIN categories ON items.category_id = categories.id WHERE items.id = ?',
        [id]
    );
}

export async function findItemByName(name, categoryId = null, excludeId = null) {
    const database = await getDatabase();
    let query = 'SELECT * FROM items WHERE LOWER(name) = LOWER(?)';
    const params = [name];
    if (categoryId) {
        query += ' AND category_id = ?';
        params.push(categoryId);
    }
    if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
    }
    return database.getFirstAsync(query, params);
}

export async function addStockToItem(id, additionalQty) {
    const database = await getDatabase();
    await database.runAsync(
        'UPDATE items SET quantity = quantity + ?, updated_at = datetime("now","localtime") WHERE id = ?',
        [additionalQty, id]
    );
    await logActivity(id, 'stock_in', additionalQty, `Tambah stok ${additionalQty} (item duplikat)`);
}

export async function addItem(item) {
    const database = await getDatabase();
    const result = await database.runAsync(
        'INSERT INTO items (name, sku, category_id, price, buy_price, sell_price, quantity, min_stock, description, custom_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [item.name, item.sku || null, item.category_id || null, item.sell_price || 0, item.buy_price || 0, item.sell_price || 0, item.quantity || 0, item.min_stock || 5, item.description || '', item.custom_id || null]
    );
    await logActivity(result.lastInsertRowId, 'stock_in', item.quantity || 0, 'Item baru ditambahkan');
    return result.lastInsertRowId;
}

export async function updateItem(id, item) {
    const database = await getDatabase();
    const old = await database.getFirstAsync('SELECT quantity FROM items WHERE id = ?', [id]);
    await database.runAsync(
        'UPDATE items SET name = ?, sku = ?, category_id = ?, price = ?, buy_price = ?, sell_price = ?, quantity = ?, min_stock = ?, description = ?, custom_id = ?, updated_at = datetime("now","localtime") WHERE id = ?',
        [item.name, item.sku || null, item.category_id || null, item.sell_price || 0, item.buy_price || 0, item.sell_price || 0, item.quantity || 0, item.min_stock || 5, item.description || '', item.custom_id || null, id]
    );
    const diff = (item.quantity || 0) - (old?.quantity || 0);
    if (diff !== 0) {
        await logActivity(id, diff > 0 ? 'stock_in' : 'stock_out', Math.abs(diff), 'Stok diperbarui');
    }
}

export async function deleteItem(id) {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM items WHERE id = ?', [id]);
    await logActivity(id, 'delete', 0, 'Item dihapus');
}

// ─── Statistics ─────────────────────────────────────
export async function getStats() {
    const database = await getDatabase();
    const total = await database.getFirstAsync('SELECT COUNT(*) as count FROM items');
    const value = await database.getFirstAsync('SELECT COALESCE(SUM(buy_price * quantity), 0) as total FROM items');
    const low = await database.getFirstAsync('SELECT COUNT(*) as count FROM items WHERE quantity > 0 AND quantity <= min_stock');
    const out = await database.getFirstAsync('SELECT COUNT(*) as count FROM items WHERE quantity = 0');
    const inStock = await database.getFirstAsync('SELECT COUNT(*) as count FROM items WHERE quantity > min_stock');
    return {
        totalItems: total.count,
        totalValue: value.total,
        lowStock: low.count,
        outOfStock: out.count,
        inStock: inStock.count,
    };
}

export async function getLowStockItems() {
    const database = await getDatabase();
    return database.getAllAsync(
        'SELECT items.*, categories.name as category_name FROM items LEFT JOIN categories ON items.category_id = categories.id WHERE items.quantity <= items.min_stock ORDER BY items.quantity ASC LIMIT 20'
    );
}

// ─── Activities ─────────────────────────────────────
export async function logActivity(itemId, type, quantityChange, note, fileName = null, status = 'success') {
    const database = await getDatabase();
    await database.runAsync(
        'INSERT INTO activities (item_id, type, quantity_change, note, file_name, status) VALUES (?, ?, ?, ?, ?, ?)',
        [itemId, type, quantityChange, note, fileName, status]
    );
}

export async function getActivities(limit = 20) {
    const database = await getDatabase();
    return database.getAllAsync(
        `SELECT activities.*, items.name as item_name
     FROM activities
     LEFT JOIN items ON activities.item_id = items.id
     ORDER BY activities.created_at DESC
     LIMIT ?`,
        [limit]
    );
}

// ─── Bulk import helper ─────────────────────────────
export async function bulkInsertItems(rows) {
    const database = await getDatabase();
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
        if (!row.name || !row.name.trim()) { skipped++; continue; }

        // Resolve category
        let catId = null;
        if (row.category) {
            const cat = await database.getFirstAsync('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [row.category]);
            if (cat) catId = cat.id;
        }

        const itemName = row.name.trim();
        const qty = parseInt(row.quantity) || 0;
        const buyPrice = parseFloat(row.buy_price) || 0;
        const sellPrice = parseFloat(row.sell_price || row.price) || 0;

        // Check for existing item (case-insensitive)
        const existing = await database.getFirstAsync(
            'SELECT id, quantity FROM items WHERE LOWER(name) = LOWER(?)',
            [itemName]
        );

        if (existing) {
            // Update: add stock + update prices if provided
            await database.runAsync(
                'UPDATE items SET quantity = quantity + ?, buy_price = CASE WHEN ? > 0 THEN ? ELSE buy_price END, sell_price = CASE WHEN ? > 0 THEN ? ELSE sell_price END, price = CASE WHEN ? > 0 THEN ? ELSE price END, updated_at = datetime("now","localtime") WHERE id = ?',
                [qty, buyPrice, buyPrice, sellPrice, sellPrice, sellPrice, sellPrice, existing.id]
            );
            if (qty > 0) {
                await logActivity(existing.id, 'stock_in', qty, `Import: tambah stok ${qty} (total: ${existing.quantity + qty})`);
            }
            updated++;
        } else {
            // Insert new item
            await database.runAsync(
                'INSERT INTO items (name, sku, category_id, price, buy_price, sell_price, quantity, min_stock, description, custom_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [itemName, row.sku || null, catId, sellPrice, buyPrice, sellPrice, qty, parseInt(row.min_stock) || 5, row.description || '', row.custom_id || null]
            );
            inserted++;
        }
    }
    return { inserted, updated, skipped, total: inserted + updated };
}

// ─── Export helper ──────────────────────────────────
export async function getAllItemsForExport() {
    const database = await getDatabase();
    return database.getAllAsync(
        'SELECT items.*, categories.name as category_name FROM items LEFT JOIN categories ON items.category_id = categories.id ORDER BY items.name'
    );
}
