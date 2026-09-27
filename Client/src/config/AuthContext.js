import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Periksa token saat aplikasi pertama kali dimuat
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('user_token');
        const savedUser = await AsyncStorage.getItem('user_data');

        if (token && savedUser) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error('Error restore token:', e);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  // Fungsi Login
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Mengikuti struktur response: { success: true, message: "...", data: { token, user } }
      const { token, user: userData } = response.data.data;

      if (token) {
        await AsyncStorage.setItem('user_token', token);
        if (userData) {
          await AsyncStorage.setItem('user_data', JSON.stringify(userData));
          setUser(userData);
        } else {
          setUser({ email });
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return { success: true };
      }

      return { success: false, message: 'Token tidak ditemukan.' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal login. Cek email dan password.',
      };
    }
  };

  // Fungsi Register
  const register = async (email, password) => {
    try {
      const response = await api.post('/auth/register', { email, password });
      return {
        success: true,
        message: response.data.message || 'Registrasi berhasil! Silakan login.',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mendaftar. Silakan coba lagi.',
      };
    }
  };

  // Fungsi Logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user_token');
      await AsyncStorage.removeItem('user_data');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};