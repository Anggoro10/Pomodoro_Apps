import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { AuthContext } from '../config/AuthContext';
import api from '../config/api';
import Svg, { Rect, Text as SVGText, Line } from 'react-native-svg';

const formatMinutes = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}j ${m}m` : `${m} menit`;
};

const BarChart = ({ data, title, color, maxValue, labelColor, unit }) => {
  const chartHeight = 140;
  const barWidth = 30;
  const barGap = 8;
  const totalBarsWidth = data.length * barWidth + (data.length - 1) * barGap;
  const chartLeftPadding = 28;
  const chartRightPadding = 12;
  const svgWidth = chartLeftPadding + totalBarsWidth + chartRightPadding;
  const svgHeight = chartHeight + 40;

  const scale = (value) => {
    if (maxValue === 0) return 0;
    return Math.max(0, Math.min(1, value / maxValue));
  };

  return (
    <View style={{ width: '100%', marginBottom: 24 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#354E41', marginBottom: 10, textAlign: 'center' }}>
        {title}
      </Text>
      <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = chartHeight - scale(tick * maxValue / 100) * chartHeight;
          return (
            <React.Fragment key={tick}>
              <Line x1={chartLeftPadding - 6} y1={y} x2={chartLeftPadding} y2={y} stroke="#E0DCD7" strokeWidth={1} />
              <SVGText x={chartLeftPadding - 10} y={y + 4} fontSize={8} fill="#8E948F" textAnchor="end">
                {tick}%
              </SVGText>
              <Line x1={chartLeftPadding} y1={y} x2={svgWidth - chartRightPadding} y2={y} stroke="#F0EBE1" strokeWidth={1} />
            </React.Fragment>
          );
        })}
        <Line x1={chartLeftPadding} y1={chartHeight} x2={svgWidth - chartRightPadding} y2={chartHeight} stroke="#E0DCD7" strokeWidth={1} />
        {data.map((item, index) => {
          const bh = scale(item.value) * chartHeight;
          const x = chartLeftPadding + index * (barWidth + barGap);
          const y = chartHeight - bh;
          return (
            <React.Fragment key={item.label}>
              <Rect x={x} y={y} width={barWidth} height={bh} fill={item.value > 0 ? color : '#F0F0F0'} rx={4} ry={4} />
              {item.value > 0 && (
                <SVGText x={x + barWidth / 2} y={y - 5} fontSize={8} fill={labelColor} textAnchor="middle">
                  {item.value > 0 ? `${item.value}${unit}` : ''}
                </SVGText>
              )}
              <SVGText x={x + barWidth / 2} y={chartHeight + 16} fontSize={7} fill="#8E948F" textAnchor="middle">
                {item.label}
              </SVGText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const SummaryCard = ({ icon, title, value, subtitle, bgColor, textColor }) => (
  <View style={{ flex: 1, backgroundColor: bgColor, borderRadius: 16, padding: 16, alignItems: 'center', minHeight: 110 }}>
    <Text style={{ fontSize: 24, marginBottom: 6 }}>{icon}</Text>
    <Text style={{ fontSize: 9, fontWeight: '700', color: '#8E948F', textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {title}
    </Text>
    <Text style={{ fontSize: 18, fontWeight: '800', color: textColor || '#354E41', marginVertical: 2 }}>{value}</Text>
    <Text style={{ fontSize: 10, color: '#555555', textAlign: 'center' }}>{subtitle}</Text>
  </View>
);

export default function StatisticsScreen({
  onNavigateToDashboard,
  onNavigateToFocus,
  onNavigateToBreak,
  onNavigateToReward,
}) {
  const { user, logout } = useContext(AuthContext);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgScale1 = useRef(new Animated.Value(1)).current;

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/stats/sessions');
      if (res.data?.success) {
        setStats(res.data.data);
      } else {
        setError(res.data?.message || 'Gagal memuat statistik.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

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
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
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

  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}j ${m}mnt`;
    return `${m} menit`;
  };

  const prepareChartData = (data, key) => {
    if (!data || !Array.isArray(data)) return [];
    const last7 = data.slice(-7);
    return last7.map((item) => ({
      label: new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short' }),
      value: item[key],
    }));
  };

  const focusChartData = stats ? prepareChartData(stats.chartData, 'focus') : [];
  const breakChartData = stats ? prepareChartData(stats.chartData, 'break') : [];

  const maxFocusValue = Math.max(...focusChartData.map((d) => d.value), 60);
  const maxBreakValue = Math.max(...breakChartData.map((d) => d.value), 30);

  const translateY1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, -45] });
  const translateY2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, 50] });

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F5', overflow: 'hidden' }}>
      {/* Ambient Floating Orbs */}
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

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 15,
        borderBottomWidth: 1, borderBottomColor: '#F0EBE1', backgroundColor: 'rgba(250, 248, 245, 0.9)', zIndex: 10,
      }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1B3022', letterSpacing: 0.5 }}>
          Statistik
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: 20, paddingVertical: 20 }}>
          {/* Logo/Title */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Animated.View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#EDE9E2', justifyContent: 'center', alignItems: 'center', marginBottom: 12, transform: [{ scale: logoScale }] }}>
              <Text style={{ fontSize: 28, color: '#354E41' }}>📊</Text>
            </Animated.View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' }}>
              Statistik Fokus & Istirahat
            </Text>
            <Text style={{ fontSize: 13, color: '#757575', textAlign: 'center', marginTop: 4 }}>
              Pantau progres sesi fokus dan istirahat Anda
            </Text>
          </View>

          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color="#354E41" />
              <Text style={{ fontSize: 13, color: '#757575', marginTop: 12 }}>Memuat statistik...</Text>
            </View>
          ) : error ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 13, color: '#B42323', textAlign: 'center' }}>{error}</Text>
              <TouchableOpacity
                onPress={loadStats}
                style={{ marginTop: 16, backgroundColor: '#354E41', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Tab Selector */}
              <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 4, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: activeTab === 'overview' ? '#354E41' : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => setActiveTab('overview')}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === 'overview' ? '#FFFFFF' : '#8E948F' }}>Ringkasan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: activeTab === 'chart' ? '#354E41' : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => setActiveTab('chart')}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === 'chart' ? '#FFFFFF' : '#8E948F' }}>Grafik</Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'overview' && stats && (
                <>
                  {/* Focus Session Summary */}
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#354E41', marginBottom: 12 }}>📊 Sesi Fokus</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                    <SummaryCard
                      icon="🎯"
                      title="Jumlah Sesi"
                      value={stats.focus.totalSessions}
                      subtitle="Sesi fokus yang selesai"
                      bgColor="#E8F0FF"
                      textColor="#1A73E8"
                    />
                    <SummaryCard
                      icon="⏰"
                      title="Waktu Fokus"
                      value={formatDuration(stats.focus.totalMinutes)}
                      subtitle="Total waktu fokus"
                      bgColor="#E8F8F0"
                      textColor="#2C4E3F"
                    />
                  </View>
                  <Text style={{ fontSize: 12, color: '#555555', lineHeight: 18, marginBottom: 24 }}>
                    Anda telah menyelesaikan <Text style={{ fontWeight: '700' }}>{stats.focus.totalSessions}</Text> sesi fokus 
                    dengan total <Text style={{ fontWeight: '700' }}>{formatDuration(stats.focus.totalMinutes)}</Text>. 
                    Terus konsisten untuk meningkatkan produktivitas dan streak harian Anda!
                  </Text>

                  {/* Break Session Summary */}
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#2C4E3F', marginBottom: 12 }}>🌿 Sesi Istirahat</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                    <SummaryCard
                      icon="⚡"
                      title="Waktu Istirahat"
                      value={formatDuration(stats.break.totalMinutes)}
                      subtitle="Total waktu istirahat"
                      bgColor="#E8F5E9"
                      textColor="#2C4E3F"
                    />
                    <SummaryCard
                      icon="☕"
                      title="Jumlah Istirahat"
                      value={stats.break.totalSessions}
                      subtitle="Sesi istirahat yang dilakukan"
                      bgColor="#FFF3E0"
                      textColor="#FF9800"
                    />
                  </View>
                  <Text style={{ fontSize: 12, color: '#555555', lineHeight: 18, marginBottom: 8 }}>
                    Anda telah melakukan <Text style={{ fontWeight: '700' }}>{stats.break.totalSessions}</Text> sesi istirahat 
                    dengan total <Text style={{ fontWeight: '700' }}>{formatDuration(stats.break.totalMinutes)}</Text>. 
                    Istirahat yang cukup penting untuk memulihkan energi hingga maksimal 150%!
                  </Text>
                </>
              )}

              {activeTab === 'chart' && stats && (
                <>
                  {/* Focus Chart */}
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#354E41', marginBottom: 12 }}>📊 Sesi Fokus (7 Hari Terakhir)</Text>
                  <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
                    <BarChart
                      data={focusChartData}
                      title="Durasi Fokus per Hari"
                      color="#4A90D9"
                      maxValue={maxFocusValue}
                      labelColor="#4A90D9"
                      unit="m"
                    />
                    <View style={{ marginTop: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#354E41', marginBottom: 4 }}>Deskripsi:</Text>
                      <Text style={{ fontSize: 11, color: '#555555', lineHeight: 16 }}>
                        Diagram di atas menampilkan durasi sesi fokus per hari selama 7 hari terakhir. 
                        <Text style={{ fontWeight: '700' }}> Jumlah sesi fokus: {stats.focus.totalSessions}</Text> | 
                        <Text style={{ fontWeight: '700' }}> Total waktu fokus: {formatDuration(stats.focus.totalMinutes)}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Break Chart */}
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#2C4E3F', marginBottom: 12 }}>🌿 Sesi Istirahat (7 Hari Terakhir)</Text>
                  <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
                    <BarChart
                      data={breakChartData}
                      title="Durasi Istirahat per Hari"
                      color="#2C4E3F"
                      maxValue={maxBreakValue}
                      labelColor="#2C4E3F"
                      unit="m"
                    />
                    <View style={{ marginTop: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#2C4E3F', marginBottom: 4 }}>Deskripsi:</Text>
                      <Text style={{ fontSize: 11, color: '#555555', lineHeight: 16 }}>
                        Diagram di atas menampilkan durasi sesi istirahat per hari selama 7 hari terakhir. 
                        <Text style={{ fontWeight: '700' }}> Total waktu istirahat: {formatDuration(stats.break.totalMinutes)}</Text> | 
                        <Text style={{ fontWeight: '700' }}> Jumlah istirahat: {stats.break.totalSessions}</Text>
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
        backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0EBE1',
        paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'space-around', zIndex: 20,
      }}>
        {[
          { name: 'Fokus', icon: '⏱️' },
          { name: 'Sesi Aktif', icon: '🔍' },
          { name: 'Istirahat', icon: '🌿' },
          { name: 'Reward', icon: '🎁' },
          { name: 'Statistik', icon: '📊' },
        ].map((tab) => {
          const isActive = tab.name === 'Statistik';
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => {
                if (tab.name === 'Fokus' && onNavigateToDashboard) {
                  onNavigateToDashboard();
                } else if (tab.name === 'Sesi Aktif' && onNavigateToFocus) {
                  onNavigateToFocus();
                } else if (tab.name === 'Istirahat' && onNavigateToBreak) {
                  onNavigateToBreak();
                } else if (tab.name === 'Reward' && onNavigateToReward) {
                  onNavigateToReward();
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
