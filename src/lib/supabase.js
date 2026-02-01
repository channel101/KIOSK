import { createClient } from '@supabase/supabase-js';
import { appConfig } from './config';
import 'react-native-url-polyfill/auto';

export const supabase = createClient(
  appConfig.supabase.url,
  appConfig.supabase.anonKey,
  {
    auth: {
      storage: require('@react-native-async-storage/async-storage').default,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      log_level: 'info',
    },
  },
);

export const auth = supabase.auth;

export const database = supabase;
