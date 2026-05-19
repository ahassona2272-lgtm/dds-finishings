require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');
const designRoutes = require('./routes/design');
const executionRoutes = require('./routes/execution');
const accountingRoutes = require('./routes/accounting');
const purchasingRoutes = require('./routes/purchasing');
const messagingRoutes = require('./routes/messaging');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/design', designRoutes);
app.use('/api/execution', executionRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/purchasing', purchasingRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'حدث خطأ، حاول مرة أخرى' });
});

app.listen(PORT, () => {
  console.log(`DDS Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;