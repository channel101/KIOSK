import { legacySignIn, signOut } from '@react-native-auth/google';
import { NativeModules, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { appConfig } from '../lib/config';

const { KioskModule } = NativeModules;

export async function signInWithEmail(email, password) {
  if (Platform.OS === 'android' && KioskModule) {
    KioskModule.disableKiosk();
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  if (Platform.OS === 'android' && KioskModule) {
    KioskModule.disableKiosk();
  }

  const { error } = await supabase.auth.signOut();
  await signOut();

  if (error) throw error;
}

export async function signInWithGoogle() {
  try {
    if (Platform.OS === 'android' && KioskModule) {
      KioskModule.disableKiosk();
    }
    const result = await legacySignIn({
      clientId: appConfig?.google?.web,
      scopes: ['email', 'profile', 'openid'],
      prompt: 'select_account',
    });

    if (!result.idToken) {
      throw new Error('Google OAuth: idToken 없음');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: result.idToken,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Google 로그인 실패:', error);
    throw error;
  }
}

export async function refreshToken() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data;
}

export async function revokeToken() {
  return await signOutUser();
}
