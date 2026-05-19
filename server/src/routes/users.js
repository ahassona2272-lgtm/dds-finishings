const express = require('express');
const db = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const users = db.prepare('SELECT id, email, name, role, phone, avatar, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// Get users by role
router.get('/role/:role', authenticateToken, (req, res) => {
  const users = db.prepare('SELECT id, name, email, phone FROM users WHERE role = ?').all(req.params.role);
  res.json(users);
});

// Get single user
router.get('/:id', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, phone, avatar FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }
  res.json(user);
});

// Update user
router.put('/:id', authenticateToken, (req, res) => {
  const { name, phone, role } = req.body;
  
  // Only admin can change roles
  if (role && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'فقط المدير يمكنه تغيير الصلاحيات' });
  }

  db.prepare(`
    UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), role = COALESCE(?, role), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, phone, role, req.params.id);

  res.json({ message: 'تم تحديث بيانات المستخدم بنجاح' });
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'لا يمكنك حذف حسابك بنفسك' });
  }
  
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'تم حذف المستخدم بنجاح' });
});

module.exports = router;