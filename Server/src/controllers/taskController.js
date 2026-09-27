const taskService = require('../services/taskService');

const getUserId = (req) => {
  const rawId = req.user?.userId || req.user?.id || req.user?.sub;
  if (!rawId) return null;
  return parseInt(rawId, 10);
};

const getTasks = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId || isNaN(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Sesi login tidak valid atau token kedaluwarsa.',
      });
    }

    const tasks = await taskService.getTasks(userId);

    return res.status(200).json({
      success: true,
      message: 'Daftar tugas berhasil diambil.',
      data: tasks,
    });
  } catch (error) {
    console.error('Error Get Tasks:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

const createTask = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId || isNaN(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Sesi login tidak valid.',
      });
    }

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Judul tugas wajib diisi.',
      });
    }

    const newTask = await taskService.createTask(userId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Tugas berhasil dibuat.',
      data: newTask,
    });
  } catch (error) {
    console.error('Error Create Task:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId || isNaN(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Sesi login tidak valid.',
      });
    }

    const taskId = req.params.taskId;
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'ID tugas tidak ditemukan.',
      });
    }

    const updatedTask = await taskService.updateTask(userId, taskId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Status tugas berhasil diperbarui.',
      data: updatedTask,
    });
  } catch (error) {
    console.error('Error Update Task:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId || isNaN(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Sesi login tidak valid.',
      });
    }

    const taskId = req.params.taskId;
    await taskService.deleteTask(userId, taskId);

    return res.status(200).json({
      success: true,
      message: 'Tugas berhasil dihapus.',
    });
  } catch (error) {
    console.error('Error Delete Task:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server.',
    });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};