import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert, Platform } from 'react-native';
import { savePomodoroSession } from '../services/sessionService';

const MODES = {
  FOCUS: { name: 'Fokus', time: 25 * 60, color: '#2C4E3F', durationMinutes: 25 },
  SHORT_BREAK: { name: 'Istirahat Pendek', time: 5 * 60, color: '#E07A5F', durationMinutes: 5 },
  LONG_BREAK: { name: 'Istirahat Panjang', time: 15 * 60, color: '#3D405B', durationMinutes: 15 },
};

export default function PomodoroTimer({ selectedTaskId, onSessionSaved }) {
  const [mode, setMode] = useState('FOCUS');
  const [timeLeft, setTimeLeft] = useState(MODES.FOCUS.time);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isNative = Platform.OS !== 'web';

  // Helper untuk alert aman di Web & Mobile
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // 1. Effect Khusus Jalannya Timer (Detik berkurang)
useEffect(() => {
    let timer = null;
  
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }
  
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft]);
  
  // 2. Effect Khusus Penanganan Sesi Selesai (Hanya panggil jika timer SEDANG BERJALAN dan menyentuh 0)
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
  
      if (mode === 'FOCUS') {
        setSessionsCompleted((prev) => prev + 1);
  
        // Auto-save ke database
        savePomodoroSession({
          duration: MODES.FOCUS.durationMinutes,
          mode: 'FOCUS',
          taskId: selectedTaskId,
        })
          .then(() => {
            showAlert('🎉 Sesi Selesai!', 'Selamat! Sesi fokus kamu telah selesai dan berhasil disimpan.');
            if (onSessionSaved) onSessionSaved();
          })
          .catch((err) => {
            console.error('Gagal menyimpan sesi:', err.message);
            showAlert('⚠️ Perhatian', `Sesi selesai, tetapi gagal menyimpan ke server: ${err.message}`);
          });
  
        changeMode('SHORT_BREAK', true);
      } else {
        showAlert('⏰ Istirahat Selesai', 'Waktu istirahat habis. Siap untuk kembali berfokus?');
        changeMode('FOCUS', true);
      }
    }
  }, [timeLeft, isRunning]);

  // Animasi tombol
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: isNative }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: isNative }),
    ]).start();
  };

  const toggleTimer = () => {
    animateButton();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    if (isRunning) {
      const confirmReset = Platform.OS === 'web'
        ? window.confirm('Timer sedang berjalan. Apakah kamu yakin ingin mereset?')
        : true;

      if (!confirmReset) return;
    }

    setIsRunning(false);
    setTimeLeft(MODES[mode].time);
  };

  const changeMode = (newMode, force = false) => {
    if (isRunning && !force) {
      const confirmChange = Platform.OS === 'web'
        ? window.confirm('Sesi sedang berjalan. Berpindah mode akan mereset timer saat ini. Lanjutkan?')
        : true;

      if (!confirmChange) return;
    }

    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].time);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ width: '100%', maxWidth: 420, alignItems: 'center' }}>
      {/* Selector Mode Sesi */}
      <View style={{ flexDirection: 'row', backgroundColor: '#F3EFEA', padding: 6, borderRadius: 16, marginBottom: 24, gap: 4 }}>
        {Object.keys(MODES).map((key) => (
          <TouchableOpacity
            key={key}
            onPress={() => changeMode(key)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: mode === key ? MODES[key].color : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: mode === key ? '#FFFFFF' : '#8E948F',
              }}
            >
              {MODES[key].name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Timer Display */}
      <View
        style={{
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: '#F3EFEA',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 32,
          borderWidth: 2,
          borderColor: MODES[mode].color,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        }}
      >
        <Text style={{ fontSize: 48, fontWeight: 'bold', color: MODES[mode].color, fontFamily: 'monospace' }}>
          {formatTime(timeLeft)}
        </Text>
        <Text style={{ fontSize: 13, color: '#8E948F', marginTop: 4 }}>
          {isRunning ? 'Sesi Sedang Berjalan' : 'Siap Berfokus'}
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={{ flexDirection: 'row', gap: 12, width: '100%', justifyContent: 'center' }}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1, maxWidth: 160 }}>
          <TouchableOpacity
            onPress={toggleTimer}
            activeOpacity={0.8}
            style={{
              backgroundColor: MODES[mode].color,
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>
              {isRunning ? 'Jeda' : 'Mulai Fokus'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          onPress={resetTimer}
          style={{
            backgroundColor: '#F3EFEA',
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderRadius: 14,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#D8E8DD',
          }}
        >
          <Text style={{ color: '#2C4E3F', fontWeight: '600', fontSize: 15 }}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Counter Sesi Terlesaikan */}
      <Text style={{ marginTop: 24, fontSize: 13, color: '#8E948F' }}>
        Sesi Selesai Hari Ini: <Text style={{ fontWeight: 'bold', color: '#2C4E3F' }}>{sessionsCompleted}</Text>
      </Text>
    </View>
  );
}