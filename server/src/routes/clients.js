const express = require('express');
const db = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get all clients
router.get('/', authenticateToken, (req, res) => {
  const clients = db.prepare(`
    SELECT c.*, u.name as created_by_name,
           (SELECT COUNT(*) FROM projects WHERE client_id = c.id) as project_count
    FROM clients c
    LEFT JOIN users u ON c.created_by = u.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(clients);
});

// Get single client
router.get('/:id', authenticateToken, (req, res) => {
  const client = db.prepare(`
    SELECT c.*, u.name as created_by_name
    FROM clients c
    LEFT JOIN users u ON c.created_by = u.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  if (!client) {
    return res.status(404).json({ error: 'العميل غير موجود' });
  }

  // Get client projects
  const projects = db.prepare('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC').all(req.params.id);
  
  res.json({ ...client, projects });
});

// Create client
router.post('/', authenticateToken, authorizeRoles('admin', 'sales', 'accounting'), (req, res) => {
  const { name, email, phone, address, notes } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ error: 'يرجى إدخال الاسم ورقم الهاتف' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO clients (id, name, email, phone, address, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, email || null, phone, address || null, notes || null, req.user.id);

  // Create notification for sales team
  const salesUsers = db.prepare("SELECT id FROM users WHERE role = 'sales'").all();
  salesUsers.forEach(user => {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, link)
      VALUES (?, ?, 'عميل جديد', ?, ?)
    `).run(uuidv4(), user.id, `تم إضافة عميل جديد: ${name}`, `/clients/${id}`);
  });

  res.status(201).json({ id, message: 'تم إضافة العميل بنجاح' });
});

// Update client
router.put('/:id', authenticateToken, authorizeRoles('admin', 'sales', 'accounting'), (req, res) => {
  const { name, email, phone, address, notes } = req.body;
  
  db.prepare(`
    UPDATE clients SET 
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      address = COALESCE(?, address),
      notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, email, phone, address, notes, req.params.id);

  res.json({ message: 'تم تحديث بيانات العميل بنجاح' });
});

// Delete client (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects WHERE client_id = ?').get(req.params.id);
  
  if (projectCount.count > 0) {
    return res.status(400).json({ error: 'لا يمكن حذف عميل له مشاريع، احذف المشاريع أولاً' });
  }

  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ message: 'تم حذف العميل بنجاح' });
});

module.exports = router;