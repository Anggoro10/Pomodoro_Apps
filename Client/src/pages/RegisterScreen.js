import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  ScrollView,
} from 'react-native';
import api from '../config/api';

// SVG Helpers
const GoogleLogo = () => (
  <View style={{ width: 18, height: 18, marginRight: 8 }}>
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  </View>
);

const EyeIcon = ({ isOpen }) => (
  <View style={{ width: 20, height: 20 }}>
    {isOpen ? (
      <svg fill="none" viewBox="0 0 24 24" stroke="#8E8E93" strokeWidth="2" width="100%" height="100%">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
    ) : (
      <svg fill="none" viewBox="0 0 24 24" stroke="#8E8E93" strokeWidth="2" width="100%" height="100%">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.959 8.959 0 013.122-.563c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-2.498 4.01l-.001.001M3 3l18 18"/>
      </svg>
    )}
  </View>
);

const UserIcon = () => (
  <View style={{ width: 16, height: 16, marginRight: 8 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#333333" strokeWidth="2" width="100%" height="100%">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>
  </View>
);

const MailIcon = () => (
  <View style={{ width: 16, height: 16, marginRight: 8 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#333333" strokeWidth="2" width="100%" height="100%">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  </View>
);

const LockIcon = () => (
  <View style={{ width: 16, height: 16, marginRight: 8 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#333333" strokeWidth="2" width="100%" height="100%">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>
  </View>
);

const ShieldCheckIcon = () => (
  <View style={{ width: 22, height: 22 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#2C4E3F" strokeWidth="2" width="100%" height="100%">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  </View>
);

export default function RegisterScreen({ onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Animated Entrance Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  // Background Ambient Floating Animations (Lebih Jelas)
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgScale1 = useRef(new Animated.Value(1)).current;

  // Hover Animations
  const btnHoverScale = useRef(new Animated.Value(1)).current;
  const googleHoverScale = useRef(new Animated.Value(1)).current;
  const loginLinkScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
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

    // Loop Animasi Floating Background Diperjelas
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

  const handleHoverIn = (animValue, scaleTo = 1.025) => {
    Animated.spring(animValue, {
      toValue: scaleTo,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleHoverOut = (animValue) => {
    Animated.spring(animValue, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const showAlert = (title, message) => {
    const fullTitle = `ChronoFocused ${title}`;
    if (Platform.OS === 'web') {
      window.alert(`${fullTitle}: ${message}`);
    } else {
      Alert.alert(fullTitle, message);
    }
  };

  const checkEmailExists = async (targetEmail) => {
    try {
      const res = await api.post('/auth/check-email', { email: targetEmail });
      return res.data && res.data.exists;
    } catch (err) {
      console.log('Validasi email error:', err.message);
      return false;
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      showAlert('Perhatian', 'Harap masukkan nama panggilan Anda.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      showAlert('Perhatian', 'Harap masukkan alamat email yang valid.');
      return;
    }

    if (!password || password.length < 6) {
      showAlert('Perhatian', 'Kata sandi minimal 6 karakter.');
      return;
    }

    if (!agreeTerms) {
      showAlert('Perhatian', 'Anda harus menyetujui ketentuan ChronoFocused untuk mendaftar.');
      return;
    }

    setIsSubmitting(true);

    const isExist = await checkEmailExists(email.trim());
    if (isExist) {
      setIsSubmitting(false);
      setEmailError('Email ini sudah terdaftar di ChronoFocused.');
      showAlert('Gagal Mendaftar', 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.');
      return;
    }

    try {
      const res = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (res.data && res.data.success) {
        showAlert('Sukses', 'Akun ChronoFocused berhasil dibuat! Silakan masuk.');
        onSwitchToLogin();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mendaftar akun baru.';
      showAlert('Gagal Mendaftar', msg);
    } finally {
      setIsSubmitting(false);
    }
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
      
      {/* Enhanced Animated Ambient Orbs */}
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

      {/* Header Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: Platform.OS === 'ios' ? 50 : 20,
          paddingBottom: 15,
          borderBottomWidth: 1,
          borderBottomColor: '#F0EBE1',
          backgroundColor: 'rgba(250, 248, 245, 0.9)',
          zIndex: 10,
        }}
      >
        <TouchableOpacity onPress={onSwitchToLogin} style={{ padding: 4 }}>
          <Text style={{ fontSize: 18, color: '#333333', fontWeight: 'bold' }}>←</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1B3022', letterSpacing: 0.5 }}>
          ChronoFocused
        </Text>

        <TouchableOpacity
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#354E41',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14 }}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 24, zIndex: 5 }}>
        
        {/* Emblem Logo */}
        <Animated.View
          style={{
            width: 84,
            height: 84,
            borderRadius: 26,
            backgroundColor: '#EDE9E2',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            transform: [{ scale: logoScale }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
          }}
        >
          <Text style={{ fontSize: 36, color: '#354E41' }}>🌿</Text>
        </Animated.View>

        {/* Badge */}
        <View
          style={{
            backgroundColor: '#D8E8DD',
            paddingVertical: 6,
            paddingHorizontal: 16,
            borderRadius: 20,
            marginBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#2C4E3F', letterSpacing: 0.6 }}>
            🌿 RUANG FOKUS TENANG
          </Text>
        </View>

        {/* Title */}
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 8 }}>
          Mulai Belajar Lebih Tenang
        </Text>
        <Text style={{ fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 28, maxWidth: 320, lineHeight: 20 }}>
          Buat akun dalam sekejap untuk menyimpan riwayat belajarmu.
        </Text>

        {/* Form Card */}
        <Animated.View
          style={{
            width: '100%',
            maxWidth: 400,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Input Nama Panggilan */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <UserIcon />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#333333' }}>
                Nama Panggilan
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#F5F3EF',
                borderRadius: 24,
                paddingHorizontal: 18,
                height: 54,
                justifyContent: 'center',
              }}
            >
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Siapa namamu?"
                placeholderTextColor="#A0A0A5"
                style={{ fontSize: 14, color: '#1A1A1A' }}
              />
            </View>
            <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 6, marginLeft: 8 }}>
              Nama yang akan kami sapa setiap hari
            </Text>
          </View>

          {/* Input Email */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MailIcon />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#333333' }}>
                Alamat Email
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#F5F3EF',
                borderRadius: 24,
                paddingHorizontal: 18,
                height: 54,
                justifyContent: 'center',
                borderWidth: emailError ? 1 : 0,
                borderColor: '#D93838',
              }}
            >
              <TextInput
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (emailError) setEmailError('');
                }}
                placeholder="nama@email.com"
                placeholderTextColor="#A0A0A5"
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ fontSize: 14, color: '#1A1A1A' }}
              />
            </View>
            {emailError ? (
              <Text style={{ fontSize: 11, color: '#D93838', fontWeight: '600', marginTop: 4, marginLeft: 8 }}>
                {emailError}
              </Text>
            ) : null}
          </View>

          {/* Input Password */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <LockIcon />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#333333' }}>
                Kata Sandi
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#F5F3EF',
                borderRadius: 24,
                paddingHorizontal: 18,
                height: 54,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Minimal 6 karakter"
                placeholderTextColor="#A0A0A5"
                secureTextEntry={!showPassword}
                style={{ flex: 1, fontSize: 14, color: '#1A1A1A' }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <EyeIcon isOpen={showPassword} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Checkbox Ketentuan ChronoFocused */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setAgreeTerms(!agreeTerms)}
            style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, paddingRight: 10 }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 7,
                backgroundColor: agreeTerms ? '#354E41' : '#F5F3EF',
                borderWidth: agreeTerms ? 0 : 1,
                borderColor: '#D0C9BE',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
                marginTop: 2,
              }}
            >
              {agreeTerms && (
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
              )}
            </View>
            <Text style={{ flex: 1, fontSize: 13, color: '#4A4A4A', lineHeight: 18 }}>
              Saya setuju dengan cara belajar sehat dan ketentuan ChronoFocused
            </Text>
          </TouchableOpacity>

          {/* Tombol Buat Akun */}
          <Animated.View style={{ transform: [{ scale: btnHoverScale }] }}>
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.9}
              onMouseEnter={() => handleHoverIn(btnHoverScale, 1.025)}
              onMouseLeave={() => handleHoverOut(btnHoverScale)}
              style={{
                backgroundColor: '#354E41',
                height: 56,
                borderRadius: 28,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                    Buat Akun Saya
                  </Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 16 }}>→</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 22 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#EAE5DC' }} />
            <Text style={{ fontSize: 11, color: '#8E8E93', marginHorizontal: 12 }}>
              atau daftar langsung lewat
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#EAE5DC' }} />
          </View>

          {/* Google */}
          <Animated.View style={{ transform: [{ scale: googleHoverScale }], marginBottom: 24 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onMouseEnter={() => handleHoverIn(googleHoverScale, 1.02)}
              onMouseLeave={() => handleHoverOut(googleHoverScale)}
              style={{
                backgroundColor: '#F5F3EF',
                height: 52,
                borderRadius: 26,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <GoogleLogo />
              <Text style={{ color: '#1A1A1A', fontWeight: '600', fontSize: 14 }}>
                Daftar dengan Google
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Switch Link */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 13, color: '#666666' }}>
              Sudah punya akun?{' '}
              <Animated.View
                onMouseEnter={() => handleHoverIn(loginLinkScale, 1.08)}
                onMouseLeave={() => handleHoverOut(loginLinkScale)}
                style={{ display: 'inline-flex', transform: [{ scale: loginLinkScale }] }}
              >
                <Text
                  onPress={onSwitchToLogin}
                  style={{ color: '#354E41', fontWeight: '700' }}
                >
                  Masuk di sini ↗
                </Text>
              </Animated.View>
            </Text>
          </View>

          {/* Card Footer ChronoFocused */}
          <View
            style={{
              backgroundColor: '#ECEAE4',
              borderRadius: 20,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: '#D8E8DD',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ShieldCheckIcon />
            </View>
            <Text style={{ flex: 1, fontSize: 12, color: '#354E41', lineHeight: 17, fontWeight: '500' }}>
              ChronoFocused menjaga ketenangan pikiranmu.{'\n'}Tanpa spam, tanpa notifikasi berisik.
            </Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}