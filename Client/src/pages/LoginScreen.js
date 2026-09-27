import React, { useState, useContext, useEffect, useRef } from 'react';
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
  Modal,
} from 'react-native';
import { AuthContext } from '../config/AuthContext';
import api from '../config/api';

// SVG Helpers using inline SVG elements
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

const AppleLogo = () => (
  <View style={{ width: 18, height: 18, marginRight: 8 }}>
    <svg viewBox="0 0 170 170" width="100%" height="100%">
      <path fill="#000000" d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.72.13-9.61-1.95-14.67-6.23-3.23-2.76-7.1-7.44-11.62-14.04-6.3-9.15-11.29-19.46-14.97-30.93-3.68-11.47-5.52-22.61-5.52-33.42 0-13.19 3.18-24.23 9.53-33.12 6.35-8.89 14.53-13.43 24.55-13.62 4.58 0 9.77 1.15 15.57 3.45 5.8 2.3 9.87 3.45 12.21 3.45 1.9 0 6.07-1.2 12.52-3.6 6.45-2.4 11.66-3.5 15.63-3.3 9.68.38 17.65 3.99 23.9 10.83-21.7 13.04-20.94 36.19 2.29 46.59-4.8 11.85-11.13 23.49-18.98 34.92zm-28.71-104.9c0 6.74-2.45 13.14-7.35 18.2-5.46 5.61-12.21 8.87-19.89 8.24-.13-1.02-.19-1.92-.19-2.71 0-6.6 2.58-13.19 7.74-18.2 5.16-5.01 12.18-8.16 19.69-8.45.13.97.19 1.9.19 2.92z"/>
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

const MailIcon = () => (
  <View style={{ width: 20, height: 20, marginRight: 10 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#8E8E93" strokeWidth="2" width="100%" height="100%">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  </View>
);

const LockIcon = () => (
  <View style={{ width: 20, height: 20, marginRight: 10 }}>
    <svg fill="none" viewBox="0 0 24 24" stroke="#8E8E93" strokeWidth="2" width="100%" height="100%">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>
  </View>
);

export default function LoginScreen({ onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Modal States
  const [isForgotPassModalVisible, setIsForgotPassModalVisible] = useState(false);
  const [forgotPassStep, setForgotPassStep] = useState('email'); // email, reset
  const [forgotPassEmail, setForgotPassEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotPassLoading, setForgotPassLoading] = useState(false);
  const [forgotPassError, setForgotPassError] = useState('');
  const [forgotPassSuccess, setForgotPassSuccess] = useState('');

  const authContext = useContext(AuthContext);
  const login = authContext?.login;

  const [isForgotPassHovered, setIsForgotPassHovered] = useState(false);

  // Animated Entrance Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  // Background Ambient Floating Animations
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgScale1 = useRef(new Animated.Value(1)).current;

  // Hover Animations
  const btnHoverScale = useRef(new Animated.Value(1)).current;
  const googleHoverScale = useRef(new Animated.Value(1)).current;
  const appleHoverScale = useRef(new Animated.Value(1)).current;
  const forgotPassScale = useRef(new Animated.Value(1)).current;
  const registerScale = useRef(new Animated.Value(1)).current;

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

  const handleLogin = async () => {
    if (!email || !password) {
      const msg = 'Harap isi email dan kata sandi Anda.';
      Platform.OS === 'web'
        ? window.alert(`ChronoFocused: ${msg}`)
        : Alert.alert('ChronoFocused', msg);
      return;
    }

    if (!login) {
      Alert.alert('Error', 'Fungsi login belum siap.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result?.success) {
      const msg = result?.message || 'Login gagal. Periksa kembali akun Anda.';
      Platform.OS === 'web'
        ? window.alert(`ChronoFocused Login: ${msg}`)
        : Alert.alert('ChronoFocused Login', msg);
    }
  };

  // Forgot Password Handlers
  const handleForgotPress = () => {
    setForgotPassStep('email');
    setForgotPassEmail('');
    setForgotPassError('');
    setForgotPassSuccess('');
    setIsForgotPassModalVisible(true);
  };

const handleForgotPassSubmit = async () => {
    setForgotPassError('');
    setForgotPassSuccess('');
    if (forgotPassStep === 'email') {
      if (!forgotPassEmail) {
        setForgotPassError('Email wajib diisi.');
        return;
      }
      setForgotPassLoading(true);
      try {
        const res = await api.post('/auth/forgot-password', { email: forgotPassEmail });
        if (res.data?.success) {
          setForgotPassSuccess(res.data.message);
          // Auto-fill token in development
          if (res.data.resetToken) {
            setResetToken(res.data.resetToken);
          }
          setTimeout(() => setForgotPassStep('reset'), 1500);
        } else {
          setForgotPassError(res.data?.message || 'Gagal meminta reset password.');
        }
      } catch (err) {
        setForgotPassError(err.response?.data?.message || 'Terjadi kesalahan.');
      } finally {
        setForgotPassLoading(false);
      }
    } else if (forgotPassStep === 'reset') {
      if (!resetToken) {
        setForgotPassError('Token reset wajib diisi.');
        return;
      }
      if (!newPassword || !confirmNewPassword) {
        setForgotPassError('Password baru dan konfirmasi wajib diisi.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setForgotPassError('Password dan konfirmasi tidak cocok.');
        return;
      }
      if (newPassword.length < 6) {
        setForgotPassError('Password minimal 6 karakter.');
        return;
      }
      setForgotPassLoading(true);
      try {
        const res = await api.post('/auth/reset-password', {
          token: resetToken,
          newPassword,
          confirmPassword: confirmNewPassword,
        });
        if (res.data?.success) {
          setForgotPassSuccess(res.data.message);
          setTimeout(() => {
            setIsForgotPassModalVisible(false);
            setForgotPassStep('email');
            setResetToken('');
            setNewPassword('');
            setConfirmNewPassword('');
          }, 2000);
        } else {
          setForgotPassError(res.data?.message || 'Gagal reset password.');
        }
      } catch (err) {
        setForgotPassError(err.response?.data?.message || 'Terjadi kesalahan.');
      } finally {
        setForgotPassLoading(false);
      }
    }
  };

  const handleForgotPassBack = () => {
    if (forgotPassStep === 'reset') {
      setForgotPassStep('email');
    }
  };

  const handleForgotPassClose = () => {
    setIsForgotPassModalVisible(false);
    setForgotPassStep('email');
    setForgotPassEmail('');
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotPassError('');
    setForgotPassSuccess('');
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
        <TouchableOpacity style={{ padding: 4 }}>
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
            marginBottom: 20,
            transform: [{ scale: logoScale }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
          }}
        >
          <Text style={{ fontSize: 36, color: '#354E41' }}>🌿</Text>
        </Animated.View>

        {/* Title */}
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 8 }}>
          Selamat Datang Kembali
        </Text>
        <Text style={{ fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 28 }}>
          Yuk lanjut belajar dengan tenang hari ini
        </Text>

        {/* Form Container */}
        <Animated.View
          style={{
            width: '100%',
            maxWidth: 400,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Email */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#333333', marginBottom: 8 }}>
            Email atau Nomor HP
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F5F3EF',
              borderRadius: 24,
              paddingHorizontal: 18,
              height: 54,
              marginBottom: 18,
            }}
          >
            <MailIcon />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="contoh: nama@email.com"
              placeholderTextColor="#A0A0A5"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ flex: 1, fontSize: 14, color: '#1A1A1A' }}
            />
          </View>

          {/* Password */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#333333', marginBottom: 8 }}>
            Kata Sandi
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F5F3EF',
              borderRadius: 24,
              paddingHorizontal: 18,
              height: 54,
              marginBottom: 12,
            }}
          >
            <LockIcon />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Masukkan kata sandi"
              placeholderTextColor="#A0A0A5"
              secureTextEntry={!showPassword}
              style={{ flex: 1, fontSize: 14, color: '#1A1A1A' }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
              <EyeIcon isOpen={showPassword} />
            </TouchableOpacity>
          </View>

          {/* Lupa Password */}
          <Animated.View
            onMouseEnter={() => {
              setIsForgotPassHovered(true);
              handleHoverIn(forgotPassScale, 1.03);
            }}
            onMouseLeave={() => {
              setIsForgotPassHovered(false);
              handleHoverOut(forgotPassScale);
            }}
            style={{
              alignSelf: 'flex-end',
              marginBottom: 20,
              transform: [{ scale: forgotPassScale }],
            }}
          >
            <TouchableOpacity activeOpacity={0.7} onPress={handleForgotPress}>
              <Text
                style={{
                  fontSize: 13,
                  color: isForgotPassHovered ? '#D93838' : '#354E41',
                  fontWeight: '600',
                }}
              >
                Lupa kata sandi?
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Tombol Utama */}
          <Animated.View style={{ transform: [{ scale: btnHoverScale }] }}>
            <TouchableOpacity
              onPress={handleLogin}
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
                    Masuk Sekarang
                  </Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 16 }}>→</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 22 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#EAE5DC' }} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#8E8E93', marginHorizontal: 10 }}>
              ATAU MASUK LEBIH CEPAT LEWAT
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#EAE5DC' }} />
          </View>

          {/* Google */}
          <Animated.View style={{ transform: [{ scale: googleHoverScale }], marginBottom: 12 }}>
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
                Masuk dengan Google
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Apple */}
          <Animated.View style={{ transform: [{ scale: appleHoverScale }] }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onMouseEnter={() => handleHoverIn(appleHoverScale, 1.02)}
              onMouseLeave={() => handleHoverOut(appleHoverScale)}
              style={{
                backgroundColor: '#F5F3EF',
                height: 52,
                borderRadius: 26,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <AppleLogo />
              <Text style={{ color: '#1A1A1A', fontWeight: '600', fontSize: 14 }}>
                Masuk dengan Apple
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Footer Link */}
        <View style={{ marginTop: 28, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#666666', marginBottom: 14 }}>
            Belum punya akun?{' '}
            <Animated.View
              onMouseEnter={() => handleHoverIn(registerScale, 1.08)}
              onMouseLeave={() => handleHoverOut(registerScale)}
              style={{ display: 'inline-flex', transform: [{ scale: registerScale }] }}
            >
              <Text
                onPress={onSwitchToRegister}
                style={{ color: '#354E41', fontWeight: '700', textDecorationLine: 'underline' }}
              >
                Daftar gratis di sini
              </Text>
            </Animated.View>
          </Text>

          {/* Slogan */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 12, color: '#8E948F', fontWeight: '500' }}>
              🌿 Fokus • Tenang • Bertumbuh
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Forgot Password Modal Overlay */}
      {isForgotPassModalVisible && (
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
          <View
            style={{
              backgroundColor: '#FAF8F5',
              width: '100%',
              maxWidth: 360,
              borderRadius: 28,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#354E41', letterSpacing: 0.8 }}>AKUN</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginTop: 2 }}>
                  {forgotPassStep === 'email' ? 'Lupa Kata Sandi?' : 'Masukkan Token'}
                </Text>
              </View>
              <TouchableOpacity onPress={handleForgotPassClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EAE5DC', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Step Indicator */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
              {['email', 'reset'].map((step) => (
                <View
                  key={step}
                  style={{
                    width: 32,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: (forgotPassStep === step || (forgotPassStep === 'reset' && step === 'email')) ? '#354E41' : '#EAE5DC',
                    marginTop: 4,
                  }}
                />
              ))}
            </View>

            {forgotPassStep === 'email' && (
              <>
                <Text style={{ fontSize: 12, color: '#757575', marginBottom: 20, textAlign: 'center' }}>
                  Masukkan email yang terdaftar. Kami akan mengirimkan token reset password ke email Anda.
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#333333', marginBottom: 6 }}>Email</Text>
                <TextInput
                  value={forgotPassEmail}
                  onChangeText={setForgotPassEmail}
                  placeholder="nama@email.com"
                  placeholderTextColor="#A0A0A5"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ backgroundColor: '#F5F3EF', borderRadius: 16, paddingHorizontal: 16, height: 48, fontSize: 13, color: '#1A1A1A', marginBottom: 16 }}
                />
              </>
            )}

            {forgotPassStep === 'reset' && (
              <>
                <Text style={{ fontSize: 12, color: '#757575', marginBottom: 20, textAlign: 'center' }}>
                  Masukkan token reset yang dikirim ke email <strong>{forgotPassEmail}</strong> dan buat kata sandi baru.
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#333333', marginBottom: 6 }}>Token Reset</Text>
                <TextInput
                  value={resetToken}
                  onChangeText={setResetToken}
                  placeholder="Paste token di sini..."
                  placeholderTextColor="#A0A0A5"
                  style={{ backgroundColor: '#F5F3EF', borderRadius: 16, paddingHorizontal: 16, height: 48, fontSize: 13, color: '#1A1A1A', marginBottom: 16 }}
                />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#333333', marginBottom: 6 }}>Password Baru</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3EF', borderRadius: 16, marginBottom: 12 }}>
                  <LockIcon />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor="#A0A0A5"
                    secureTextEntry={!showNewPassword}
                    style={{ flex: 1, fontSize: 13, color: '#1A1A1A', paddingHorizontal: 16, height: 48 }}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={{ padding: 16 }}>
                    <EyeIcon isOpen={showNewPassword} />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#333333', marginBottom: 6 }}>Konfirmasi Password</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3EF', borderRadius: 16, marginBottom: 16 }}>
                  <LockIcon />
                  <TextInput
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    placeholder="Ulangi password"
                    placeholderTextColor="#A0A0A5"
                    secureTextEntry={!showNewPassword}
                    style={{ flex: 1, fontSize: 13, color: '#1A1A1A', paddingHorizontal: 16, height: 48 }}
                  />
                </View>
                <Text style={{ fontSize: 11, color: '#8E948F', textAlign: 'center', marginBottom: 8 }}>
                  Token berlaku 15 menit. Tidak menerima? <Text style={{ color: '#354E41', fontWeight: '600' }}>Minta ulang</Text>
                </Text>
              </>
            )}

            {/* Error/Success Message */}
            {forgotPassError ? (
              <View style={{ backgroundColor: '#FDECEC', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F3C2C2' }}>
                <Text style={{ fontSize: 12, color: '#B42323', textAlign: 'center' }}>{forgotPassError}</Text>
              </View>
            ) : null}
            {forgotPassSuccess && !forgotPassError ? (
              <View style={{ backgroundColor: '#E8F0FF', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#B8D4FF' }}>
                <Text style={{ fontSize: 12, color: '#2C4E3F', textAlign: 'center' }}>{forgotPassSuccess}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {forgotPassStep !== 'email' && (
                <TouchableOpacity
                  onPress={handleForgotPassBack}
                  disabled={forgotPassLoading}
                  style={{ flex: 1, backgroundColor: '#EAE5DC', height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '700', color: '#354E41', fontSize: 14 }}>Kembali</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleForgotPassSubmit}
                disabled={forgotPassLoading}
                style={{ flex: forgotPassStep === 'email' ? 1 : 2, backgroundColor: '#354E41', height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}
              >
                {forgotPassLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ fontWeight: '800', color: '#FFFFFF', fontSize: 14 }}>
                    {forgotPassStep === 'email' ? 'Kirim Token' : 'Simpan Password'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </View>
  );
}