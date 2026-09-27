const categoryService = require('../services/categoryService');

const getCategories = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const categories = await categoryService.getCategories(userId);

    return res.status(200).json({
      success: true,
      message: 'Daftar kategori berhasil diambil.',
      data: categories,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const { name, colorHex } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama kategori wajib diisi.',
      });
    }

    const newCategory = await categoryService.createCategory(userId, { name, colorHex });

    return res.status(201).json({
      success: true,
      message: 'Kategori berhasil dibuat.',
      data: newCategory,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const categoryId = parseInt(req.params.categoryId, 10);

    await categoryService.deleteCategory(userId, categoryId);

    return res.status(200).json({
      success: true,
      message: 'Kategori berhasil dihapus.',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
};