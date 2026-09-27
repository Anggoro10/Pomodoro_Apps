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
  Alert,
} from 'react-native';
import { AuthContext } from '../config/AuthContext';
import api from '../config/api';

const MAX_ENERGY = 150;
const POINTS_PER_SESSION = 5;

const DiamondIcon = () => (
  <View style={{ width: 16, height: 16, marginRight: 4 }}>
    <svg viewBox="0 0 24 24" fill="#4A90E2" width="100%" height="100%">
      <path d="M12 2l4 6h6l-5 4 1.5 6L12 16l-7.5 4L7 12 2 8h6z" />
    </svg>
  </View>
);

const REWARD_META = [
  { id: 'energy_10', label: '10% Baterai Energi', energy: 10, cost: 45, icon: '🔋', desc: `+10% baterai energi` },
  { id: 'energy_25', label: '25% Baterai Energi', energy: 25, cost: 80, icon: '⚡', desc: `+25% baterai energi` },
  { id: 'energy_50', label: '50% Baterai Energi', energy: 50, cost: 150, icon: '🔌', desc: `+50% baterai energi` },
  { id: 'energy_random', label: 'Random 30%-50% Baterai Energi', energy: null, cost: 100, isRandom: true, icon: '🎲', desc: `Energi acak 30%-50%` },
];

