import initSqlJs, { Database as SqlJsDatabase, SqlValue } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { config } from './config';

// Database instance (will be initialized asynchronously)
let db: SqlJsDatabase | null = null;

// Ensure data directory exists
const dataDir = path.dirname(config.dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Save database to file
function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(config.dbPath, buffer);
  }
}

// Initialize database
export async function initializeDatabase(): Promise<void> {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(config.dbPath)) {
    const fileBuffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Initialize schema
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT CHECK(role IN ('ADMIN', 'LIBRARIAN', 'MEMBER')) NOT NULL DEFAULT 'MEMBER',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn TEXT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT,
      categories TEXT,
      total_copies INTEGER NOT NULL DEFAULT 1,
      available_copies INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_at DATETIME NOT NULL,
      returned_at DATETIME,
      status TEXT CHECK(status IN ('ISSUED', 'RETURNED', 'OVERDUE')) NOT NULL DEFAULT 'ISSUED',
      renew_count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT CHECK(status IN ('ACTIVE', 'FULFILLED', 'CANCELLED')) NOT NULL DEFAULT 'ACTIVE',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      channel TEXT DEFAULT 'email',
      payload TEXT,
      scheduled_for DATETIME,
      sent_at DATETIME,
      status TEXT CHECK(status IN ('PENDING', 'SENT', 'FAILED')) NOT NULL DEFAULT 'PENDING',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_loans_book_id ON loans(book_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reservations_book_id ON reservations(book_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_books_title ON books(title)');
  db.run('CREATE INDEX IF NOT EXISTS idx_books_author ON books(author)');

  // Save initial schema
  saveDatabase();

  console.log('Database initialized successfully');
}

// Helper class to provide better-sqlite3-like API
class DatabaseWrapper {
  prepare(sql: string) {
    return {
      run: (...params: SqlValue[]) => {
        if (!db) throw new Error('Database not initialized');
        db.run(sql, params);
        saveDatabase();
        return { 
          changes: db.getRowsModified(),
          lastInsertRowid: (db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] as number) || 0
        };
      },
      get: (...params: SqlValue[]) => {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          stmt.free();
          const row: Record<string, unknown> = {};
          columns.forEach((col, i) => {
            row[col] = values[i];
          });
          return row;
        }
        stmt.free();
        return undefined;
      },
      all: (...params: SqlValue[]) => {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const rows: Record<string, unknown>[] = [];
        const columns = stmt.getColumnNames();
        while (stmt.step()) {
          const values = stmt.get();
          const row: Record<string, unknown> = {};
          columns.forEach((col, i) => {
            row[col] = values[i];
          });
          rows.push(row);
        }
        stmt.free();
        return rows;
      }
    };
  }

  exec(sql: string) {
    if (!db) throw new Error('Database not initialized');
    db.run(sql);
    saveDatabase();
  }

  transaction<T>(fn: () => T): () => T {
    return () => {
      if (!db) throw new Error('Database not initialized');
      db.run('BEGIN TRANSACTION');
      try {
        const result = fn();
        db.run('COMMIT');
        saveDatabase();
        return result;
      } catch (error) {
        db.run('ROLLBACK');
        throw error;
      }
    };
  }
}

// Export a wrapper that provides better-sqlite3-like synchronous API
export default new DatabaseWrapper();
