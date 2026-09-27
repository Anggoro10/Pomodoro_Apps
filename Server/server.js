require('dotenv').config(); // Paling atas
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const focusRoutes = require('./src/routes/focusRoutes');
const settingRoutes = require('./src/routes/settingRoutes');
const statRoutes = require('./src/routes/statRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');
const rewardRoutes = require('./src/routes/rewardRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// 1. Security Middlewares
app.use(helmet()); // Proteksi header HTTP
app.use(cors());   // Izinkan request dari Frontend/Client
app.use(express.json()); // Parsing body JSON

// 2. Rate Limiting (Maksimal 100 request per 15 menit per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.',
  },
});
app.use('/api/', limiter);

// 3. Ping Endpoint
app.get('/api/ping', (req, res) => {
  res.status(200).json({ success: true, message: 'PONG' });
});

// 4. API V1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/focus', focusRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/stats', statRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1', sessionRoutes);
app.use('/api/v1/rewards', rewardRoutes);

// 5. Global Error Handling Middleware
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

app.listen(PORT, () => {
  console.log(`🚀 Server ChronoFocused Enterprise berjalan di port ${PORT}`);
});