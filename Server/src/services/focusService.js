const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MAX_ENERGY = 150;

const createFocusSession = async (userId, sessionData) => {
    const createFocusSession = async (userId, sessionData) => {
        const { taskId, duration, status } = sessionData;
        const sessionDuration = duration || 25;
      
        return await prisma.$transaction(async (tx) => {
          // 1. Simpan Sesi Fokus
          const newSession = await tx.focusSession.create({
            data: {
              userId,
              taskId: taskId ? parseInt(taskId, 10) : null,
              duration: sessionDuration,
              status: status || 'COMPLETED',
              sessionType: 'FOCUS',
            },
          });
      
          // 2. Potong Energi (Min. 0)
          const user = await tx.user.findUnique({ where: { userId } });
          const updatedEnergy = Math.max(0, user.energyBattery - 10);
      
          // 3. Logika Kalkulasi Streak Harian
          const today = new Date();
          today.setHours(0, 0, 0, 0);
      
          // Cek apakah hari ini sudah ada log statistik
          const existingLog = await tx.userStatLog.findFirst({
            where: {
              userId,
              createdAt: { gte: today },
            },
          });
      
          let newStreak = user.currentStreak;
      
          if (!existingLog) {
            // Jika ini sesi pertama hari ini, tambahkan +1 ke streak
            newStreak += 1;
      
            // Buat log statistik baru untuk hari ini
            await tx.userStatLog.create({
              data: {
                userId,
                sessions: 1,
                minutes: sessionDuration,
              },
            });
          } else {
            // Jika sudah ada log hari ini, cukup update akumulasi menit & sesi
            await tx.userStatLog.update({
              where: { logId: existingLog.logId },
              data: {
                sessions: { increment: 1 },
                minutes: { increment: sessionDuration },
              },
            });
          }
      
          // 4. Update Data User (Energi & Streak)
          const updatedUser = await tx.user.update({
            where: { userId },
            data: {
              energyBattery: updatedEnergy,
              currentStreak: newStreak,
              points: { increment: 5 },
            },
          });
      
          // 5. Update Task jika terhubung
          if (taskId) {
            await tx.task.update({
              where: { taskId: parseInt(taskId, 10) },
              data: { completedPomodoros: { increment: 1 } },
            });
          }
      
          return {
            session: newSession,
            remainingEnergy: updatedUser.energyBattery,
            currentStreak: updatedUser.currentStreak,
            points: updatedUser.points,
          };
        });
      };
};

const getFocusHistory = async (userId) => {
  return await prisma.focusSession.findMany({
    where: { userId, deletedAt: null },
    include: {
      task: {
        select: { title: true, categoryTag: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const createBreakSession = async (userId, breakDuration) => {
    const energyRecovered = breakDuration || 5;
   
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { userId },
        select: { energyBattery: true, totalBreakSessions: true, totalBreakMinutes: true },
      });
   
      if (user.energyBattery >= MAX_ENERGY) {
        throw new Error('Baterai energi sudah penuh (150%). Tidak dapat melakukan istirahat atau rest.');
      }
       
      const newEnergy = Math.min(MAX_ENERGY, user.energyBattery + energyRecovered);
   
      // Save break session to FocusSession table
      await tx.focusSession.create({
        data: {
          userId,
          duration: energyRecovered,
          status: 'COMPLETED',
          sessionType: 'BREAK',
        },
      });
   
      const updatedUser = await tx.user.update({
        where: { userId },
        data: {
          energyBattery: newEnergy,
          totalBreakSessions: { increment: 1 },
          totalBreakMinutes: { increment: energyRecovered },
        },
      });
   
      return {
        message: `Energi berhasil dipulihkan +${energyRecovered}%`,
        currentEnergy: updatedUser.energyBattery,
      };
    });
  };

  

module.exports = {
    createFocusSession,
    getFocusHistory,
    createBreakSession,
};