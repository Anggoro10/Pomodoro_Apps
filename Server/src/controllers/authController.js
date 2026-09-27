const authService = require('../services/authService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendResetEmail = async (toEmail, resetCode, userName) => {
  // Skip email if SMTP not configured
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpUser || !smtpPass || smtpUser === 'your_email@gmail.com') {
    console.log('SMTP not configured, skipping email send');
    return false;
  }

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ChronoFocused Support" <${smtpUser}>`,
      to: toEmail,
      subject: '🔐 Kode Reset Password (6 Digit) - ChronoFocused',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FAF8F5;">
          <div style="background-color: #FFFFFF; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(27, 48, 34, 0.08);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, #354E41 0%, #2C4E3F 100%); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 28px; color: #FFFFFF;">🌿</span>
              </div>
              <h1 style="color: #1B3022; margin: 0 0 8px; font-size: 24px; font-weight: 700;">ChronoFocused</h1>
              <p style="color: #8E948F; margin: 0; font-size: 14px;">Kode Reset Password</p>
            </div>

            <!-- Greeting -->
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Halo <strong>${userName || 'Pengguna'}</strong>,
            </p>
            <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
              Kami menerima permintaan untuk mereset kata sandi akun ChronoFocused Anda. 
              Gunakan <strong>kode 6 digit</strong> di bawah ini pada aplikasi untuk membuat kata sandi baru:
            </p>

            <!-- Code Box -->
            <div style="background: linear-gradient(135deg, #F0F7F4 0%, #E8F0E8 100%); border: 2px dashed #354E41; border-radius: 16px; padding: 32px 24px; text-align: center; margin-bottom: 32px;">
              <p style="color: #8E948F; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Kode Verifikasi 6 Digit</p>
              <div style="font-size: 48px; font-weight: 800; color: #1B3022; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                ${resetCode}
              </div>
              <p style="color: #8E948F; font-size: 11px; margin: 16px 0 0; letter-spacing: 0.5px;">
                Kode ini hanya berlaku selama <strong>15 menit</strong>
              </p>
            </div>

            <!-- Instructions -->
            <div style="background-color: #F5F3EF; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #354E41; font-size: 13px; margin: 0 0 12px; font-weight: 600;">⚠️ Penting:</p>
              <ul style="color: #555555; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Jangan bagikan kode ini kepada siapapun</li>
                <li>Tim ChronoFocused tidak akan pernah meminta kode ini</li>
                <li>Jika Anda tidak meminta reset ini, abaikan email ini</li>
              </ul>
            </div>

            <!-- Divider -->
            <hr style="border: none; border-top: 1px solid #EAE5DC; margin: 24px 0;" />

            <!-- Footer -->
            <div style="text-align: center;">
              <p style="color: #8E948F; font-size: 12px; margin: 0 0 8px;">
                Butuh bantuan? Hubungi kami di 
                <a href="mailto:support@chronofocused.app" style="color: #354E41; text-decoration: none;">support@chronofocused.app</a>
              </p>
              <p style="color: #8E948F; font-size: 11px; margin: 0;">
                © 2025 ChronoFocused. Fokus • Tenang • Bertumbuh
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reset password email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send reset email:', error.message);
    return false;
  }
};

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.',
      });
    }

    const newUser = await authService.register(email, password);

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: newUser,
    });
  } catch (error) {
    console.error('Error Register:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email wajib disertakan.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    return res.status(200).json({
      success: true,
      exists: !!user,
    });
  } catch (error) {
    console.error('Error Check Email:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.',
      });
    }

    const result = await authService.login(email, password);

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: result,
    });
  } catch (error) {
    console.error('Error Login:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

// Step 1: Request password reset - sends 6-digit code to email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email wajib diisi.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Security: Return success even if user not found to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Jika email terdaftar, token reset password telah dikirimkan ke email Anda.',
      });
    }

    // Generate 6-digit numeric code
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save token to database
    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: tokenExpires,
      },
    });

    // Send email with token
    const userName = user.name || user.email.split('@')[0];
    const emailSent = await sendResetEmail(email, resetToken, userName);

    if (!emailSent) {
      console.error(`Failed to send reset email to ${email}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Token reset password telah dikirimkan ke email Anda.',
      // Development only - remove in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
  } catch (error) {
    console.error('Error Forgot Password:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

// Step 2: Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, password baru, dan konfirmasi password wajib diisi.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password dan konfirmasi tidak cocok.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter.',
      });
    }

    // Find user by valid token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token reset tidak valid atau sudah kadaluarsa. Silakan minta token baru.',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password and clear token
    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Password berhasil diperbarui! Silakan masuk kembali.',
    });
  } catch (error) {
    console.error('Error Reset Password:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

module.exports = { register, login, checkEmailExists, forgotPassword, resetPassword };