const express = require('express');
const db = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticateToken, (req, res) => {
  // Projects count by status
  const projectsByStatus = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM projects 
    GROUP BY status
  `).all();

  // Total projects
  const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get();

  // Total clients
  const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get();

  // Total revenue (from contracts)
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(value), 0) as total FROM contracts WHERE status != "cancelled"').get();

  // Recent projects
  const recentProjects = db.prepare(`
    SELECT p.*, c.name as client_name
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    ORDER BY p.created_at DESC
    LIMIT 5
  `).all();

  // Pending tasks (design)
  const pendingDesignTasks = db.prepare("SELECT COUNT(*) as count FROM design_tasks WHERE status IN ('pending', 'in_progress')").get();

  // Pending payment requests
  const pendingPayments = db.prepare("SELECT COUNT(*) as count FROM payment_requests WHERE status = 'pending'").get();

  // Site reports this month
  const monthlyReports = db.prepare(`
    SELECT COUNT(*) as count FROM site_reports 
    WHERE created_at >= date('now', 'start of month')
  `).get();

  res.json({
    projectsByStatus,
    totalProjects: totalProjects.count,
    totalClients: totalClients.count,
    totalRevenue: totalRevenue.total,
    recentProjects,
    pendingDesignTasks: pendingDesignTasks.count,
    pendingPayments: pendingPayments.count,
    monthlyReports: monthlyReports.count
  });
});

// Get notifications for current user
router.get('/notifications', authenticateToken, (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(req.user.id);
  res.json(notifications);
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  res.json({ message: 'تم تحديث الإشعار' });
});

// Mark all notifications as read
router.put('/notifications/read-all', authenticateToken, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')
    .run(req.user.id);
  res.json({ message: 'تم تحديث جميع الإشعارات' });
});

// Get activity log
router.get('/activity', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { limit } = req.query;
  const activities = db.prepare(`
    SELECT al.*, u.name as user_name
    FROM activity_log al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(parseInt(limit) || 50);
  res.json(activities);
});

// Quick stats for specific role
router.get('/quick-stats', authenticateToken, (req, res) => {
  const { role } = req.user;
  let stats = {};

  switch (role) {
    case 'design':
      stats = {
        myTasks: db.prepare('SELECT COUNT(*) as count FROM design_tasks WHERE assigned_to = ? AND status != "approved"').get(req.user.id).count,
        pendingReview: db.prepare("SELECT COUNT(*) as count FROM design_tasks WHERE status = 'review'").get().count,
      };
      break;
    case 'execution':
      stats = {
        myReports: db.prepare('SELECT COUNT(*) as count FROM site_reports WHERE created_by = ?').get(req.user.id).count,
        pendingRequests: db.prepare("SELECT COUNT(*) as count FROM payment_requests WHERE created_by = ? AND status = 'pending'").get(req.user.id).count,
      };
      break;
    case 'accounting':
      stats = {
        pendingPayments: db.prepare("SELECT COUNT(*) as count FROM payment_requests WHERE status = 'pending'").get().count,
        totalReceived: db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE type = 'installment'").get().total,
      };
      break;
    case 'client':
      const clientProjects = db.prepare('SELECT id FROM clients WHERE id = ?').get(req.user.id);
      stats = {
        myProjects: clientProjects ? 1 : 0,
      };
      break;
    default:
      stats = {
        totalProjects: db.prepare('SELECT COUNT(*) as count FROM projects').get().count,
      };
  }

  res.json(stats);
});

module.exports = router;