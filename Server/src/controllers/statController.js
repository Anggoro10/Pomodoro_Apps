const statService = require('../services/statService');

const getDashboardStats = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const analytics = await statService.getUserAnalytics(userId);

    return res.status(200).json({
      success: true,
      message: 'Data statistik pengguna berhasil diambil.',
      data: analytics,
    });
  } catch (error) {
    console.error('Error Get Analytics:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

const getSessionStatistics = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const stats = await statService.getSessionStatistics(userId);

    return res.status(200).json({
      success: true,
      message: 'Data statistik sesi berhasil diambil.',
      data: stats,
    });
  } catch (error) {
    console.error('Error Get Session Statistics:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

module.exports = {
  getDashboardStats,
  getSessionStatistics,
};