const settingService = require('../services/settingService');

const getSettings = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const settings = await settingService.getSettings(userId);

    return res.status(200).json({
      success: true,
      message: 'Pengaturan pengguna berhasil diambil.',
      data: settings,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const updatedSettings = await settingService.updateSettings(userId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Pengaturan pengguna berhasil diperbarui.',
      data: updatedSettings,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};