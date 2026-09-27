import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../config/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const { width } = Dimensions.get('window');

// --- Batas Minimum Energi untuk Sesi Fokus ---
const MINIMUM_FOCUS_ENERGY = 30;
const MAX_ENERGY = 150;

// --- Helper Icons (Play & Pause SVG) ---
const PlayIcon = () => (
  <View style={{ width: 22, height: 22, marginLeft: 2 }}>
    <svg viewBox="0 0 24 24" fill="white" width="100%" height="100%">
      <path d="M8 5v14l11-7z" />
    </svg>
  </View>
);

const PauseIcon = () => (
  <View style={{ width: 22, height: 22 }}>
    <svg viewBox="0 0 24 24" fill="white" width="100%" height="100%">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  </View>
);

export default function ActiveFocusScreen({
  focusData,
  onBackToDashboard,
  onStartBreak,
  onSessionComplete,
  onCancelSession,
  onNavigateToDashboard,
  onNavigateToBreak,
  onNavigateToReward,
  onNavigateToStatistics,
  onNavigateToTab,
}) {
  const { user, logout } = useContext(AuthContext);

  // 1. Tangkap durasi secara dinamis
  const durationMinutes = typeof focusData === 'object' && focusData !== null 
    ? (focusData.durationMinutes || 25) 
    : (typeof focusData === 'number' ? focusData : 25);
    
  const currentTask = focusData?.task || (typeof focusData === 'object' && focusData?.title ? focusData : { title: 'Sesi Fokus Mandiri', category: 'Umum' });

  // 2. Inisialisasi State
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false); // Default false sebelum energi diverifikasi
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState('Sesi Aktif');
  const [focusEnergy, setFocusEnergy] = useState(100);
  const [points, setPoints] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isLoadingEnergy, setIsLoadingEnergy] = useState(true);

  // Animated Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgScale1 = useRef(new Animated.Value(1)).current;
  
  const breathAnimationRef = useRef(null);

  // Sinkronisasi ulang jika prop focusData berubah
  useEffect(() => {
    if (durationMinutes) {
      setTimeLeft(durationMinutes * 60);
    }
  }, [durationMinutes]);

  const handleDashboardNav = () => {
    if (onBackToDashboard) onBackToDashboard();
    else if (onNavigateToDashboard) onNavigateToDashboard();
  };

  const handleBreakNav = () => {
    if (onStartBreak) onStartBreak();
    else if (onNavigateToBreak) onNavigateToBreak();
  };

  const showLowEnergyAlert = (currentEnergy) => {
    const message = `Baterai energi Anda tersisa ${currentEnergy}%. Minimal ${MINIMUM_FOCUS_ENERGY}% energi diperlukan untuk sesi fokus. Silakan lakukan istirahat atau isi ulang energi terlebih dahulu.`;

    if (Platform.OS === 'web') {
      window.alert(`ChronoFocused\n\n${message}`);
      handleDashboardNav();
    } else {
      Alert.alert('Energi Terlalu Rendah', message, [
        { text: 'Kembali ke Dashboard', onPress: handleDashboardNav },
        { text: 'Ambil Istirahat', onPress: handleBreakNav },
      ]);
    }
  };

  // --- Ambil Energi Awal & Validasi Pembatasan Minimal 30% ---
  useEffect(() => {
    const fetchInitialEnergyFromDB = async () => {
      try {
        setIsLoadingEnergy(true);
        const res = await api.get('/sessions');
        if (res.data && res.data.success && res.data.batterai_energi !== undefined) {
          const energyVal = res.data.batterai_energi;
          setFocusEnergy(energyVal);

          if (energyVal < MINIMUM_FOCUS_ENERGY) {
            setIsRunning(false);
            showLowEnergyAlert(energyVal);
            return;
          }
        }
        // Jika energi cukup, jalankan timer
        setIsRunning(true);
      } catch (err) {
        console.log('Gagal memuat energi awal dari database:', err.message);
        setIsRunning(true);
      } finally {
        setIsLoadingEnergy(false);
      }
    };

    fetchInitialEnergyFromDB();
  }, []);

  // --- Fungsi Pemutar Alarm Audio ---
  const playAlarmSound = () => {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();

        const playTone = (startTime, freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          gain.gain.setValueAtTime(0.3, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 1.2);
        };

        const now = ctx.currentTime;
        playTone(now, 587.33); 
        playTone(now + 0.4, 880); 
        playTone(now + 0.8, 1174.66); 
      }
    } catch (e) {
      console.log('Audio alarm tidak didukung perangkat:', e);
    }
  };

  // Simpan Sesi & Kurangi Energi di Database saat Selesai
  const handleCompleteSessionInDB = async () => {
    if (isCompleting || isCancelling) return;

    setIsCompleting(true);
    try {
      const durationNum = durationMinutes ? parseInt(durationMinutes, 10) : 25;
      const targetTaskId = currentTask?.taskId || currentTask?.id;

      const res = await api.post('/complete-focus-session', {
        durationMinutes: durationNum,
      });

      if (res.data && res.data.success && res.data.batterai_energi !== undefined) {
        setFocusEnergy(res.data.batterai_energi);
      }

      if (res.data && res.data.success && res.data.points !== undefined) {
        setPoints(res.data.points);
      }

      if (targetTaskId) {
        await api.patch(`/tasks/${targetTaskId}`, {
          isCompleted: true,
        });
      }
    } catch (err) {
      console.log('Gagal menyinkronkan penyelesaian fokus:', err.response?.data?.message || err.message);
    } finally {
      setIsCompleting(false);

      if (onSessionComplete) {
        onSessionComplete();
      } else if (onBackToDashboard) {
        onBackToDashboard();
      }
    }
  };

  const handleCancelSession = async () => {
    if (isCancelling || isCompleting) return;

    const previousEnergy = focusEnergy;
    setIsCancelling(true);
    setIsRunning(false);
    setFocusEnergy((currentEnergy) => Math.max(0, currentEnergy - 10));

    try {
      const token = await AsyncStorage.getItem('user_token');
      const res = await api.post('/cancel-focus-session', {}, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (res.data && res.data.success && res.data.batterai_energi !== undefined) {
        setFocusEnergy(res.data.batterai_energi);
      }
    } catch (err) {
      setFocusEnergy(previousEnergy);
      console.log('Gagal menyimpan pembatalan sesi:', err.response?.data?.message || err.message);
    } finally {
      setIsCancelling(false);

      if (onCancelSession) {
        onCancelSession();
      } else if (onBackToDashboard) {
        onBackToDashboard();
      }
    }
  };

  // Timer Countdown Effect
  useEffect(() => {
    let interval;
    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      clearInterval(interval);
      playAlarmSound();
      handleCompleteSessionInDB();
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeLeft]);

  // Animasi Masuk
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(bgFloat1, { toValue: 1, duration: 3500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(bgFloat1, { toValue: 0, duration: 3500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        ]),
        Animated.sequence([
          Animated.timing(bgScale1, { toValue: 1.25, duration: 3500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(bgScale1, { toValue: 1, duration: 3500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        ]),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgFloat2, { toValue: 1, duration: 4500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(bgFloat2, { toValue: 0, duration: 4500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      ])
    ).start();
  }, []);

  // Animasi Pernapasan
  useEffect(() => {
    if (isRunning && !isPaused) {
      breathAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, { toValue: 1.06, duration: 4000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(breathAnim, { toValue: 1, duration: 4000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        ])
      );
      breathAnimationRef.current.start();
    } else {
      if (breathAnimationRef.current) {
        breathAnimationRef.current.stop();
      }
      Animated.timing(breathAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [isRunning, isPaused]);

  const handleBtnHoverIn = (animVal) => {
    Animated.spring(animVal, { toValue: 1.05, friction: 5, tension: 100, useNativeDriver: true }).start();
  };

  const handleBtnHoverOut = (animVal) => {
    Animated.spring(animVal, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }).start();
  };

  const togglePlayPause = () => {
    if (focusEnergy < MINIMUM_FOCUS_ENERGY) {
      showLowEnergyAlert(focusEnergy);
      return;
    }
    setIsPaused(!isPaused);
  };

  const formatTime = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;

    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F5', overflow: 'hidden' }}>

      {/* Background Floating Ambient Orbs */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -80,
          left: -80,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: '#CDE5DD',
          opacity: 0.65,
          transform: [{ translateY: bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, -45] }) }, { scale: bgScale1 }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          bottom: -100,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: 180,
          backgroundColor: '#E8DFD1',
          opacity: 0.75,
          transform: [{ translateY: bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) }],
        }}
      />

      {/* Top Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F0EBE1', backgroundColor: 'rgba(250, 248, 245, 0.95)', zIndex: 10 }}>
        <TouchableOpacity onPress={handleDashboardNav} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="arrow-back" size={20} color="#354E41" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#354E41' }}>Kembali</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1B3022', letterSpacing: -0.3 }}>ChronoFocused</Text>
          <Text style={{ fontSize: 11, color: '#8E948F', fontWeight: '500' }}>Sesi Aktif Berjalan</Text>
        </View>

         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAE5DC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 4 }}>
            <Text style={{ fontSize: 12 }}>⚡</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: focusEnergy < MINIMUM_FOCUS_ENERGY ? '#D93838' : '#2C4E3F' }}>{focusEnergy}%</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAE5DC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 4 }}>
            <Text style={{ fontSize: 12 }}>💎</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2C4E3F' }}>{points} pt</Text>
          </View>
          <TouchableOpacity onPress={logout} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#354E41', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 100, maxWidth: 480, alignSelf: 'center', width: '100%', zIndex: 5 }}>
        
        {/* Peringatan Energi Kurang dari 30% */}
        {focusEnergy < MINIMUM_FOCUS_ENERGY && (
          <View style={{ backgroundColor: '#FDECEC', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3C2C2', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 20 }}>⚠️</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#B42323' }}>Sesi Dihentikan: Energi Rendah</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#7A2B2B', lineHeight: 18, marginBottom: 12 }}>
              Energi Anda tersisa {focusEnergy}%. Anda memerlukan minimal {MINIMUM_FOCUS_ENERGY}% energi untuk dapat melanjutkan atau menjalankan sesi fokus.
            </Text>
            <TouchableOpacity
              onPress={handleBreakNav}
              style={{ backgroundColor: '#D93838', borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>🌿 Ambil Sesi Istirahat</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Tugas yang Sedang Dikerjakan */}
        <View style={{ backgroundColor: '#EAE5DC', borderRadius: 20, padding: 16, marginBottom: 24, alignItems: 'center', width: '100%' }}>
          <View style={{ backgroundColor: '#FFFFFF', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#2C4E3F' }}>
              {typeof currentTask?.category === 'object' ? currentTask?.category?.name : currentTask?.category || 'Umum'}
            </Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' }}>
            {currentTask?.title || 'Sesi Fokus Mandiri'}
          </Text>
          {currentTask?.notes ? (
            <Text style={{ fontSize: 12, color: '#757575', marginTop: 4, textAlign: 'center' }}>
              Catatan: {currentTask.notes}
            </Text>
          ) : null}
        </View>

        {/* Lingkaran Timer & Tombol Play/Pause */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center', marginBottom: 35, marginTop: 10 }}>
          <View style={{ position: 'relative', alignItems: 'center', width: '100%', paddingBottom: 40 }}>
            
            <Animated.View
              style={{
                width: width * 0.65,
                height: width * 0.65,
                maxWidth: 260,
                maxHeight: 260,
                borderRadius: 130,
                borderWidth: 10,
                borderColor: focusEnergy < MINIMUM_FOCUS_ENERGY ? '#D93838' : '#354E41',
                justifyContent: 'center',
                alignItems: 'center',
                transform: [{ scale: breathAnim }],
                backgroundColor: '#FFFFFF',
                shadowColor: '#354E41',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 15,
                elevation: 6,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: focusEnergy < MINIMUM_FOCUS_ENERGY ? '#D93838' : '#354E41', letterSpacing: 1, marginBottom: 4 }}>
                {focusEnergy < MINIMUM_FOCUS_ENERGY ? 'ENERGI KRITIS' : isPaused ? 'SESI DIJEDA' : 'FOKUS & BERNAFAS TENANG'}
              </Text>
              <Text style={{ fontSize: 42, fontWeight: 'bold', color: '#1A1A1A', letterSpacing: -1 }}>
                {formatTime(timeLeft)}
              </Text>
              <Text style={{ fontSize: 12, color: '#8E948F', marginTop: 4, fontWeight: '600' }}>
                {focusEnergy < MINIMUM_FOCUS_ENERGY ? '⚠️ Butuh Istirahat' : isPaused ? '⏸️ Dijeda Sementara' : '🌿 Waktu Terus Berjalan'}
              </Text>
            </Animated.View>

            {/* Tombol Jeda / Lanjut Utama */}
            <Animated.View style={{ position: 'absolute', bottom: 0, transform: [{ scale: playBtnScale }] }}>
              <TouchableOpacity
                onPress={togglePlayPause}
                onMouseEnter={() => handleBtnHoverIn(playBtnScale)}
                onMouseLeave={() => handleBtnHoverOut(playBtnScale)}
                disabled={focusEnergy < MINIMUM_FOCUS_ENERGY}
                activeOpacity={0.9}
                style={{
                  backgroundColor: focusEnergy < MINIMUM_FOCUS_ENERGY ? '#B8BDB8' : '#354E41',
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 6,
                  borderColor: '#FAF8F5',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                {isPaused || focusEnergy < MINIMUM_FOCUS_ENERGY ? <PlayIcon /> : <PauseIcon />}
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700', marginTop: 2, letterSpacing: 1 }}>
                  {focusEnergy < MINIMUM_FOCUS_ENERGY ? 'TERKUNCI' : isPaused ? 'LANJUT' : 'JEDA'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Status Ponsel Menghadap Bawah */}
        <View style={{ backgroundColor: '#EAE5DC', borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 8 }}>
          <Text style={{ fontSize: 16 }}>🛡️</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#354E41' }}>
            Ponsel Menghadap Bawah — Aman dari Distraksi
          </Text>
        </View>

        {/* Suara Latar Belakang Card */}
        <View style={{ backgroundColor: '#F5F3EF', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>🔊</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A1A' }}>Suara Hujan Menenangkan</Text>
            <Text style={{ fontSize: 11, color: '#757575', marginTop: 2 }}>Suara Latar Penenang Pikiran</Text>
          </View>
          <View style={{ backgroundColor: '#EAE5DC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#2C4E3F' }}>Aktif</Text>
          </View>
        </View>

        {/* Tombol Kontrol Bawah */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {onCancelSession && (
            <TouchableOpacity
              onPress={handleCancelSession}
              disabled={isCancelling || isCompleting}
              style={{
                flex: 1,
                backgroundColor: '#F5F3EF',
                height: 50,
                borderRadius: 25,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isCancelling || isCompleting ? 0.5 : 1,
              }}
            >
              <Text style={{ fontWeight: '700', color: '#D93838', fontSize: 13 }}>
                {isCancelling ? 'Membatalkan...' : '✕ Batalkan'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleCompleteSessionInDB}
            disabled={focusEnergy < MINIMUM_FOCUS_ENERGY || isCompleting}
            activeOpacity={0.9}
            style={{
              flex: 2,
              backgroundColor: focusEnergy < MINIMUM_FOCUS_ENERGY ? '#B8BDB8' : '#354E41',
              height: 50,
              borderRadius: 25,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#354E41',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>Selesaikan Sesi →</Text>
          </TouchableOpacity>
        </View>

        {/* Filosofi Kairo Card */}
        <View style={{ backgroundColor: '#FAF5EE', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F0EBE1' }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#8E948F', letterSpacing: 0.8, marginBottom: 4 }}>
            FILOSOFI KAIRO
          </Text>
          <Text style={{ fontSize: 12, color: '#555555', fontStyle: 'italic', lineHeight: 18 }}>
            "Ketenangan pikiran hadir ketika kita menikmati setiap proses yang sedang dikerjakan tanpa terburu-buru."
          </Text>
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0EBE1', paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'space-around', zIndex: 20 }}>
        {[
          { name: 'Fokus', icon: '⏱️' },
          { name: 'Sesi Aktif', icon: '🔍' },
          { name: 'Istirahat', icon: '🌿' },
          { name: 'Reward', icon: '🎁' },
          { name: 'Statistik', icon: '📊' },
        ].map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => {
                setActiveTab(tab.name);
                if (tab.name === 'Fokus') {
                  handleDashboardNav();
                } else if (tab.name === 'Istirahat') {
                  handleBreakNav();
                } else if (tab.name === 'Reward' && onNavigateToReward) {
                  onNavigateToReward();
                } else if (tab.name === 'Statistik' && onNavigateToStatistics) {
                  onNavigateToStatistics();
                } else if (onNavigateToTab) {
                  onNavigateToTab(tab.name);
                }
              }}
              style={{ alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 18, opacity: isActive ? 1 : 0.5 }}>{tab.icon}</Text>
              <Text style={{ fontSize: 11, fontWeight: isActive ? '800' : '500', color: isActive ? '#354E41' : '#8E948F', marginTop: 4 }}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}