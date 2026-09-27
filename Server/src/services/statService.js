const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getUserAnalytics = async (userId) => {
  // 1. Ambil data profil user (untuk sisa energi & streak)
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      email: true,
      energyBattery: true,
      currentStreak: true,
    },
  });

  // 2. Hitung total sesi & total menit fokus dari tabel FocusSession
  const sessionStats = await prisma.focusSession.aggregate({
    where: {
      userId,
      status: 'COMPLETED',
      sessionType: 'FOCUS',
      deletedAt: null,
    },
    _count: {
      sessionId: true,
    },
    _sum: {
      duration: true,
    },
  });

  // 3. Hitung total task yang sudah selesai
  const completedTasksCount = await prisma.task.count({
    where: {
      userId,
      isCompleted: true,
      deletedAt: null,
    },
  });

  return {
    userProfile: user,
    stats: {
      totalFocusSessions: sessionStats._count.sessionId || 0,
      totalFocusMinutes: sessionStats._sum.duration || 0,
      completedTasks: completedTasksCount,
    },
  };
};

// Get focus and break session statistics
const getSessionStatistics = async (userId) => {
  // Get user's tracked break stats
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      totalBreakSessions: true,
      totalBreakMinutes: true,
    },
  });

  // Focus sessions stats
  const focusStats = await prisma.focusSession.aggregate({
    where: {
      userId,
      status: 'COMPLETED',
      sessionType: 'FOCUS',
      deletedAt: null,
    },
    _count: {
      sessionId: true,
    },
    _sum: {
      duration: true,
    },
  });

  // Break sessions stats
  const breakStats = await prisma.focusSession.aggregate({
    where: {
      userId,
      status: 'COMPLETED',
      sessionType: 'BREAK',
      deletedAt: null,
    },
    _count: {
      sessionId: true,
    },
    _sum: {
      duration: true,
    },
  });

  // Get daily stats for chart
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  
  const dailyStats = await prisma.focusSession.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      deletedAt: null,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
      sessionType: true,
      duration: true,
    },
  });

  // Aggregate by date
  const chartData = {};
  dailyStats.forEach((session) => {
    const date = session.createdAt.toISOString().split('T')[0];
    if (!chartData[date]) {
      chartData[date] = { date, focus: 0, break: 0, focusSessions: 0, breakSessions: 0 };
    }
    if (session.sessionType === 'FOCUS') {
      chartData[date].focus += session.duration;
      chartData[date].focusSessions += 1;
    } else {
      chartData[date].break += session.duration;
      chartData[date].breakSessions += 1;
    }
  });

  // Fill missing dates
  const chartDataArray = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    chartDataArray.push(chartData[dateStr] || { date: dateStr, focus: 0, break: 0, focusSessions: 0, breakSessions: 0 });
  }

  return {
    focus: {
      totalSessions: focusStats._count.sessionId || 0,
      totalMinutes: focusStats._sum.duration || 0,
    },
    break: {
      // Use the larger value between FocusSession records and User.totalBreakSessions
      totalSessions: Math.max(breakStats._count.sessionId || 0, user?.totalBreakSessions || 0),
      totalMinutes: Math.max(breakStats._sum.duration || 0, user?.totalBreakMinutes || 0),
    },
    chartData: chartDataArray,
  };
};

module.exports = {
  getUserAnalytics,
  getSessionStatistics,
};