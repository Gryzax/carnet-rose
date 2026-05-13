import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://gryzax.github.io/carnet-rose/';

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: Platform.OS === 'web' ? undefined : AsyncStorage
      }
    })
  : null;

export const getSupabaseStatus = () => ({
  configured: isSupabaseConfigured(),
  mode: isSupabaseConfigured() ? 'online-sync-ready' : 'local-only'
});
