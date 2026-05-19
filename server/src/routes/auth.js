const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  
  if (!user) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Log activity
  db.prepare(`
    INSERT INTO activity_log (id, user_id, action, entity_type, details)
    VALUES (?, ?, 'login', 'user', ?)
  `).run(require('uuid').v4(), user.id, JSON.stringify({ ip: req.ip }));

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    }
  });
});

// Register (admin only)
router.post('/register', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'فقط المدير يمكنه إنشاء مستخدمين جدد' });
  }

  const { email, password, name, role, phone } = req.body;
  
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(400).json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const { v4: uuidv4 } = require('uuid');
  
  try {
    db.prepare(`
      INSERT INTO users (id, email, password, name, role, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), email, hashedPassword, name, role, phone || null);

    res.status(201).json({ message: 'تم إنشاء المستخدم بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء المستخدم' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, phone, avatar FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }
  res.json(user);
});

// Change password
router.post('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
  
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(hashedPassword, req.user.id);

  res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
});

// Logout (just for logging)
router.post('/logout', authenticateToken, (req, res) => {
  db.prepare(`
    INSERT INTO activity_log (id, user_id, action, entity_type, details)
    VALUES (?, ?, 'logout', 'user', ?)
  `).run(require('uuid').v4(), req.user.id, JSON.stringify({}));

  res.json({ message: 'تم تسجيل الخروج بنجاح' });
});

module.exports = router;