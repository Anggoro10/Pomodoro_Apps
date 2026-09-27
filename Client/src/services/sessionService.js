import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const savePomodoroSession = async (sessionData) => {
  try {
    const token = await AsyncStorage.getItem('user_token');

    const response = await api.post(
      '/sessions',
      {
        duration: sessionData.duration || 25,
        mode: sessionData.mode || 'FOCUS',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error Save Session:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Gagal menyimpan sesi.');
  }
};