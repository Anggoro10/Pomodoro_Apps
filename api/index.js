require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('../Server/src/routes/authRoutes');
const taskRoutes = require('../Server/src/routes/taskRoutes');
const focusRoutes = require('../Server/src/routes/focusRoutes');
const settingRoutes = require('../Server/src/routes/settingRoutes');
const statRoutes = require('../Server/src/routes/statRoutes');
const categoryRoutes = require('../Server/src/routes/categoryRoutes');
const sessionRoutes = require('../Server/src/routes/sessionRoutes');
const rewardRoutes = require('../Server/src/routes/rewardRoutes');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.',
  },
});
app.use('/api/', limiter);

app.get('/api/ping', (req, res) => {
  res.status(200).json({ success: true, message: 'PONG' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/focus', focusRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/stats', statRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1', sessionRoutes);
app.use('/api/v1/rewards', rewardRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server.',
  });
});

app.get('/api/v1/ping', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Pong! Server Express ChronoFocused siap digunakan.',
  });
});

module.exports = app;