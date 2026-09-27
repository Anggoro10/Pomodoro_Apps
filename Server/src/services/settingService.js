const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSettings = async (userId) => {
  // Ambil setting user, buat default jika belum ada
  let setting = await prisma.userSetting.findUnique({
    where: { userId },
  });

  if (!setting) {
    setting = await prisma.userSetting.create({
      data: { userId },
    });
  }

  return setting;
};

const updateSettings = async (userId, data) => {
  const { focusDuration, shortBreak, longBreak, autoStartBreaks } = data;

  return await prisma.userSetting.upsert({
    where: { userId },
    update: {
      ...(focusDuration && { focusDuration: parseInt(focusDuration, 10) }),
      ...(shortBreak && { shortBreak: parseInt(shortBreak, 10) }),
      ...(longBreak && { longBreak: parseInt(longBreak, 10) }),
      ...(typeof autoStartBreaks === 'boolean' && { autoStartBreaks }),
    },
    create: {
      userId,
      focusDuration: focusDuration ? parseInt(focusDuration, 10) : 25,
      shortBreak: shortBreak ? parseInt(shortBreak, 10) : 5,
      longBreak: longBreak ? parseInt(longBreak, 10) : 15,
      autoStartBreaks: autoStartBreaks ?? false,
    },
  });
};

module.exports = {
  getSettings,
  updateSettings,
};