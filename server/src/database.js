const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initDatabase() {
  // Users table (all departments and clients)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'design', 'execution', 'pricing', 'purchasing', 'accounting', 'sales', 'client')),
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      address TEXT,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_id TEXT NOT NULL,
      unit_type TEXT,
      unit_area REAL,
      unit_number TEXT,
      address TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'survey', 'design', 'pricing', 'contract', 'execution', 'finished', 'cancelled')),
      start_date DATE,
      end_date DATE,
      total_value REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // Design tasks
  db.exec(`
    CREATE TABLE IF NOT EXISTS design_tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      assigned_to TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'review', 'approved', 'rejected')),
      file_url TEXT,
      deadline DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
  `);

  // Site reports
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_reports (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'rejected')),
      images TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Payment requests (from execution to accounting)
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'paid')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Contracts
  db.exec(`
    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      contract_number TEXT UNIQUE,
      value REAL NOT NULL,
      terms TEXT,
      file_url TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'signed', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // Payments (from accounting)
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('installment', 'expense', 'refund')),
      amount REAL NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      created_by TEXT NOT NULL,
      receipt_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Purchases
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      item_name TEXT NOT NULL,
      quantity REAL,
      unit TEXT,
      unit_price REAL,
      total_price REAL,
      supplier TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'ordered', 'received', 'cancelled')),
      created_by TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT,
      project_id TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // Site images
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_images (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      image_url TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // Notifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Activity log
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('Database initialized successfully');
}

// Seed initial admin user
function seedAdminUser() {
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@dds.com');
  
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, email, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), 'admin@dds.com', hashedPassword, 'مدير النظام', 'admin');
    console.log('Admin user created: admin@dds.com / admin123');
  }
}

// Initialize
initDatabase();
seedAdminUser();

module.exports = db;