const express = require('express');
const db = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for design files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/designs'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Ensure uploads directory exists
const fs = require('fs');
const designsDir = path.join(__dirname, '../../uploads/designs');
if (!fs.existsSync(designsDir)) {
  fs.mkdirSync(designsDir, { recursive: true });
}

// Get design tasks
router.get('/tasks', authenticateToken, (req, res) => {
  const { project_id, status } = req.query;
  
  let query = `
    SELECT dt.*, p.name as project_name, u.name as assigned_to_name,
           c.name as client_name
    FROM design_tasks dt
    LEFT JOIN projects p ON dt.project_id = p.id
    LEFT JOIN users u ON dt.assigned_to = u.id
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) {
    query += ' AND dt.project_id = ?';
    params.push(project_id);
  }
  if (status) {
    query += ' AND dt.status = ?';
    params.push(status);
  }

  // Filter by role - designers see only their tasks
  if (req.user.role === 'design') {
    query += ' AND dt.assigned_to = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY dt.created_at DESC';
  
  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});

// Get single design task
router.get('/tasks/:id', authenticateToken, (req, res) => {
  const task = db.prepare(`
    SELECT dt.*, p.name as project_name, p.client_id, c.name as client_name,
           c.phone as client_phone, u.name as assigned_to_name
    FROM design_tasks dt
    LEFT JOIN projects p ON dt.project_id = p.id
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN users u ON dt.assigned_to = u.id
    WHERE dt.id = ?
  `).get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'المهمة غير موجودة' });
  }
  res.json(task);
});

// Create design task
router.post('/tasks', authenticateToken, authorizeRoles('admin', 'design'), (req, res) => {
  const { project_id, assigned_to, title, description, deadline } = req.body;
  
  if (!project_id || !assigned_to || !title) {
    return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO design_tasks (id, project_id, assigned_to, title, description, deadline)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, project_id, assigned_to, title, description || null, deadline || null);

  // Notify assigned designer
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, link)
    VALUES (?, ?, 'مهمة تصميم جديدة', ?, ?)
  `).run(uuidv4(), assigned_to, `تم إسناد مهمة جديدة: ${title}`, `/design/tasks/${id}`);

  res.status(201).json({ id, message: 'تم إنشاء المهمة بنجاح' });
});

// Update design task
router.put('/tasks/:id', authenticateToken, (req, res) => {
  const { status, file_url, description, deadline } = req.body;
  
  db.prepare(`
    UPDATE design_tasks SET 
      status = COALESCE(?, status),
      file_url = COALESCE(?, file_url),
      description = COALESCE(?, description),
      deadline = COALESCE(?, deadline),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, file_url, description, deadline, req.params.id);

  // Notify client if design is approved
  if (status === 'approved') {
    const task = db.prepare('SELECT project_id FROM design_tasks WHERE id = ?').get(req.params.id);
    const client = db.prepare('SELECT id FROM clients c JOIN projects p ON c.id = p.client_id WHERE p.id = ?').get(task.project_id);
    if (client) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, link)
        VALUES (?, ?, 'تم اعتماد التصميم', ?, ?)
      `).run(uuidv4(), client.id, 'تم اعتماد التصميم الجديد، يرجى المراجعة', `/projects/${task.project_id}`);
    }
  }

  res.json({ message: 'تم تحديث المهمة بنجاح' });
});

// Upload design file
router.post('/tasks/:id/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'يرجى اختيار ملف للرفع' });
  }

  const fileUrl = `/uploads/designs/${req.file.filename}`;
  db.prepare('UPDATE design_tasks SET file_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(fileUrl, req.params.id);

  res.json({ file_url: fileUrl, message: 'تم رفع الملف بنجاح' });
});

// Delete design task
router.delete('/tasks/:id', authenticateToken, authorizeRoles('admin', 'design'), (req, res) => {
  db.prepare('DELETE FROM design_tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'تم حذف المهمة بنجاح' });
});

// Get designers
router.get('/designers', authenticateToken, authorizeRoles('admin', 'design'), (req, res) => {
  const designers = db.prepare("SELECT id, name, email FROM users WHERE role = 'design'").all();
  res.json(designers);
});

module.exports = router;