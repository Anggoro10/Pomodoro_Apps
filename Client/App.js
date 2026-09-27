import React, { useState, useContext } from 'react';
import { SafeAreaView, StatusBar, View, ActivityIndicator } from 'react-native';
import { AuthProvider, AuthContext } from './src/config/AuthContext';
import api from './src/config/api';
import LoginScreen from './src/pages/LoginScreen';
import RegisterScreen from './src/pages/RegisterScreen';
import DashboardScreen from './src/pages/DashboardScreen';
import ActiveFocusScreen from './src/pages/ActiveFocusScreen';
import BreakScreen from './src/pages/BreakScreen';
import RewardsScreen from './src/pages/RewardsScreen';
import StatisticsScreen from './src/pages/StatisticsScreen';

function MainApp() {
  const { user, isLoading } = useContext(AuthContext);
  
  // State Navigasi
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'register'
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard' | 'activeFocus' | 'break' | 'reward' | 'statistics'
  
  // State untuk menyimpan data fokus lengkap (task & durationMinutes) dari dashboard
  const [currentFocusData, setCurrentFocusData] = useState(null);
  const [currentBreakDuration, setCurrentBreakDuration] = useState(5);

  const getBreakDuration = (value) => {
    const duration = typeof value === 'object' && value !== null
      ? value?.breakDurationMinutes
      : value;
    const numericDuration = Number(duration);

    return Number.isFinite(numericDuration) && numericDuration > 0
      ? numericDuration
      : 5;
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5' }}>
        <ActivityIndicator size="large" color="#354E41" />
      </View>
    );
  }

  // Jika Belum Login
  if (!user) {
    return authScreen === 'login' ? (
      <LoginScreen onSwitchToRegister={() => setAuthScreen('register')} />
    ) : (
      <RegisterScreen onSwitchToLogin={() => setAuthScreen('login')} />
    );
  }

  // Routing Berdasarkan currentScreen saat User sudah Login
  switch (currentScreen) {
    case 'activeFocus':
      return (
        <ActiveFocusScreen 
          focusData={currentFocusData} // Mengirimkan objek lengkap berisi durasi dinamis & task
          onSessionComplete={() => {
            setCurrentBreakDuration(getBreakDuration(currentFocusData));
            setCurrentScreen('break');
          }}
          onCancelSession={() => setCurrentScreen('dashboard')}
          onBackToDashboard={() => setCurrentScreen('dashboard')}
          onNavigateToDashboard={() => setCurrentScreen('dashboard')}
          onNavigateToBreak={() => {
            setCurrentBreakDuration(getBreakDuration(currentFocusData));
            setCurrentScreen('break');
          }}
          onNavigateToTab={(tabName) => {
              if (tabName === 'Fokus') setCurrentScreen('dashboard');
              if (tabName === 'Statistik') setCurrentScreen('statistics');
              if (tabName === 'Sesi Aktif') {
                setCurrentScreen('activeFocus');
              }
              if (tabName === 'Istirahat') {
                setCurrentBreakDuration(getBreakDuration(currentFocusData));
                setCurrentScreen('break');
              }
              if (tabName === 'Reward') setCurrentScreen('reward');
            }}
            onNavigateToReward={() => setCurrentScreen('reward')}
            onNavigateToStatistics={() => setCurrentScreen('statistics')}
          />
      );

    case 'break':
      return (
        <BreakScreen 
          breakDurationMinutes={currentBreakDuration}
         onNextSession={async () => {
           try {
             await api.post('/focus/break', { duration: currentBreakDuration });
           } catch (err) {
             console.log('Gagal mencatat sesi istirahat:', err.response?.data?.message || err.message);
           } finally {
             setCurrentScreen('dashboard');
           }
         }}
         onFinishDay={async () => {
           try {
             await api.post('/focus/break', { duration: currentBreakDuration });
           } catch (err) {
             console.log('Gagal mencatat sesi istirahat:', err.response?.data?.message || err.message);
           } finally {
             setCurrentScreen('dashboard');
           }
         }}
          onNavigateToDashboard={() => setCurrentScreen('dashboard')}
          onNavigateToFocus={() => setCurrentScreen('activeFocus')}
          onNavigateToReward={() => setCurrentScreen('reward')}
          onBackToDashboard={() => setCurrentScreen('dashboard')}
          onNavigateToTab={(tabName) => {
            if (tabName === 'Fokus') setCurrentScreen('dashboard');
            if (tabName === 'Statistik') setCurrentScreen('statistics');
            if (tabName === 'Sesi Aktif') setCurrentScreen('activeFocus');
            if (tabName === 'Reward') setCurrentScreen('reward');
          }}
          onNavigateToStatistics={() => setCurrentScreen('statistics')}
        />
      );

      case 'reward':
      return (
        <RewardsScreen 
          onNavigateToDashboard={() => setCurrentScreen('dashboard')}
          onNavigateToFocus={() => setCurrentScreen('activeFocus')}
          onNavigateToBreak={() => {
            setCurrentBreakDuration(getBreakDuration(currentFocusData));
            setCurrentScreen('break');
          }}
          onNavigateToStatistics={() => setCurrentScreen('statistics')}
        />
      );

    case 'statistics':
      return (
        <StatisticsScreen 
          onNavigateToDashboard={() => setCurrentScreen('dashboard')}
          onNavigateToFocus={() => setCurrentScreen('activeFocus')}
          onNavigateToBreak={() => {
            setCurrentBreakDuration(getBreakDuration(currentFocusData));
            setCurrentScreen('break');
          }}
          onNavigateToReward={() => setCurrentScreen('reward')}
        />
      );

    case 'dashboard':
    default:
      return (
        <DashboardScreen 
          onStartFocus={(data) => {
            setCurrentFocusData(data);
            setCurrentBreakDuration(getBreakDuration(data));
            setCurrentScreen('activeFocus'); // Pindah layar ke activeFocus
          }} 
          onStartBreak={(duration) => {
            setCurrentBreakDuration(getBreakDuration(duration));
            setCurrentScreen('break');
          }}
          onStartReward={() => setCurrentScreen('reward')}
          onNavigateToStatistics={() => setCurrentScreen('statistics')}
        />
      );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
        <MainApp />
      </SafeAreaView>
    </AuthProvider>
  );
}