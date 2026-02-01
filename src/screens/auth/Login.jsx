import { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import { Input, Button, Text } from '@rneui/themed';
import FontAwesome from '@react-native-vector-icons/fontawesome';

import { signInWithEmail, signInWithGoogle } from '../../services/auth';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    setIsScrollable(contentHeight > layoutHeight);
  }, [contentHeight, layoutHeight]);

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailLogin = async () => {
    if (!email.trim()) {
      Toast.show({
        type: 'error',
        text1: '입력 오류',
        text2: '이메일을 입력해주세요.',
        visibilityTime: 3000,
      });
      return;
    }

    if (!password) {
      Toast.show({
        type: 'error',
        text1: '입력 오류',
        text2: '비밀번호를 입력해주세요.',
        visibilityTime: 3000,
      });
      return;
    }

    if (!validateEmail(email.trim())) {
      Toast.show({
        type: 'error',
        text1: '입력 오류',
        text2: '올바른 이메일 형식이 아닙니다.',
        visibilityTime: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      await signInWithEmail(email.trim(), password);
    } catch (e) {
      if (
        e.code === 'auth/wrong-password' ||
        e.code === 'auth/user-not-found' ||
        e.code === 'auth/invalid-credential'
      ) {
        Toast.show({
          type: 'error',
          text1: '로그인 실패',
          text2: '비밀번호 또는 이메일이 올바르지 않습니다.',
          visibilityTime: 3000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: '로그인 실패',
          text2: e.message,
          visibilityTime: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      console.log('🔄 Google 로그인 시작');
      await signInWithGoogle();
      console.log('✅ Google 로그인 성공');
    } catch (e) {
      console.error('❌ 에러 상세:', {
        message: e.message,
        status: e.status,
        code: e.code,
        fullError: JSON.stringify(e, null, 2),
      });
      Toast.show({
        type: 'error',
        text1: 'Google 로그인 실패',
        text2: e.message || '알 수 없는 에러',
        visibilityTime: 5000,
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 30,
          justifyContent: 'center',
          backgroundColor: 'white',
          paddingBottom: isScrollable ? 8 : 0,
        }}
        keyboardShouldPersistTaps="handled"
        onLayout={e => {
          const layoutHeight = e.nativeEvent.layout.height;
          setLayoutHeight(layoutHeight);
        }}
        onContentSizeChange={(w, h) => {
          setContentHeight(h);
        }}
      >
        <Text h2 style={{ marginBottom: 20, fontWeight: 'bold' }}>
          로그인
        </Text>

        {}
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          containerStyle={{ paddingHorizontal: 0 }}
          inputStyle={{ fontSize: 16 }}
          returnKeyType="next"
        />

        {}
        <Input
          placeholder="Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          containerStyle={{ paddingHorizontal: 0, marginBottom: 10 }}
          inputStyle={{ fontSize: 16 }}
          returnKeyType="done"
          onSubmitEditing={handleEmailLogin}
        />

        {}
        <Button
          title="로그인"
          onPress={handleEmailLogin}
          loading={loading}
          disabled={loading || googleLoading}
          buttonStyle={{
            borderRadius: 10,
            height: 50,
          }}
          containerStyle={{ marginBottom: 20 }}
        />

        {}
        <Button
          title="Google로 로그인"
          type="outline"
          loading={googleLoading}
          disabled={loading || googleLoading}
          icon={
            !googleLoading && (
              <FontAwesome
                name="google"
                color="black"
                size={18}
                style={{ marginRight: 10 }}
              />
            )
          }
          onPress={handleGoogleLogin}
          buttonStyle={{
            borderRadius: 8,
            height: 48,
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
