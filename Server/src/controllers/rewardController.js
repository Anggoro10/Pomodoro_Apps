const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MAX_ENERGY = 150;

const REWARDS = [
  { id: 'energy_10', label: '10% Baterai Energi', energy: 10, cost: 45 },
  { id: 'energy_25', label: '25% Baterai Energi', energy: 25, cost: 80 },
  { id: 'energy_50', label: '50% Baterai Energi', energy: 50, cost: 150 },
  { id: 'energy_random', label: 'Random 30%-50% Baterai Energi', energy: null, cost: 100, isRandom: true },
];

const getUserId = (req) => {
  const rawId = req.user?.userId || req.user?.id || req.user?.sub;
  return parseInt(rawId, 10);
};

const getRewards = async (req, res) => {
  try {
    const userId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { energyBattery: true, points: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar reward berhasil diambil.',
      rewards: REWARDS,
      userEnergy: user?.energyBattery ?? 100,
      userPoints: user?.points ?? 0,
    });
  } catch (error) {
    console.error('Error Get Rewards:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

const redeemReward = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { rewardId } = req.body;

    if (!rewardId) {
      return res.status(400).json({ success: false, message: 'rewardId wajib diisi.' });
    }

    const reward = REWARDS.find((r) => r.id === rewardId);
    if (!reward) {
      return res.status(400).json({ success: false, message: 'Reward tidak ditemukan.' });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { energyBattery: true, points: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    if (user.points < reward.cost) {
      return res.status(400).json({
        success: false,
        message: `Point tidak cukup. Butuh ${reward.cost} point, kamu punya ${user.points} point.`,
        requiredPoints: reward.cost,
        userPoints: user.points,
      });
    }

    if (user.energyBattery >= MAX_ENERGY) {
      return res.status(400).json({
        success: false,
        message: `Baterai energi sudah penuh (${MAX_ENERGY}%). Tidak dapat menukarkan reward untuk energi tambahan.`,
        canRedeem: false,
        userEnergy: user.energyBattery,
        maxEnergy: MAX_ENERGY,
      });
    }

    const energyAmount = reward.isRandom
      ? Math.floor(Math.random() * 21) + 30
      : reward.energy;

    const newEnergy = Math.min(MAX_ENERGY, user.energyBattery + energyAmount);
    const actualEnergyGained = newEnergy - user.energyBattery;

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        points: { decrement: reward.cost },
        energyBattery: newEnergy,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Berhasil menukarkan ${reward.cost} point! Baterai energi +${actualEnergyGained}% (dari ${reward.label}).`,
      batterai_energi: updatedUser.energyBattery,
      points: updatedUser.points,
      energyGained: actualEnergyGained,
      pointsSpent: reward.cost,
    });
  } catch (error) {
    console.error('Error Redeem Reward:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

module.exports = {
  getRewards,
  redeemReward,
  REWARDS,
};
