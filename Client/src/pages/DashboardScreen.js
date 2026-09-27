import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Platform,
  Switch,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { AuthContext } from '../config/AuthContext';
import api from '../config/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- Pindahkan MINIMUM_FOCUS_ENERGY ke atas agar tidak error undefined ---
const MINIMUM_FOCUS_ENERGY = 30;
const MAX_ENERGY = 150;

// --- SVG Icons Helpers ---
const FlameIcon = () => (
  <View style={{ width: 14, height: 14, marginRight: 4 }}>
    <svg viewBox="0 0 24 24" fill="#FF6B00" width="100%" height="100%">
      <path d="M12 23c-4.97 0-9-4.03-9-9 0-4.08 3.05-7.44 7-8.77V7c0 1.66 1.34 3 3 3s3-1.34 3-3V3.53c4.14 1.25 7 5.1 7 9.47 0 4.97-4.03 9-9 9z"/>
    </svg>
  </View>
);

// Fungsi Kalkulasi Waktu Istirahat Dinamis: Setiap kelipatan 25 menit mendapatkan +5 menit istirahat
const calculateBreakTime = (focusMinutes) => {
  const multiplier = Math.ceil(focusMinutes / 25);
  return multiplier * 5;
};

const PhoneRotateIcon = () => (
  <View style={{ width: 20, height: 20, marginRight: 12 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#2C4E3F" strokeWidth="2" width="100%" height="100%">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  </View>
);

const ShieldLockIcon = () => (
  <View style={{ width: 20, height: 20, marginRight: 12 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#2C4E3F" strokeWidth="2" width="100%" height="100%">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  </View>
);

const SmallPhoneIcon = () => (
  <View style={{ width: 14, height: 14, marginRight: 6 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#8E948F" strokeWidth="2" width="100%" height="100%">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round" />
    </svg>
  </View>
);

const CheckSquareIcon = ({ isCompleted }) => (
  <View style={{ width: 22, height: 22, marginRight: 10 }}>
    <svg viewBox="0 0 24 24" fill={isCompleted ? "#2C4E3F" : "#A0A0A5"} width="100%" height="100%">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  </View>
);

export default function DashboardScreen({ onStartBreak, onStartFocus, onStartReward, onNavigateToStatistics }) {
  const { user, logout } = useContext(AuthContext);

  // States Dinamis dari API
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Input Timer States (Jam dan Menit)
  const [inputHours, setInputHours] = useState('0');
  const [inputMinutes, setInputMinutes] = useState('25');
  const [focusTotalMinutes, setFocusTotalMinutes] = useState(25);

  const [flipToStart, setFlipToStart] = useState(true);
  const [blockDistractions, setBlockDistractions] = useState(true);
  const [activeTab, setActiveTab] = useState('Fokus');
  
  // State Baterai Energi & Poin yang Tersinkronisasi dengan Database
  const [batteraiEnergi, setBatteraiEnergi] = useState(100);
  const [points, setPoints] = useState(0);
  const [isLoadingEnergy, setIsLoadingEnergy] = useState(true);

  // Modal State untuk Tambah Tugas Baru
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Matematika');
  const [selectedSesi, setSelectedSesi] = useState(2); // Default 2 Sesi (50 Menit)
  const [taskNotes, setTaskNotes] = useState('');
  const [reminderActive, setReminderActive] = useState(true);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // State untuk menyimpan tugas yang dipilih untuk mulai fokus
  const [selectedTaskForFocus, setSelectedTaskForFocus] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const startBtnScale = useRef(new Animated.Value(1)).current;

  // Background Ambient Floating Orbs
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgScale1 = useRef(new Animated.Value(1)).current;

  // Fungsi Kalkulasi Otomatis Jam & Menit saat User Ketik Manual
  const handleManualTimeUpdate = (hoursStr, minutesStr) => {
    const hrs = parseInt(hoursStr) || 0;
    const mins = parseInt(minutesStr) || 0;
    const totalMins = hrs * 60 + mins;

    // Batasi minimal 1 menit, maksimal 720 menit (12 jam)
    const validTotal = Math.max(1, Math.min(totalMins, 720));
    setFocusTotalMinutes(validTotal);
  };

  // Fungsi Fetch Data Dinamis (Tasks, Sessions, dan Energi)
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setIsLoadingEnergy(true);
      
      const [tasksRes, sessionsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/sessions'),
      ]);

      if (tasksRes.data && tasksRes.data.success) {
        setTasks(tasksRes.data.data);
      }
      
      if (sessionsRes.data && sessionsRes.data.success) {
        setSessions(sessionsRes.data.data);
        if (sessionsRes.data.batterai_energi !== undefined) {
          setBatteraiEnergi(sessionsRes.data.batterai_energi);
        }
        if (sessionsRes.data.points !== undefined) {
          setPoints(sessionsRes.data.points);
        }
      }
    } catch (err) {
      console.log('Error memuat data dashboard dari API:', err.message);
    } finally {
      setLoading(false);
      setIsLoadingEnergy(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(bgFloat1, {
            toValue: 1,
            duration: 3500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(bgFloat1, {
            toValue: 0,
            duration: 3500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
        ]),
        Animated.sequence([
          Animated.timing(bgScale1, {
            toValue: 1.25,
            duration: 3500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(bgScale1, {
            toValue: 1,
            duration: 3500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
        ]),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgFloat2, {
          toValue: 1,
          duration: 4500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(bgFloat2, {
          toValue: 0,
          duration: 4500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ])
    ).start();
  }, []);

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, {
        isCompleted: !currentStatus,
      });

      if (res.data && res.data.success) {
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            (t.id === taskId || t.taskId === taskId) ? { ...t, isCompleted: !currentStatus } : t
          )
        );
      }
    } catch (err) {
      alert('Gagal memperbarui status tugas.');
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      alert('Nama tugas / materi belajar wajib diisi.');
      return;
    }

    try {
      setIsSubmittingTask(true);
      const res = await api.post('/tasks', {
        title: newTaskTitle,
        category: selectedCategory,
        estimatedPomodoros: selectedSesi,
        notes: taskNotes,
      });

      if (res.data && res.data.success) {
        setIsModalVisible(false);
        setNewTaskTitle('');
        setTaskNotes('');
        loadDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan tugas ke database.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const canStartFocus = !isLoadingEnergy && batteraiEnergi >= MINIMUM_FOCUS_ENERGY;

  const handleRestNow = () => {
    if (batteraiEnergi >= MAX_ENERGY) {
      const message = `Energi baterai Anda sudah ${batteraiEnergi}% (maksimal ${MAX_ENERGY}%). Istirahat tidak dapat menambah energi saat ini.`;
      if (Platform.OS === 'web') {
        window.alert(`ChronoFocused\n\n${message}`);
      } else {
        Alert.alert('Energi Sudah Penuh', message, [{ text: 'OK' }]);
      }
      return;
    }
    if (onStartBreak) {
      onStartBreak(calculateBreakTime(focusTotalMinutes));
    }
  };

  const showLowEnergyAlert = () => {
    const message = `Energi baterai Anda ${batteraiEnergi}%. Sesi fokus membutuhkan minimal ${MINIMUM_FOCUS_ENERGY}% energi. Silakan ambil sesi istirahat terlebih dahulu.`;

    if (Platform.OS === 'web') {
      window.alert(`ChronoFocused\n\n${message}`);
    } else {
      Alert.alert('Energi Belum Cukup', message, [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Ambil Istirahat', onPress: handleRestNow },
      ]);
    }
  };

  const handleStartSession = () => {
    if (isLoadingEnergy) {
      return;
    }

    if (batteraiEnergi < MINIMUM_FOCUS_ENERGY) {
      showLowEnergyAlert();
      return;
    }

    if (onStartFocus) {
      onStartFocus({
        task: selectedTaskForFocus || tasks[0] || { title: 'Sesi Fokus Mandiri', category: 'Umum' },
        durationMinutes: focusTotalMinutes,
        breakDurationMinutes: calculateBreakTime(focusTotalMinutes),
      });
    }
  };

  const handleFocusTabPress = () => {
    if (!canStartFocus) {
      handleStartSession();
      return;
    }

    setActiveTab('Sesi Aktif');
    handleStartSession();
  };

  const handleBtnHoverIn = () => {
    Animated.spring(startBtnScale, {
      toValue: 1.02,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleBtnHoverOut = () => {
    Animated.spring(startBtnScale, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const translateY1 = bgFloat1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -45],
  });

  const translateY2 = bgFloat2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });

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
          transform: [{ translateY: translateY1 }, { scale: bgScale1 }],
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
          transform: [{ translateY: translateY2 }],
        }}
      />

      {/* Top Header Navigation */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: Platform.OS === 'ios' ? 50 : 16,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: '#F0EBE1',
          backgroundColor: 'rgba(250, 248, 245, 0.95)',
          zIndex: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EDE9E2', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16 }}>🌿</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1B3022', letterSpacing: -0.3 }}>
              ChronoFocused
            </Text>
            <Text style={{ fontSize: 11, color: '#8E948F', fontWeight: '500' }}>Fokus Workspace</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAE5DC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 4 }}>
            <Text style={{ fontSize: 12 }}>⚡</Text>
            {isLoadingEnergy ? (
              <ActivityIndicator size="small" color="#354E41" style={{ height: 14 }} />
            ) : (
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#2C4E3F' }}>{batteraiEnergi}%</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onStartReward}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAE5DC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 4 }}
          >
            <Text style={{ fontSize: 12 }}>💎</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2C4E3F' }}>{points} pt</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#354E41', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 100, maxWidth: 480, alignSelf: 'center', width: '100%', zIndex: 5 }}>
        
        {/* User Greeting */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 }}>
              Hello, {user?.name || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={{ fontSize: 14, color: '#757575', marginTop: 4 }}>
              Siap memulai sesi fokus hari ini?
            </Text>
          </View>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#EDE9E2', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 28 }}>☕</Text>
          </View>
        </Animated.View>

        {/* Kondisi Diri (Energi Fokus Card Tersinkronisasi) */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], backgroundColor: '#EAE5DC', borderRadius: 24, padding: 18, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#8E948F', letterSpacing: 0.8 }}>
                KONDISI DIRI (ATURAN POMODORO)
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>
                  Energi Fokus:
                </Text>
                {isLoadingEnergy ? (
                  <ActivityIndicator size="small" color="#354E41" />
                ) : (
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>{batteraiEnergi}%</Text>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16 }}>
              <FlameIcon />
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#1A1A1A' }}>{sessions.length || 0} Sesi</Text>
            </View>
          </View>

          {/* Level Progress Indicator Dinamis */}
          <View style={{ height: 10, backgroundColor: '#D0C9BE', borderRadius: 5, overflow: 'hidden', marginBottom: 14 }}>
            <View style={{ width: `${Math.min(batteraiEnergi, 100)}%`, height: '100%', backgroundColor: batteraiEnergi < 40 ? '#D93838' : batteraiEnergi >= MAX_ENERGY ? '#6B9AFF' : '#354E41', borderRadius: 5 }} />
          </View>

          <Text style={{ fontSize: 11, color: '#757575' }}>
            {batteraiEnergi >= MAX_ENERGY
              ? '⚡ Baterai energi sudah penuh (150%). Istirahat tidak dapat menambah energi.'
              : batteraiEnergi < 40 ? '⚠️ Baterai energi menipis! Segera ambil sesi istirahat untuk mengisi ulang.' : '⚡ Energi siap digunakan untuk belajar.'}
          </Text>
        </Animated.View>

        {/* Peringatan Energi Rendah */}
        {!isLoadingEnergy && batteraiEnergi < MINIMUM_FOCUS_ENERGY && (
          <View
            style={{
              backgroundColor: '#FDECEC',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: '#F3C2C2',
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 20 }}>⚠️</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#B42323' }}>
                Energi fokus belum mencukupi
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#7A2B2B', lineHeight: 18 }}>
              Sesi fokus membutuhkan minimal {MINIMUM_FOCUS_ENERGY}% energi. Ambil sesi istirahat terlebih dahulu agar baterai energi pulih.
            </Text>
            <TouchableOpacity
              onPress={handleRestNow}
              activeOpacity={0.9}
              style={{
                backgroundColor: '#D93838',
                borderRadius: 18,
                paddingVertical: 11,
                alignItems: 'center',
                marginTop: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                Ambil Sesi Istirahat
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- MANUAL TIME INPUT CONTAINER (JAM & MENIT) --- */}
        <View style={{ width: '100%', backgroundColor: '#EAE5DC', borderRadius: 24, padding: 18, marginBottom: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#8E948F', letterSpacing: 0.8, marginBottom: 12, textAlign: 'center' }}>
            ATUR WAKTU FOKUS MANUAL (JAM & MENIT)
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
            {/* Input Jam */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#757575', marginBottom: 4 }}>JAM</Text>
              <TextInput
                value={inputHours}
                onChangeText={(text) => {
                  setInputHours(text);
                  handleManualTimeUpdate(text, inputMinutes);
                }}
                keyboardType="numeric"
                maxLength={2}
                placeholder="0"
                placeholderTextColor="#A0A0A5"
                style={{
                  backgroundColor: '#FFFFFF',
                  width: 80,
                  height: 52,
                  borderRadius: 16,
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: '800',
                  color: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#D0C9BE',
                }}
              />
            </View>

            <Text style={{ fontSize: 24, fontWeight: '800', color: '#354E41', marginTop: 18 }}>:</Text>

            {/* Input Menit */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#757575', marginBottom: 4 }}>MENIT</Text>
              <TextInput
                value={inputMinutes}
                onChangeText={(text) => {
                  setInputMinutes(text);
                  handleManualTimeUpdate(inputHours, text);
                }}
                keyboardType="numeric"
                maxLength={3}
                placeholder="25"
                placeholderTextColor="#A0A0A5"
                style={{
                  backgroundColor: '#FFFFFF',
                  width: 80,
                  height: 52,
                  borderRadius: 16,
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: '800',
                  color: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#D0C9BE',
                }}
              />
            </View>
          </View>
          <Text style={{ fontSize: 11, color: '#757575', textAlign: 'center', marginTop: 12 }}>
            Total Durasi: <Text style={{ fontWeight: '800', color: '#354E41' }}>{focusTotalMinutes} Menit</Text> (Est. Istirahat: <Text style={{ fontWeight: '800', color: '#354E41' }}>{calculateBreakTime(focusTotalMinutes)} Menit</Text>)
          </Text>
        </View>

        {/* Aturan Fokus Card */}
        <View style={{ backgroundColor: '#FAF5EE', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#F0EBE1', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#8E948F', letterSpacing: 0.8 }}>
              ATURAN FOKUS
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#354E41' }}>
              🛡️ Mode Tenang
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
              <PhoneRotateIcon />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A' }}>
                  Balik Ponsel untuk Mulai
                </Text>
                <Text style={{ fontSize: 11, color: '#757575', marginTop: 2 }}>
                  Layar otomatis mulai saat HP ditengkurapkan
                </Text>
              </View>
            </View>
            <Switch
              value={flipToStart}
              onValueChange={setFlipToStart}
              trackColor={{ false: '#D0C9BE', true: '#354E41' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
              <ShieldLockIcon />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A' }}>
                  Kunci Aplikasi Pengganggu
                </Text>
                <Text style={{ fontSize: 11, color: '#757575', marginTop: 2 }}>
                  Blokir medsos dan notifikasi selama belajar
                </Text>
              </View>
            </View>
            <Switch
              value={blockDistractions}
              onValueChange={setBlockDistractions}
              trackColor={{ false: '#D0C9BE', true: '#354E41' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: '#EAE5DC', paddingTop: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, color: '#757575', fontWeight: '500' }}>Suara Penenang Belajar</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#354E41' }}>Hujan Lembut</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <SmallPhoneIcon />
              <Text style={{ fontSize: 11, color: '#8E948F', flex: 1 }}>
                Tengkurapkan HP setelah menekan tombol agar belajar lebih tenang
              </Text>
            </View>
          </View>
        </View>

        {/* Daftar Tugas Real dari Backend & Tombol Tambah */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>
                Daftar Tugas Hari Ini
              </Text>
              <View style={{ backgroundColor: '#EAE5DC', borderRadius: 10, width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#354E41' }}>{tasks.length}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIsModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, color: '#354E41', fontWeight: '700' }}>⊕ Tambah</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#354E41" style={{ marginVertical: 20 }} />
          ) : tasks.length === 0 ? (
            <View style={{ backgroundColor: '#EAE5DC', borderRadius: 20, padding: 18, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#757575' }}>Belum ada tugas di database. Klik tambah untuk membuat tugas baru!</Text>
            </View>
          ) : (
            tasks.map((task) => {
              const currentTaskId = task.id || task.taskId;
              const isSelected = selectedTaskForFocus && (selectedTaskForFocus.id === currentTaskId || selectedTaskForFocus.taskId === currentTaskId);
              
              return (
                <TouchableOpacity
                  key={currentTaskId}
                  activeOpacity={0.9}
                  onPress={() => setSelectedTaskForFocus(task)}
                  style={{
                    backgroundColor: isSelected ? '#D8E8DD' : '#EAE5DC',
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: '#354E41',
                    borderRadius: 20,
                    padding: 16,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
                      <TouchableOpacity onPress={() => toggleTaskCompletion(currentTaskId, task.isCompleted)}>
                        <CheckSquareIcon isCompleted={task.isCompleted} />
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>
                        <View style={{ backgroundColor: '#FFFFFF', alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12, marginBottom: 6 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#2C4E3F' }}>
                            {typeof task.category === 'object' ? task.category?.name : task.category || 'Matematika'}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#1A1A1A', textDecorationLine: task.isCompleted ? 'line-through' : 'none', opacity: task.isCompleted ? 0.6 : 1 }}>
                          {task.title}
                        </Text>
                        {task.notes ? <Text style={{ fontSize: 12, color: '#757575', marginTop: 4 }}>Catatan: {task.notes}</Text> : null}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Ruang Hening Card */}
        <View style={{ backgroundColor: '#ECEAE4', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#D8E8DD', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24 }}>🪴</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#1A1A1A' }}>
              Ruang Hening ChronoFocused
            </Text>
            <Text style={{ fontSize: 12, color: '#757575', marginTop: 2 }}>
              Satu tugas pada satu waktu. Nafas perlahan.
            </Text>
          </View>
        </View>

        {/* Main Action Start Session Button */}
        <Animated.View style={{ transform: [{ scale: startBtnScale }], marginBottom: 16 }}>
          <TouchableOpacity
            onPress={handleStartSession}
            disabled={isLoadingEnergy}
            activeOpacity={0.9}
            onMouseEnter={handleBtnHoverIn}
            onMouseLeave={handleBtnHoverOut}
            style={{
              backgroundColor: canStartFocus ? '#354E41' : '#B8BDB8',
              height: 56,
              borderRadius: 28,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
              opacity: canStartFocus ? 1 : 0.7,
              shadowColor: canStartFocus ? '#354E41' : 'transparent',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: canStartFocus ? 4 : 0,
            }}
          >
            <Ionicons name={canStartFocus ? 'play' : 'battery-charging'} size={18} color="#FFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>
              {canStartFocus
                ? `Mulai Sesi Fokus (${focusTotalMinutes}m) ${selectedTaskForFocus ? `- ${selectedTaskForFocus.title.substring(0, 15)}...` : ''}`
                : `Energi Minimal ${MINIMUM_FOCUS_ENERGY}%`}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <SmallPhoneIcon />
          <Text style={{ fontSize: 11, color: '#8E948F', textAlign: 'center' }}>
            Tengkurapkan HP setelah menekan tombol agar belajar lebih tenang
          </Text>
        </View>

      </ScrollView>

      {/* --- MODAL TAMBAH TUGAS BARU --- */}
      <Modal visible={isModalVisible} animationType="fade" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FAF8F5', width: '100%', maxWidth: 440, borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 }}>
            
            {/* Header Modal */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#354E41', letterSpacing: 0.8 }}>FOKUS SADAR</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginTop: 2 }}>Tambah Tugas Baru</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EAE5DC', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#757575', marginBottom: 20 }}>Tulis apa yang ingin kamu pelajari dengan tenang hari ini.</Text>

            {/* Nama Tugas Input */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#333333', marginBottom: 6 }}>Nama Tugas / Materi Belajar <Text style={{ color: '#D93838', fontSize: 10 }}>Wajib diisi</Text></Text>
            <TextInput
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder="Contoh: Latihan Soal Matematika Bab 4"
              placeholderTextColor="#A0A0A5"
              style={{ backgroundColor: '#F5F3EF', borderRadius: 16, paddingHorizontal: 16, height: 48, fontSize: 13, color: '#1A1A1A', marginBottom: 16 }}
            />

            {/* Kategori / Mata Pelajaran */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#333333', marginBottom: 8 }}>Kategori / Mata Pelajaran</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
              {['Matematika', 'Bahasa', 'Sains', 'Teknologi', 'Umum'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    backgroundColor: selectedCategory === cat ? '#354E41' : '#EAE5DC',
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: selectedCategory === cat ? '#FFFFFF' : '#333333' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Estimasi Sesi Pomodoro */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#333333' }}>Estimasi Sesi Pomodoro</Text>
              <Text style={{ fontSize: 10, color: '#8E948F' }}>1 Sesi = 25 Menit</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
              {[1, 2, 3, 4].map((sesi) => (
                <TouchableOpacity
                  key={sesi}
                  onPress={() => setSelectedSesi(sesi)}
                  style={{
                    flex: 1,
                    backgroundColor: selectedSesi === sesi ? '#354E41' : '#EAE5DC',
                    borderRadius: 14,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '800', color: selectedSesi === sesi ? '#FFFFFF' : '#1A1A1A' }}>{sesi} Sesi</Text>
                  <Text style={{ fontSize: 9, color: selectedSesi === sesi ? '#D8E8DD' : '#757575', marginTop: 2 }}>{sesi * 25} Menit</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Catatan Target Khusus */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#333333', marginBottom: 6 }}>Catatan Target Khusus <Text style={{ color: '#8E948F', fontWeight: '400' }}>Opsional</Text></Text>
            <TextInput
              value={taskNotes}
              onChangeText={setTaskNotes}
              placeholder="Contoh: Halaman 45-60, fokus rumus turunan..."
              placeholderTextColor="#A0A0A5"
              style={{ backgroundColor: '#F5F3EF', borderRadius: 16, paddingHorizontal: 16, height: 48, fontSize: 12, color: '#1A1A1A', marginBottom: 16 }}
            />

            {/* Toggle Pengingat Istirahat */}
            <View style={{ backgroundColor: '#F5F3EF', borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1A1A1A' }}>Aktifkan Pengingat Istirahat Khusus</Text>
                <Text style={{ fontSize: 10, color: '#757575', marginTop: 2 }}>Kairo akan memutar genta bernada lembut saat 25 menit usai.</Text>
              </View>
              <Switch
                value={reminderActive}
                onValueChange={setReminderActive}
                trackColor={{ false: '#D0C9BE', true: '#354E41' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Action Buttons Modal */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={{ flex: 1, backgroundColor: '#EAE5DC', height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '700', color: '#354E41', fontSize: 14 }}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateTask}
                disabled={isSubmittingTask}
                style={{ flex: 2, backgroundColor: '#354E41', height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}
              >
                {isSubmittingTask ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ fontWeight: '800', color: '#FFFFFF', fontSize: 14 }}>Simpan & Siapkan Sesi</Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0EBE1',
          paddingVertical: 10,
          paddingHorizontal: 16,
          justifyContent: 'space-around',
          zIndex: 20,
        }}
      >
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
                if (tab.name === 'Istirahat' && onStartBreak) {
                  if (batteraiEnergi >= MAX_ENERGY) {
                    const msg = `Energi baterai sudah ${batteraiEnergi}% (maksimal ${MAX_ENERGY}%). Istirahat tidak dapat menambah energi.`;
                    if (Platform.OS === 'web') {
                      window.alert(`ChronoFocused\n\n${msg}`);
                    } else {
                      Alert.alert('Energi Sudah Penuh', msg, [{ text: 'OK' }]);
                    }
                    return;
                  }
                  onStartBreak(calculateBreakTime(focusTotalMinutes));
                } else if (tab.name === 'Sesi Aktif') {
                  handleFocusTabPress();
                } else if (tab.name === 'Reward' && onStartReward) {
                  onStartReward();
                } else if (tab.name === 'Statistik' && onNavigateToStatistics) {
                  onNavigateToStatistics();
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