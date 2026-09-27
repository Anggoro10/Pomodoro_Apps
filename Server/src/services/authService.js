const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

class AuthService {
  async register(email, password) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new Error('Email sudah terdaftar.');
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        userId: true,
        email: true,
        createdAt: true,
      },
    });

    return newUser;
  }

  // Pastikan menerima (email, password) secara terpisah
  async login(email, password) {
    if (!email || !password) {
      const error = new Error('Email dan password wajib diisi.');
      error.statusCode = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new Error('Email atau password salah.');
      error.statusCode = 401;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const error = new Error('Email atau password salah.');
      error.statusCode = 401;
      throw error;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET tidak diatur di environment.');
    }
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return {
      user: {
        userId: user.userId,
        email: user.email,
      },
      token,
    };
  }
}

module.exports = new AuthService();