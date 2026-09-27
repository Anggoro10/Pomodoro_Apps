import axios from 'axios';
import { Platform } from 'react-native';

// Menyesuaikan URL Backend berdasarkan Platform
const getBaseUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:5001/api/v1';
  if (Platform.OS === 'android') return 'http://10.0.2.2:5001/api/v1';
  return 'http://localhost:5001/api/v1';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export default api;