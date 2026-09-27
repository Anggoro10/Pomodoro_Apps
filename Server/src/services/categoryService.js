const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getCategories = async (userId) => {
  return await prisma.category.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
};

const createCategory = async (userId, data) => {
  const { name, colorHex } = data;

  return await prisma.category.create({
    data: {
      userId,
      name,
      colorHex: colorHex || '#4A90E2',
    },
  });
};

const deleteCategory = async (userId, categoryId) => {
  // Soft delete kategori
  return await prisma.category.updateMany({
    where: { categoryId, userId },
    data: { deletedAt: new Date() },
  });
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
};