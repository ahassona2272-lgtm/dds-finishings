const express = require('express');
const db = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get all projects
router.get('/', authenticateToken, (req, res) => {
  const { status, client_id, search } = req.query;
  
  let query = `
    SELECT p.*, c.name as client_name, c.phone as client_phone,
           u.name as assigned_name
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN users u ON p.assigned_to = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND p.status = ?';
    params.push(status);
  }
  if (client_id) {
    query += ' AND p.client_id = ?';
    params.push(client_id);
  }
  if (search) {
    query += ' AND (p.name LIKE ? OR c.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY p.created_at DESC';
  
  const projects = db.prepare(query).all(...params);
  res.json(projects);
});

// Get single project with all details
router.get('/:id', authenticateToken, (req, res) => {
  const project = db.prepare(`
    SELECT p.*, c.name as client_name, c.phone as client_phone, c.email as client_email,
           c.address as client_address
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'المشروع غير موجود' });
  }

  // Get design tasks
  const designTasks = db.prepare(`
    SELECT dt.*, u.name as assigned_to_name
    FROM design_tasks dt
    LEFT JOIN users u ON dt.assigned_to = u.id
    WHERE dt.project_id = ?
    ORDER BY dt.created_at DESC
  `).all(req.params.id);

  // Get site reports
  const siteReports = db.prepare(`
    SELECT sr.*, u.name as created_by_name
    FROM site_reports sr
    LEFT JOIN users u ON sr.created_by = u.id
    WHERE sr.project_id = ?
    ORDER BY sr.created_at DESC
  `).all(req.params.id);

  // Get payments
  const payments = db.prepare(`
    SELECT py.*, u.name as created_by_name
    FROM payments py
    LEFT JOIN users u ON py.created_by = u.id
    WHERE py.project_id = ?
    ORDER BY py.date DESC
  `).all(req.params.id);

  // Get purchases
  const purchases = db.prepare(`
    SELECT pch.*, u.name as created_by_name
    FROM purchases pch
    LEFT JOIN users u ON pch.created_by = u.id
    WHERE pch.project_id = ?
    ORDER BY pch.created_at DESC
  `).all(req.params.id);

  // Get site images
  const siteImages = db.prepare(`
    SELECT si.*, u.name as uploaded_by_name
    FROM site_images si
    LEFT JOIN users u ON si.uploaded_by = u.id
    WHERE si.project_id = ?
    ORDER BY si.created_at DESC
  `).all(req.params.id);

  // Get contract
  const contract = db.prepare('SELECT * FROM contracts WHERE project_id = ?').get(req.params.id);

  res.json({
    ...project,
    designTasks,
    siteReports,
    payments,
    purchases,
    siteImages,
    contract
  });
});

// Create project
router.post('/', authenticateToken, authorizeRoles('admin', 'sales', 'pricing'), (req, res) => {
  const { name, client_id, unit_type, unit_area, unit_number, address, start_date, end_date } = req.body;
  
  if (!name || !client_id) {
    return res.status(400).json({ error: 'يرجى إدخال اسم المشروع واسم العميل' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO projects (id, name, client_id, unit_type, unit_area, unit_number, address, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, client_id, unit_type || null, unit_area || null, unit_number || null, address || null, start_date || null, end_date || null);

  // Notify design team
  const designUsers = db.prepare("SELECT id FROM users WHERE role = 'design'").all();
  designUsers.forEach(user => {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, link)
      VALUES (?, ?, 'مشروع جديد', ?, ?)
    `).run(uuidv4(), user.id, `تم إضافة مشروع جديد: ${name}`, `/projects/${id}`);
  });

  res.status(201).json({ id, message: 'تم إنشاء المشروع بنجاح' });
});

// Update project
router.put('/:id', authenticateToken, (req, res) => {
  const { name, status, unit_type, unit_area, unit_number, address, start_date, end_date, total_value } = req.body;
  
  db.prepare(`
    UPDATE projects SET 
      name = COALESCE(?, name),
      status = COALESCE(?, status),
      unit_type = COALESCE(?, unit_type),
      unit_area = COALESCE(?, unit_area),
      unit_number = COALESCE(?, unit_number),
      address = COALESCE(?, address),
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      total_value = COALESCE(?, total_value),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, status, unit_type, unit_area, unit_number, address, start_date, end_date, total_value, req.params.id);

  res.json({ message: 'تم تحديث المشروع بنجاح' });
});

// Delete project (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  // Check for related records
  db.prepare('DELETE FROM design_tasks WHERE project_id = ?').run(req.params.id);
  db.prepare('DELETE FROM site_reports WHERE project_id = ?').run(req.params.id);
  db.prepare('DELETE FROM payments WHERE project_id = ?').run(req.params.id);
  db.prepare('DELETE FROM site_images WHERE project_id = ?').run(req.params.id);
  db.prepare('DELETE FROM contracts WHERE project_id = ?').run(req.params.id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  
  res.json({ message: 'تم حذف المشروع بنجاح' });
});

module.exports = router;