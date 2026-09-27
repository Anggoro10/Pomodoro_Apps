const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET tidak diatur di environment.');
    }
    const decoded = jwt.verify(token, secret);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Verify Token Error:', error.message); // Log error asli di terminal
    return res.status(403).json({
      success: false,
      message: 'Token tidak valid atau sudah kadaluarsa.',
    });
  }
};

module.exports = verifyToken;