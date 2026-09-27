import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getTasks = async () => {
  const token = await AsyncStorage.getItem('user_token');
  const response = await api.get('/tasks', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createTask = async (title, estimatedPomodoros = 1) => {
  const token = await AsyncStorage.getItem('user_token');
  const response = await api.post(
    '/tasks',
    { title, estimatedPomodoros },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const toggleTaskCompleted = async (taskId, isCompleted) => {
  const token = await AsyncStorage.getItem('user_token');
  const response = await api.patch(
    `/tasks/${taskId}`,
    { isCompleted },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};