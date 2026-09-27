import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../config/AuthContext';
import api from '../config/api';

// --- Konstanta Energi Baterai ---
const MAX_ENERGY = 150;
const MIN_ENERGY_TO_REST = 30;
const MuteIcon = () => (
  <View style={{ width: 20, height: 20, marginRight: 12 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#8E8E93" strokeWidth="2" width="100%" height="100%">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  </View>
);

const RingIcon = () => (
  <View style={{ width: 20, height: 20, marginRight: 12 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#354E41" strokeWidth="2" width="100%" height="100%">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  </View>
);

const DndIcon = () => (
  <View style={{ width: 20, height: 20, marginRight: 12 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#D93838" strokeWidth="2" width="100%" height="100%">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
    </svg>
  </View>
);

const BatteryChargingIcon = () => (
  <View style={{ width: 18, height: 18, marginRight: 8 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#354E41" strokeWidth="2" width="100%" height="100%">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  </View>
);

const CheckCircleIcon = () => (
  <View style={{ width: 20, height: 20 }}>
    <svg viewBox="0 0 24 24" fill="#354E41" width="100%" height="100%">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  </View>
);

const PlayIcon = () => (
  <View style={{ width: 24, height: 24, marginLeft: 4 }}>
    <svg viewBox="0 0 24 24" fill="white" width="100%" height="100%">
      <path d="M8 5v14l11-7z" />
    </svg>
  </View>
);

const PauseIcon = () => (
  <View style={{ width: 24, height: 24 }}>
    <svg viewBox="0 0 24 24" fill="white" width="100%" height="100%">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  </View>
);

export default function BreakScreen({
  breakDurationMinutes,
  onNextSession,
  onFinishDay,
  onNavigateToFocus,
  onNavigateToDashboard,
  onNavigateToReward,
  onNavigateToStatistics,
}) {
  const { user, logout } = useContext(AuthContext);

  // States
  const [selectedTip, setSelectedTip] = useState(0);
  const [soundMode, setSoundMode] = useState('senyap'); // 'senyap' | 'dnd' | 'dering'

  // Timer States (Gunakan breakDurationMinutes jika ada, jika tidak default ke 5 Menit = 300 detik)
  const numericBreakDuration = Number(breakDurationMinutes);
  const validBreakDuration = Number.isFinite(numericBreakDuration) && numericBreakDuration > 0
    ? numericBreakDuration
    : 5;
  const [timeLeft, setTimeLeft] = useState(() => validBreakDuration * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Database batterai_energi & points States
  const [batteraiEnergi, setBatteraiEnergi] = useState(60);
  const [points, setPoints] = useState(0);
  const [loadingEnergy, setLoadingEnergy] = useState(true);

  // Animated Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgScale1 = useRef(new Animated.Value(1)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const actionBtnScale = useRef(new Animated.Value(1)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;

  // Sinkronisasi ulang jika durasi istirahat berubah
  useEffect(() => {
    setTimeLeft(validBreakDuration * 60);
  }, [validBreakDuration]);

  // Fetch Sisa Energi dari Database Sesi Backend
  const loadBreakDataFromDatabase = async () => {
    try {
      setLoadingEnergy(true);
      const res = await api.get('/sessions');

      if (res.data && res.data.success) {
        if (res.data.batterai_energi !== undefined) {
          setBatteraiEnergi(res.data.batterai_energi);
        } else {
          const sessions = res.data.data;
          let calculatedEnergy = 60;
          if (sessions && sessions.length > 0) {
            const totalFocusMinutes = sessions.reduce((acc, curr) => acc + (curr.durationMinutes || 25), 0);
            calculatedEnergy = Math.min(MAX_ENERGY, Math.max(15, 100 - (totalFocusMinutes % 100)));
          }
          setBatteraiEnergi(calculatedEnergy);
        }
        if (res.data.points !== undefined) {
          setPoints(res.data.points);
        }
      }
    } catch (err) {
      console.log('Gagal memuat batterai_energi dari database:', err.message);
    } finally {
      setLoadingEnergy(false);
    }
  };

  // Fungsi tambah energi per 1 menit ke endpoint /break-energy
  const handleUpdateBreakEnergyToDB = async () => {
    if (batteraiEnergi >= MAX_ENERGY) {
      return;
    }
    try {
      const res = await api.post('/break-energy', { addedEnergy: 4 });
      
      if (res.data && res.data.success) {
        if (res.data.batterai_energi !== undefined) {
          setBatteraiEnergi(res.data.batterai_energi);
        } else {
          setBatteraiEnergi((prev) => Math.min(MAX_ENERGY, prev + 4));
        }
      }
    } catch (err) {
      if (err.response?.data?.canRest === false) {
        return;
      }
      console.log('Gagal menambah batterai_energi break:', err.message);
      setBatteraiEnergi((prev) => Math.min(MAX_ENERGY, prev + 4));
    }
  };

  // Efek Timer Countdown & Validasi tiap 1 menit (bertambah 4%)
  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          const nextTime = prevTime - 1;
          
          if (nextTime > 0 && nextTime % 60 === 0) {
            handleUpdateBreakEnergyToDB();
          }

          return nextTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const cycleSoundMode = () => {
    if (soundMode === 'senyap') setSoundMode('dnd');
    else if (soundMode === 'dnd') setSoundMode('dering');
    else setSoundMode('senyap');
  };

  useEffect(() => {
    loadBreakDataFromDatabase();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();

    // Floating Orbs Animation
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

    // Breathing Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.08, duration: 4000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(breathAnim, { toValue: 1, duration: 4000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, []);

  const handleBtnHoverIn = (animVal) => {
    Animated.spring(animVal, { toValue: 1.05, friction: 5, tension: 100, useNativeDriver: true }).start();
  };

  const handleBtnHoverOut = (animVal) => {
    Animated.spring(animVal, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }).start();
  };

  const translateY1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, -45] });
  const translateY2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, 50] });

  const tipsData = [
    { id: 0, title: 'Minum Segelas Air', desc: 'Hidrasi melancarkan sirkulasi oksigen ke otak dan menjaga kecerdasan pikiran.', tag: null, icon: '💧' },
    { id: 1, title: 'Istirahatkan Mata', desc: 'Pandang kejauhan sebentar biar mata tidak lelah dan kembali segar.', tag: 'Mata Sehat', icon: '👀' },
    { id: 2, title: 'Peregangan Bahu & Leher', desc: 'Putar bahu ke belakang perlahan untuk melepaskan beban otot dari duduk.', tag: 'Postur', icon: '🧘' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F5', overflow: 'hidden' }}>
      
      {/* Background Floating Ambient Orbs */}
      <Animated.View style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: '#CDE5DD', opacity: 0.65, transform: [{ translateY: translateY1 }, { scale: bgScale1 }] }} />
      <Animated.View style={{ position: 'absolute', bottom: -100, right: -80, width: 360, height: 360, borderRadius: 180, backgroundColor: '#E8DFD1', opacity: 0.75, transform: [{ translateY: translateY2 }] }} />

      {/* Top Bar Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F0EBE1', backgroundColor: 'rgba(250, 248, 245, 0.95)', zIndex: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EDE9E2', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16 }}>🌿</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1B3022', letterSpacing: -0.3 }}>ChronoFocused</Text>
            <Text style={{ fontSize: 11, color: '#8E948F', fontWeight: '500' }}>Istirahat ({validBreakDuration}m)</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAE5DC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 4 }}>
            <Text style={{ fontSize: 12 }}>⚡</Text>
            {loadingEnergy ? (
              <ActivityIndicator size="small" color="#354E41" />
            ) : (
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#2C4E3F' }}>{batteraiEnergi}%</Text>
            )}
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
        
        {/* Lingkaran Breathing Circle Animated Timer */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center', marginBottom: 24, marginTop: 10 }}>
          <View style={{ position: 'relative', alignItems: 'center', width: '100%', paddingBottom: 40 }}>
            <Animated.View
              style={{
                width: 250,
                height: 250,
                borderRadius: 125,
                borderWidth: 12,
                borderColor: '#CDE5DD',
                justifyContent: 'center',
                alignItems: 'center',
                transform: [{ scale: breathAnim }],
                backgroundColor: 'rgba(250, 248, 245, 0.8)',
                shadowColor: '#354E41',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 15,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#354E41', letterSpacing: 1, marginBottom: 4 }}>
                TARIK NAPAS & LEPASKAN
              </Text>
              <Text style={{ fontSize: 56, fontWeight: '300', color: '#1A1A1A', fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-thin' }}>
                {formatTime(timeLeft)}
              </Text>
              <Text style={{ fontSize: 12, color: '#8E948F', marginTop: 4, fontWeight: '500' }}>
                ♨️ Istirahat: {validBreakDuration} Menit
              </Text>
            </Animated.View>

            {/* Play/Pause Button */}
            <Animated.View style={{ position: 'absolute', bottom: 0, transform: [{ scale: playBtnScale }] }}>
              <TouchableOpacity
                onPress={() => setIsRunning(!isRunning)}
                onMouseEnter={() => batteraiEnergi < MAX_ENERGY && handleBtnHoverIn(playBtnScale)}
                onMouseLeave={() => handleBtnHoverOut(playBtnScale)}
                activeOpacity={0.9}
                disabled={batteraiEnergi >= MAX_ENERGY}
                style={{
                  backgroundColor: batteraiEnergi >= MAX_ENERGY ? '#B8BDB8' : '#354E41',
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 6,
                  borderColor: '#FAF8F5',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: batteraiEnergi >= MAX_ENERGY ? 0 : 0.15,
                  shadowRadius: 10,
                  elevation: batteraiEnergi >= MAX_ENERGY ? 0 : 5,
                }}
              >
                {batteraiEnergi >= MAX_ENERGY ? <PauseIcon /> : isRunning ? <PauseIcon /> : <PlayIcon />}
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 1 }}>
                  {batteraiEnergi >= MAX_ENERGY
                    ? 'PLN'
                    : isRunning ? 'PAUSE' : 'PLAY'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Card Pengaturan Mode Suara */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={cycleSoundMode}
          style={{ backgroundColor: '#F5F3EF', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}
        >
          {soundMode === 'senyap' && <MuteIcon />}
          {soundMode === 'dnd' && <DndIcon />}
          {soundMode === 'dering' && <RingIcon />}

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A1A' }}>
              {soundMode === 'senyap' && 'Suara Tenang Dimatikan Sementara'}
              {soundMode === 'dnd' && 'Mode Jangan Ganggu (DND) Aktif'}
              {soundMode === 'dering' && 'Suara & Notifikasi Dering Aktif'}
            </Text>
            <Text style={{ fontSize: 11, color: '#757575', marginTop: 2 }}>
              {soundMode === 'senyap' && 'Otomatis senyap agar istirahat lebih tenang'}
              {soundMode === 'dnd' && 'Panggilan & pesan diblokir selama istirahat'}
              {soundMode === 'dering' && 'Semua notifications masuk seperti biasa'}
            </Text>
          </View>

          <View style={{ backgroundColor: '#EAE5DC', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: soundMode === 'dnd' ? '#D93838' : '#354E41' }}>
              {soundMode === 'senyap' && '● Senyap'}
              {soundMode === 'dnd' && '🚫 Jangan Ganggu'}
              {soundMode === 'dering' && '🔔 Dering'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Card Sisa Batterai Energi */}
        <View style={{ backgroundColor: '#FAF5EE', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F0EBE1', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BatteryChargingIcon />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A1A' }}>Batterai Energi</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#354E41' }}>{batteraiEnergi}% Kapasitas</Text>
          </View>
          
          <View style={{ height: 8, backgroundColor: '#EAE5DC', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
            <View style={{ width: `${Math.min(batteraiEnergi, 100)}%`, height: '100%', backgroundColor: '#354E41', borderRadius: 4 }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#8E948F' }}>
              {batteraiEnergi >= MAX_ENERGY
                ? '⚠️ Baterai penuh (150%). Istirahat tidak dapat menambah energi.'
                : 'Bertambah 4% setiap 1 menit istirahat'}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#1A1A1A' }}>
              {batteraiEnergi >= MAX_ENERGY
                ? '🚫 Istirahat Diblokir'
                : batteraiEnergi < 40 ? '⚠️ Energi menipis, istirahatkan pikiran' : '⚡ Energi pulih dengan baik'}
            </Text>
          </View>
        </View>

        {/* Tips Istirahat Sejenak Section */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 16 }}>🍃</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>Tips Istirahat Sejenak</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#8E948F' }}>Pilih Satu</Text>
          </View>

          {tipsData.map((tip) => {
            const isSelected = selectedTip === tip.id;
            return (
              <TouchableOpacity
                key={tip.id}
                activeOpacity={0.8}
                onPress={() => setSelectedTip(tip.id)}
                style={{
                  backgroundColor: '#F5F3EF',
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: isSelected ? 1 : 0,
                  borderColor: '#354E41',
                }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#EDE9E2', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  <Text style={{ fontSize: 24 }}>{tip.icon}</Text>
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#1A1A1A' }}>{tip.title}</Text>
                    {tip.tag && (
                      <View style={{ backgroundColor: '#EAE5DC', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#757575' }}>{tip.tag}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: '#757575', lineHeight: 17 }}>{tip.desc}</Text>
                </View>
                {isSelected && <CheckCircleIcon />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tombol Utama: Mulai Sesi Belajar Berikutnya */}
        <Animated.View style={{ transform: [{ scale: actionBtnScale }], marginBottom: 12 }}>
          <TouchableOpacity
            onPress={onNextSession}
            activeOpacity={0.9}
            onMouseEnter={() => handleBtnHoverIn(actionBtnScale)}
            onMouseLeave={() => handleBtnHoverOut(actionBtnScale)}
            style={{
              backgroundColor: '#354E41',
              height: 56,
              borderRadius: 28,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              shadowColor: '#354E41',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>Mulai Sesi Belajar Berikutnya</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 16 }}>→</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={{ fontSize: 11, color: '#8E948F', textAlign: 'center', marginBottom: 14 }}>
          Target: Sesi Lanjutan
        </Text>

        {/* Tombol Sekunder: Selesai Belajar & Istirahat Hari Ini */}
        <TouchableOpacity
          onPress={onFinishDay}
          activeOpacity={0.8}
          style={{ backgroundColor: '#EAE5DC', height: 52, borderRadius: 26, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 20 }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#354E41' }}>✓ Selesai Belajar & Istirahat Hari Ini</Text>
        </TouchableOpacity>

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
          const isActive = tab.name === 'Istirahat';
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => {
                if (tab.name === 'Fokus' && onNavigateToDashboard) {
                  onNavigateToDashboard();
                } else if (tab.name === 'Sesi Aktif' && onNavigateToFocus) {
                  onNavigateToFocus();
                } else if (tab.name === 'Reward' && onNavigateToReward) {
                  onNavigateToReward();
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