export default function RewardsScreen({ onNavigateToDashboard, onNavigateToFocus, onNavigateToBreak, onNavigateToStatistics }) {
  const { user, logout } = useContext(AuthContext);

  const [points, setPoints] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgScale1 = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const loadUserData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rewards');
      if (res.data && res.data.success) {
        setPoints(res.data.userPoints ?? 0);
        setEnergy(res.data.userEnergy ?? 100);
        setRewards(res.data.rewards ?? []);
      }
    } catch (err) {
      try {
        const fallback = await api.get('/sessions');
        if (fallback.data && fallback.data.success) {
          setPoints(fallback.data.points ?? 0);
          setEnergy(fallback.data.batterai_energi ?? 100);
        }
      } catch (e2) {
        console.log('Gagal memuat data reward:', e2.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();

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

  const handleRedeem = async (reward) => {
    if (redeemingId) return;
    if (points < reward.cost) {
      Alert.alert('Point Tidak Cukup', `Reward ini membutuhkan ${reward.cost} point. Kamu punya ${points} point.`);
      return;
    }
    if (energy >= MAX_ENERGY) {
      Alert.alert('Baterai Sudah Penuh', `Baterai energi kamu sudah ${energy}% (maksimal ${MAX_ENERGY}%). Tukarkan nanti setelah energi turun.`);
      return;
    }

    setRedeemingId(reward.id);
    try {
      const res = await api.post('/rewards/redeem', { rewardId: reward.id });
      if (res.data && res.data.success) {
        setPoints(res.data.points);
        setEnergy(res.data.batterai_energi);
        const gained = res.data.energyGained ?? 0;
        const rewardLabel = reward.isRandom ? 'Random Energi' : reward.label;
        const fullMessage = `Point sukses di-redeem! 🎉\n\nKamu menukarkan ${res.data.pointsSpent ?? reward.cost} point untuk ${rewardLabel}.\nKamu mendapatkan tambahan baterai energi sebanyak +${gained}%.\n\nTotal baterai energi kamu sekarang: ${res.data.batterai_energi}% / ${MAX_ENERGY}%.`;
        if (Platform.OS === 'web') {
          window.alert(fullMessage);
        } else {
          Alert.alert(
            'Redeem Berhasil!',
            fullMessage,
            [{ text: 'OK', onPress: () => {} }],
            { cancelable: false }
          );
        }
      } else {
        if (res.data?.canRedeem === false && res.data?.userEnergy !== undefined) {
          setEnergy(res.data.userEnergy);
          Alert.alert('Baterai Sudah Penuh', res.data.message);
        } else if (res.data?.userPoints !== undefined) {
          setPoints(res.data.userPoints);
          Alert.alert('Gagal', res.data?.message || 'Gagal menukarkan reward.');
        } else {
          Alert.alert('Gagal', res.data?.message || 'Gagal menukarkan reward.');
        }
      }
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.canRedeem === false && resp?.userEnergy !== undefined) {
        setEnergy(resp.userEnergy);
        Alert.alert('Baterai Sudah Penuh', resp.message);
      } else if (resp?.userPoints !== undefined) {
        setPoints(resp.userPoints);
        Alert.alert('Gagal', resp?.message || 'Gagal menukarkan reward.');
      } else {
        const msg = resp?.message || 'Gagal menukarkan reward.';
        Alert.alert('Gagal', msg);
      }
    } finally {
      setRedeemingId(null);
    }
  };

  const handleBtnHoverIn = (animVal) => {
    Animated.spring(animVal, { toValue: 1.05, friction: 5, tension: 100, useNativeDriver: true }).start();
  };

  const handleBtnHoverOut = (animVal) => {
    Animated.spring(animVal, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }).start();
  };

  const canAfford = (cost) => points >= cost;
  const isEnergyFull = energy >= MAX_ENERGY;

  const translateY1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, -45] });
  const translateY2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, 50] });

  const displayRewards = (rewards.length > 0 ? rewards : REWARD_META).map((r) => {
    const meta = REWARD_META.find((m) => m.id === r.id) || r;
    return { ...r, ...meta };
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

      {/* Top Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F0EBE1', backgroundColor: 'rgba(250, 248, 245, 0.95)', zIndex: 10 }}>
        <TouchableOpacity onPress={onNavigateToDashboard} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>←</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#354E41' }}>Kembali</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1B3022', letterSpacing: -0.3 }}>ChronoFocused</Text>
          <Text style={{ fontSize: 11, color: '#8E948F', fontWeight: '500' }}>Reward & Poin</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAE5DC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 4 }}>
            <DiamondIcon />
            {loading ? <ActivityIndicator size="small" color="#354E41" /> : <Text style={{ fontSize: 12, fontWeight: '700', color: '#2C4E3F' }}>{points} pt</Text>}
          </View>
          <TouchableOpacity onPress={logout} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#354E41', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 100, maxWidth: 480, alignSelf: 'center', width: '100%', zIndex: 5 }}>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginBottom: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 }}>
            🎁 Penukaran Reward
          </Text>
          <Text style={{ fontSize: 13, color: '#757575', textAlign: 'center', lineHeight: 18 }}>
            Setiap sesi fokus selesai memberi <Text style={{ fontWeight: '800', color: '#354E41' }}>{POINTS_PER_SESSION}</Text> point. Tukarkan untuk mengisi baterai energi!
          </Text>
        </Animated.View>

        {/* Points & Energy Summary Card */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], backgroundColor: '#EAE5DC', borderRadius: 24, padding: 18, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <DiamondIcon />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A1A' }}>Poin Reward Kamu</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#4A90E2' }}>{points} Point</Text>
          </View>

          <View style={{ height: 8, backgroundColor: '#D0C9BE', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <View style={{ width: `${Math.min(energy, 100)}%`, height: '100%', backgroundColor: energy < 40 ? '#D93838' : energy >= MAX_ENERGY ? '#6B9AFF' : '#354E41', borderRadius: 4 }} />
          </View>
          <Text style={{ fontSize: 11, color: '#8E948F', textAlign: 'center' }}>
            Baterai Energi: <Text style={{ fontWeight: '800', color: '#1A1A1A' }}>{energy}%</Text> / {MAX_ENERGY}%
          </Text>
        </Animated.View>

        {/* Energy Full Warning */}
        {isEnergyFull && (
          <View style={{ backgroundColor: '#E8F0FF', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#B8D4FF', marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18 }}>⚡</Text>
            <Text style={{ fontSize: 12, color: '#2C4E3F', flex: 1 }}>
              Baterai energi kamu sudah penuh ({MAX_ENERGY}%). Tukarkan poin setelah energi turun agar tidak boros!
            </Text>
          </View>
        )}

        {/* Daftar Reward */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 }}>Daftar Reward Tersedia</Text>
          {displayRewards.map((reward) => {
            const affordable = canAfford(reward.cost);
            const isLoading = redeemingId === reward.id;
            const rewardDisabled = !affordable || isEnergyFull || !!redeemingId;

            return (
              <Animated.View
                key={reward.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: affordable ? '#354E41' : '#D0C9BE',
                  opacity: !affordable ? 0.6 : 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 24 }}>{reward.icon}</Text>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#1A1A1A' }}>{reward.label}</Text>
                      <Text style={{ fontSize: 11, color: '#8E948F', marginTop: 2 }}>
                        {reward.isRandom ? 'Energi acak antara 30% - 50%' : `+${reward.energy}% baterei energi`}
                      </Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#EAE5DC', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <DiamondIcon />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#1A1A1A' }}>{reward.cost} pt</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleRedeem(reward)}
                  disabled={rewardDisabled}
                  activeOpacity={0.9}
                  style={{
                    backgroundColor: !affordable ? '#B8BDB8' : isEnergyFull ? '#B8BDB8' : '#354E41',
                    height: 48,
                    borderRadius: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                        {!affordable ? 'Point Tidak Cukup' : isEnergyFull ? 'Baterai Penuh' : 'Tukarkan'}
                      </Text>
                      <DiamondIcon />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Cara Dapat Poin */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], backgroundColor: '#FAF5EE', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#F0EBE1', marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#8E948F', letterSpacing: 0.8, marginBottom: 10 }}>
            CARA DAPATIN POIN
          </Text>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>✅</Text>
              <Text style={{ fontSize: 12, color: '#555555', flex: 1 }}>
                Selesaikan 1 sesi fokus = <Text style={{ fontWeight: '800', color: '#354E41' }}>{POINTS_PER_SESSION} point</Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>🔄</Text>
              <Text style={{ fontSize: 12, color: '#555555', flex: 1 }}>
                Tukarkan point untuk mengisi bateri energi kembali
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>⚡</Text>
              <Text style={{ fontSize: 12, color: '#555555', flex: 1 }}>
                Baterai energi maksimal: {MAX_ENERGY}% (150%)
              </Text>
            </View>
          </View>
        </Animated.View>

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
          const isActive = tab.name === 'Reward';
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => {
                if (tab.name === 'Fokus' && onNavigateToDashboard) {
                  onNavigateToDashboard();
                } else if (tab.name === 'Istirahat' && onNavigateToBreak) {
                  onNavigateToBreak();
                } else if (tab.name === 'Sesi Aktif' && onNavigateToFocus) {
                  onNavigateToFocus();
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
