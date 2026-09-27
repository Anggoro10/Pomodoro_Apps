const focusService = require('../services/focusService');

const startSession = async (req, res) => {
    try {
        const userId = Number(req.user.userId);
        const { taskId, duration, status } = req.body;
    
        // Tangkap return value dari service ke dalam variabel result
        const result = await focusService.createFocusSession(userId, {
          taskId,
          duration,
          status,
        });
    
        return res.status(201).json({
          success: true,
          message: 'Sesi fokus berhasil dicatat.',
          data: result, // <-- Sertakan data di sini
        });
      } catch (error) {
        console.error('Error Focus Session:', error);
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message || 'Terjadi kesalahan pada server.',
        });
      }
};

const takeBreak = async (req, res) => {
    try {
      const userId = Number(req.user.userId);
      const { duration } = req.body; // Durasi istirahat dalam menit
  
      const result = await focusService.createBreakSession(userId, duration);
  
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan pada server.',
      });
    }
  };

const getHistory = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const history = await focusService.getFocusHistory(userId);

    return res.status(200).json({
      success: true,
      message: 'Riwayat sesi fokus berhasil diambil.',
      data: history,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

module.exports = {
  startSession,
  getHistory,
  takeBreak
};