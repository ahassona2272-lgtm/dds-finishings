const express = require('express');
const db = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get purchases
router.get('/', authenticateToken, authorizeRoles('admin', 'purchasing'), (req, res) => {
  const { project_id, status, supplier } = req.query;
  
  let query = `
    SELECT pch.*, p.name as project_name, u.name as created_by_name
    FROM purchases pch
    LEFT JOIN projects p ON pch.project_id = p.id
    LEFT JOIN users u ON pch.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) {
    query += ' AND pch.project_id = ?';
    params.push(project_id);
  }
  if (status) {
    query += ' AND pch.status = ?';
    params.push(status);
  }
  if (supplier) {
    query += ' AND pch.supplier LIKE ?';
    params.push(`%${supplier}%`);
  }

  query += ' ORDER BY pch.created_at DESC';
  
  const purchases = db.prepare(query).all(...params);
  res.json(purchases);
});

// Create purchase
router.post('/', authenticateToken, authorizeRoles('admin', 'purchasing'), (req, res) => {
  const { project_id, item_name, quantity, unit, unit_price, supplier, notes } = req.body;
  
  if (!item_name) {
    return res.status(400).json({ error: 'يرجى إدخال اسم الصنف' });
  }

  const total_price = (quantity || 0) * (unit_price || 0);
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO purchases (id, project_id, item_name, quantity, unit, unit_price, total_price, supplier, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, project_id || null, item_name, quantity || null, unit || null, unit_price || null, total_price, supplier || null, notes || null, req.user.id);

  res.status(201).json({ id, message: 'تم إضافة المشتريات بنجاح' });
});

// Update purchase
router.put('/:id', authenticateToken, authorizeRoles('admin', 'purchasing'), (req, res) => {
  const { status, quantity, unit, unit_price, supplier, notes } = req.body;
  
  const purchase = db.prepare('SELECT quantity, unit_price FROM purchases WHERE id = ?').get(req.params.id);
  const newQuantity = quantity || purchase.quantity;
  const newPrice = unit_price || purchase.unit_price;
  const total_price = newQuantity * newPrice;

  db.prepare(`
    UPDATE purchases SET 
      status = COALESCE(?, status),
      quantity = COALESCE(?, quantity),
      unit = COALESCE(?, unit),
      unit_price = COALESCE(?, unit_price),
      total_price = ?,
      supplier = COALESCE(?, supplier),
      notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, quantity, unit, unit_price, total_price, supplier, notes, req.params.id);

  res.json({ message: 'تم تحديث المشتريات بنجاح' });
});

// Delete purchase
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.prepare('DELETE FROM purchases WHERE id = ?').run(req.params.id);
  res.json({ message: 'تم حذف المشتريات بنجاح' });
});

// Get purchase summary
router.get('/summary', authenticateToken, authorizeRoles('admin', 'purchasing'), (req, res) => {
  const pending = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total FROM purchases WHERE status = 'pending'").get();
  const ordered = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total FROM purchases WHERE status = 'ordered'").get();
  const received = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total FROM purchases WHERE status = 'received'").get();

  res.json({ pending, ordered, received });
});

module.exports = router;