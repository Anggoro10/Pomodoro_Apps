const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MAX_ENERGY = 150;
const POINTS_PER_SESSION = 5;

const getUserId = (req) => {
  const rawId = req.user?.userId || req.user?.id || req.user?.sub;
  return parseInt(rawId, 10);
};

const getSessions = async (req, res) => {
  try {
    const userId = getUserId(req);

    // Ganti prisma.session menjadi prisma.focusSession sesuai skema
    const sessions = await prisma.focusSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Ambil data user menggunakan field userId dan energyBattery
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { energyBattery: true, points: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar sesi berhasil diambil.',
      data: sessions,
      batterai_energi: user?.energyBattery ?? 100,
      points: user?.points ?? 0,
    });
  } catch (error) {
    console.error('Error Get Sessions:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

const createSession = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { durationMinutes, sessionType } = req.body;

    const sessionTypeValue = sessionType === 'BREAK' ? 'BREAK' : 'FOCUS';

    let energyDelta = 0;
    if (sessionTypeValue === 'FOCUS') {
      energyDelta = -10; 
    } else if (sessionTypeValue === 'BREAK') {
      energyDelta = 4;   
    }

    // Simpan ke focusSession
    const newSession = await prisma.focusSession.create({
      data: {
        userId,
        duration: parseInt(durationMinutes || 25, 10),
        status: 'COMPLETED',
        sessionType: sessionTypeValue,
      },
    });

    const user = await prisma.user.findUnique({ where: { userId } });
    if (user) {
      const currentEnergy = user.energyBattery !== undefined ? user.energyBattery : 100;
      const updatedEnergy = Math.min(MAX_ENERGY, Math.max(0, currentEnergy + energyDelta));

      await prisma.user.update({
        where: { userId },
        data: {
          energyBattery: updatedEnergy,
          ...(sessionTypeValue === 'BREAK' ? {
            totalBreakSessions: { increment: 1 },
            totalBreakMinutes: { increment: parseInt(durationMinutes || 5, 10) },
          } : {}),
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Sesi berhasil disimpan dan energyBattery diperbarui.',
      data: newSession,
    });
  } catch (error) {
    console.error('Error Create Session:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

const completeFocusSession = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { durationMinutes } = req.body; 

    const energyCost = 10; 

    const currentUser = await prisma.user.findUnique({ where: { userId } });
    const currentEnergy = currentUser?.energyBattery ?? 100;
    const newEnergy = Math.max(0, currentEnergy - energyCost);

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        energyBattery: newEnergy,
        points: { increment: POINTS_PER_SESSION },
      }
    });

    await prisma.focusSession.create({
      data: {
        userId,
        duration: parseInt(durationMinutes || 25, 10),
        status: 'COMPLETED',
        sessionType: 'FOCUS',
      }
    });

    res.status(200).json({ success: true, batterai_energi: updatedUser.energyBattery, points: updatedUser.points });
  } catch (error) {
    console.error('Error Complete Focus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelFocusSession = async (req, res) => {
  try {
    const userId = getUserId(req);
    const currentUser = await prisma.user.findUnique({
      where: { userId },
      select: { energyBattery: true },
    });
    const currentEnergy = currentUser?.energyBattery ?? 100;
    const newEnergy = Math.max(0, currentEnergy - 10);

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { energyBattery: newEnergy },
    });

    res.status(200).json({
      success: true,
      batterai_energi: updatedUser.energyBattery,
    });
  } catch (error) {
    console.error('Error Cancel Focus:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat membatalkan sesi.',
    });
  }
};

const updateBreakEnergy = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { addedEnergy } = req.body; 

    const currentUser = await prisma.user.findUnique({ where: { userId } });
    const currentEnergy = currentUser?.energyBattery ?? 100;

    if (currentEnergy >= MAX_ENERGY) {
      return res.status(400).json({
        success: false,
        message: 'Baterai energi sudah penuh (150%). Tidak dapat melakukan istirahat atau rest.',
        canRest: false,
        batterai_energi: currentEnergy,
      });
    }

    const newEnergy = Math.min(MAX_ENERGY, currentEnergy + (addedEnergy || 4));

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { energyBattery: newEnergy }
    });

    res.status(200).json({ success: true, batterai_energi: updatedUser.energyBattery });
  } catch (error) {
    console.error('Error Update Break Energy:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSessions,
  createSession,
  updateBreakEnergy,
  completeFocusSession,
  cancelFocusSession,
};
