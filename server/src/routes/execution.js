const express = require('express');
const db = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for site images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/site');
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
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Get site reports
router.get('/reports', authenticateToken, (req, res) => {
  const { project_id, status } = req.query;
  
  let query = `
    SELECT sr.*, p.name as project_name, u.name as created_by_name
    FROM site_reports sr
    LEFT JOIN projects p ON sr.project_id = p.id
    LEFT JOIN users u ON sr.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) {
    query += ' AND sr.project_id = ?';
    params.push(project_id);
  }
  if (status) {
    query += ' AND sr.status = ?';
    params.push(status);
  }

  query += ' ORDER BY sr.created_at DESC';
  
  const reports = db.prepare(query).all(...params);
  res.json(reports);
});

// Get single report
router.get('/reports/:id', authenticateToken, (req, res) => {
  const report = db.prepare(`
    SELECT sr.*, p.name as project_name, p.client_id, u.name as created_by_name
    FROM site_reports sr
    LEFT JOIN projects p ON sr.project_id = p.id
    LEFT JOIN users u ON sr.created_by = u.id
    WHERE sr.id = ?
  `).get(req.params.id);

  if (!report) {
    return res.status(404).json({ error: 'التقرير غير موجود' });
  }
  res.json(report);
});

// Create site report
router.post('/reports', authenticateToken, authorizeRoles('admin', 'execution'), (req, res) => {
  const { project_id, title, description } = req.body;
  
  if (!project_id || !title) {
    return res.status(400).json({ error: 'يرجى إدخال عنوان المشروع والعنوان' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO site_reports (id, project_id, created_by, title, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, project_id, req.user.id, title, description || null);

  res.status(201).json({ id, message: 'تم إنشاء التقرير بنجاح' });
});

// Update report
router.put('/reports/:id', authenticateToken, (req, res) => {
  const { status, description, images } = req.body;
  
  db.prepare(`
    UPDATE site_reports SET 
      status = COALESCE(?, status),
      description = COALESCE(?, description),
      images = COALESCE(?, images),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, description, images, req.params.id);

  res.json({ message: 'تم تحديث التقرير بنجاح' });
});

// Upload images to report
router.post('/reports/:id/images', authenticateToken, upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'يرجى اختيار صور للرفع' });
  }

  const images = req.files.map(f => `/uploads/site/${f.filename}`);
  
  // Update report images
  const report = db.prepare('SELECT images FROM site_reports WHERE id = ?').get(req.params.id);
  const existingImages = report.images ? JSON.parse(report.images) : [];
  const allImages = [...existingImages, ...images];
  
  db.prepare('UPDATE site_reports SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(JSON.stringify(allImages), req.params.id);

  res.json({ images: allImages, message: 'تم رفع الصور بنجاح' });
});

// Upload site images (separate endpoint)
router.post('/images', authenticateToken, authorizeRoles('admin', 'execution'), upload.array('images', 20), (req, res) => {
  const { project_id, description } = req.body;
  
  if (!project_id || !req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'يرجى اختيار مشروع وصور للرفع' });
  }

  const uploadedImages = [];
  req.files.forEach(file => {
    const id = uuidv4();
    const imageUrl = `/uploads/site/${file.filename}`;
    
    db.prepare(`
      INSERT INTO site_images (id, project_id, uploaded_by, image_url, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, project_id, req.user.id, imageUrl, description || null);
    
    uploadedImages.push({ id, image_url: imageUrl });
  });

  // Notify client about new site images
  const project = db.prepare('SELECT client_id FROM projects WHERE id = ?').get(project_id);
  if (project && project.client_id) {
    const clientUser = db.prepare('SELECT id FROM users WHERE id = ?').get(project.client_id);
    if (clientUser) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, link)
        VALUES (?, ?, 'صور جديدة من الموقع', ?, ?)
      `).run(uuidv4(), project.client_id, `تم رفع ${req.files.length} صور جديدة للموقع، يرجى المراجعة`, `/projects/${project_id}`);
    }
  }

  res.json({ images: uploadedImages, message: `تم رفع ${req.files.length} صورة بنجاح` });
});

// Get site images for project
router.get('/images/:projectId', authenticateToken, (req, res) => {
  const images = db.prepare(`
    SELECT si.*, u.name as uploaded_by_name
    FROM site_images si
    LEFT JOIN users u ON si.uploaded_by = u.id
    WHERE si.project_id = ?
    ORDER BY si.created_at DESC
  `).all(req.params.projectId);
  res.json(images);
});

// Get payment requests
router.get('/payment-requests', authenticateToken, authorizeRoles('admin', 'execution', 'accounting'), (req, res) => {
  const { project_id, status } = req.query;
  
  let query = `
    SELECT pr.*, p.name as project_name, u.name as created_by_name
    FROM payment_requests pr
    LEFT JOIN projects p ON pr.project_id = p.id
    LEFT JOIN users u ON pr.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) {
    query += ' AND pr.project_id = ?';
    params.push(project_id);
  }
  if (status) {
    query += ' AND pr.status = ?';
    params.push(status);
  }

  query += ' ORDER BY pr.created_at DESC';
  
  const requests = db.prepare(query).all(...params);
  res.json(requests);
});

// Create payment request
router.post('/payment-requests', authenticateToken, authorizeRoles('admin', 'execution'), (req, res) => {
  const { project_id, amount, reason, notes } = req.body;
  
  if (!project_id || !amount || !reason) {
    return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO payment_requests (id, project_id, created_by, amount, reason, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, project_id, req.user.id, amount, reason, notes || null);

  // Notify accounting
  const accountingUsers = db.prepare("SELECT id FROM users WHERE role = 'accounting'").all();
  accountingUsers.forEach(user => {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, link)
      VALUES (?, ?, 'طلب صرف جديد', ?, ?)
    `).run(uuidv4(), user.id, `طلب صرف جديد بقيمة ${amount} ج.م للمشروع`, `/execution/payment-requests`);
  });

  res.status(201).json({ id, message: 'تم إنشاء طلب الصرف بنجاح' });
});

// Update payment request
router.put('/payment-requests/:id', authenticateToken, authorizeRoles('admin', 'accounting'), (req, res) => {
  const { status, notes } = req.body;
  
  db.prepare(`
    UPDATE payment_requests SET 
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, notes, req.params.id);

  // Notify requester
  const request = db.prepare('SELECT created_by FROM payment_requests WHERE id = ?').get(req.params.id);
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message)
    VALUES (?, ?, 'تم تحديث طلب الصرف', ?)
  `).run(uuidv4(), request.created_by, `تم ${status === 'approved' ? 'الموافقة' : status === 'rejected' ? 'رفض' : 'تحديث'} طلب الصرف`);

  res.json({ message: 'تم تحديث طلب الصرف بنجاح' });
});

module.exports = router;