const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTasks = async (userId) => {
  return await prisma.task.findMany({
    where: { 
      userId: parseInt(userId, 10),
      deletedAt: null 
    },
    include: {
      category: true, // Menyertakan data kategori berelasi
    },
    orderBy: { createdAt: 'desc' },
  });
};

const createTask = async (userId, data) => {
  const cleanUserId = parseInt(userId, 10);
  const categoryName = data.category || data.categoryName || 'General';

  // 1. Cari atau buat kategori di tabel categories berdasarkan nama
  let categoryRecord = await prisma.category.findFirst({
    where: {
      userId: cleanUserId,
      name: categoryName,
      deletedAt: null,
    },
  });

  if (!categoryRecord) {
    categoryRecord = await prisma.category.create({
      data: {
        userId: cleanUserId,
        name: categoryName,
      },
    });
  }

  // 2. Buat task baru dengan categoryId yang terhubung
  return await prisma.task.create({
    data: {
      userId: cleanUserId,
      title: data.title,
      estimatedPomodoros: parseInt(data.estimatedPomodoros || 1, 10),
      categoryId: categoryRecord.categoryId,
    },
    include: {
      category: true,
    },
  });
};

const updateTask = async (userId, taskId, updateData) => {
  const cleanUserId = parseInt(userId, 10);
  const cleanTaskId = parseInt(taskId, 10);

  const task = await prisma.task.findFirst({
    where: {
      taskId: cleanTaskId,
      userId: cleanUserId,
      deletedAt: null,
    },
  });

  if (!task) {
    const error = new Error('Tugas tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  let newCategoryId = task.categoryId;
  if (updateData.category || updateData.categoryName) {
    const catName = updateData.category || updateData.categoryName;
    let catRecord = await prisma.category.findFirst({
      where: { userId: cleanUserId, name: catName, deletedAt: null },
    });
    if (!catRecord) {
      catRecord = await prisma.category.create({
        data: { userId: cleanUserId, name: catName },
      });
    }
    newCategoryId = catRecord.categoryId;
  }

  return await prisma.task.update({
    where: { taskId: cleanTaskId },
    data: {
      isCompleted: updateData.isCompleted !== undefined ? updateData.isCompleted : task.isCompleted,
      title: updateData.title || task.title,
      categoryId: newCategoryId,
      estimatedPomodoros: updateData.estimatedPomodoros ? parseInt(updateData.estimatedPomodoros, 10) : task.estimatedPomodoros,
    },
    include: {
      category: true,
    },
  });
};

const deleteTask = async (userId, taskId) => {
  const cleanUserId = parseInt(userId, 10);
  const cleanTaskId = parseInt(taskId, 10);

  return await prisma.task.update({
    where: { taskId: cleanTaskId },
    data: { deletedAt: new Date() },
  });
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};