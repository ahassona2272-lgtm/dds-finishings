const express = require('express');
const db = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for receipts
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/receipts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Get payments
router.get('/payments', authenticateToken, authorizeRoles('admin', 'accounting'), (req, res) => {
  const { project_id, type, start_date, end_date } = req.query;
  
  let query = `
    SELECT py.*, p.name as project_name, u.name as created_by_name
    FROM payments py
    LEFT JOIN projects p ON py.project_id = p.id
    LEFT JOIN users u ON py.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) {
    query += ' AND py.project_id = ?';
    params.push(project_id);
  }
  if (type) {
    query += ' AND py.type = ?';
    params.push(type);
  }
  if (start_date) {
    query += ' AND py.date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND py.date <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY py.date DESC';
  
  const payments = db.prepare(query).all(...params);
  res.json(payments);
});

// Get payment summary
router.get('/summary', authenticateToken, authorizeRoles('admin', 'accounting'), (req, res) => {
  const totalReceived = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE type = 'installment'").get();
  const totalExpenses = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE type = 'expense'").get();
  const pendingPayments = db.prepare("SELECT COUNT(*) as count FROM payment_requests WHERE status = 'pending'").get();
  const pendingAmount = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_requests WHERE status = 'pending'").get();

  res.json({
    totalReceived: totalReceived.total,
    totalExpenses: totalExpenses.total,
    pendingPayments: pendingPayments.count,
    pendingAmount: pendingAmount.total,
    balance: totalReceived.total - totalExpenses.total
  });
});

// Create payment
router.post('/payments', authenticateToken, authorizeRoles('admin', 'accounting'), (req, res) => {
  const { project_id, type, amount, description, date, receipt } = req.body;
  
  if (!project_id || !type || !amount || !date) {
    return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO payments (id, project_id, type, amount, description, date, created_by, receipt_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, project_id, type, amount, description || null, date, req.user.id, receipt || null);

  res.status(201).json({ id, message: 'تم تسجيل الدفع بنجاح' });
});

// Update payment
router.put('/payments/:id', authenticateToken, authorizeRoles('admin', 'accounting'), (req, res) => {
  const { amount, description, date, type } = req.body;
  
  db.prepare(`
    UPDATE payments SET 
      amount = COALESCE(?, amount),
      description = COALESCE(?, description),
      date = COALESCE(?, date),
      type = COALESCE(?, type)
    WHERE id = ?
  `).run(amount, description, date, type, req.params.id);

  res.json({ message: 'تم تحديث الدفع بنجاح' });
});

// Upload receipt
router.post('/payments/:id/receipt', authenticateToken, upload.single('receipt'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'يرجى اختيار ملف' });
  }

  const receiptUrl = `/uploads/receipts/${req.file.filename}`;
  db.prepare('UPDATE payments SET receipt_url = ? WHERE id = ?')
    .run(receiptUrl, req.params.id);

  res.json({ receipt_url: receiptUrl, message: 'تم رفع الإيصال بنجاح' });
});

// Delete payment
router.delete('/payments/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  res.json({ message: 'تم حذف الدفع بنجاح' });
});

// Contracts management
router.get('/contracts', authenticateToken, authorizeRoles('admin', 'accounting', 'pricing'), (req, res) => {
  const contracts = db.prepare(`
    SELECT c.*, p.name as project_name, p.total_value
    FROM contracts c
    LEFT JOIN projects p ON c.project_id = p.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(contracts);
});

// Get single contract
router.get('/contracts/:id', authenticateToken, (req, res) => {
  const contract = db.prepare(`
    SELECT c.*, p.name as project_name, p.client_id
    FROM contracts c
    LEFT JOIN projects p ON c.project_id = p.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!contract) {
    return res.status(404).json({ error: 'العقد غير موجود' });
  }
  res.json(contract);
});

// Create contract
router.post('/contracts', authenticateToken, authorizeRoles('admin', 'accounting', 'pricing'), (req, res) => {
  const { project_id, contract_number, value, terms } = req.body;
  
  if (!project_id || !value) {
    return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO contracts (id, project_id, contract_number, value, terms)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, project_id, contract_number || null, value, terms || null);

  // Update project value
  db.prepare('UPDATE projects SET total_value = ? WHERE id = ?').run(value, project_id);

  res.status(201).json({ id, message: 'تم إنشاء العقد بنجاح' });
});

// Update contract
router.put('/contracts/:id', authenticateToken, (req, res) => {
  const { status, terms, value } = req.body;
  
  db.prepare(`
    UPDATE contracts SET 
      status = COALESCE(?, status),
      terms = COALESCE(?, terms),
      value = COALESCE(?, value),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, terms, value, req.params.id);

  res.json({ message: 'تم تحديث العقد بنجاح' });
});

// Delete contract
router.delete('/contracts/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.prepare('DELETE FROM contracts WHERE id = ?').run(req.params.id);
  res.json({ message: 'تم حذف العقد بنجاح' });
});

module.exports = router;