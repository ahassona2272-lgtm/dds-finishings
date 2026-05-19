const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get conversations (unique project conversations)
router.get('/conversations', authenticateToken, (req, res) => {
  let query;
  const params = [req.user.id];

  if (req.user.role === 'client') {
    // Clients see their own conversations
    query = `
      SELECT DISTINCT m.project_id, p.name as project_name, c.name as client_name,
             (SELECT message FROM messages WHERE project_id = m.project_id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM messages WHERE project_id = m.project_id ORDER BY created_at DESC LIMIT 1) as last_time,
             (SELECT COUNT(*) FROM messages WHERE project_id = m.project_id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM messages m
      LEFT JOIN projects p ON m.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE m.project_id IS NOT NULL AND p.client_id = (SELECT id FROM clients WHERE id = (SELECT id FROM users WHERE id = ?))
      ORDER BY last_time DESC
    `;
  } else {
    // Staff see all conversations related to their role
    query = `
      SELECT DISTINCT m.project_id, p.name as project_name, c.name as client_name,
             (SELECT message FROM messages WHERE project_id = m.project_id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM messages WHERE project_id = m.project_id ORDER BY created_at DESC LIMIT 1) as last_time,
             (SELECT COUNT(*) FROM messages WHERE project_id = m.project_id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM messages m
      LEFT JOIN projects p ON m.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE m.project_id IS NOT NULL
      ORDER BY last_time DESC
    `;
  }

  const conversations = db.prepare(query).all(...params);
  res.json(conversations);
});

// Get messages for a project
router.get('/project/:projectId', authenticateToken, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.role as sender_role
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.project_id = ?
    ORDER BY m.created_at ASC
  `).all(req.params.projectId);

  // Mark as read
  db.prepare('UPDATE messages SET is_read = 1 WHERE project_id = ? AND receiver_id = ?')
    .run(req.params.projectId, req.user.id);

  res.json(messages);
});

// Get direct messages with a user
router.get('/user/:userId', authenticateToken, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.role as sender_role
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC
  `).all(req.user.id, req.params.userId, req.params.userId, req.user.id);

  // Mark as read
  db.prepare('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?')
    .run(req.params.userId, req.user.id);

  res.json(messages);
});

// Send message
router.post('/', authenticateToken, (req, res) => {
  const { receiver_id, project_id, message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'يرجى كتابة رسالة' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO messages (id, sender_id, receiver_id, project_id, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.user.id, receiver_id || null, project_id || null, message);

  // Create notification for receiver
  if (receiver_id) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, link)
      VALUES (?, ?, 'رسالة جديدة', ?, ?)
    `).run(uuidv4(), receiver_id, `رسالة جديدة من ${req.user.name}`, project_id ? `/messages/project/${project_id}` : `/messages/user/${req.user.id}`);
  }

  const newMessage = db.prepare(`
    SELECT m.*, u.name as sender_name, u.role as sender_role
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(id);

  res.status(201).json(newMessage);
});

// Get contacts (users for direct messaging)
router.get('/contacts', authenticateToken, (req, res) => {
  const contacts = db.prepare(`
    SELECT id, name, email, role FROM users WHERE id != ?
    ORDER BY role, name
  `).all(req.user.id);
  res.json(contacts);
});

module.exports = router;