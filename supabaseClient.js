import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration du client Supabase avec support de persistance AsyncStorage pour Expo/React Native.
// Utilise des variables d'environnement Expo standard ou des valeurs par défaut sécurisées.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dholdpmbsmaopyznoxfd.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRob2xkcG1ic21hb3B5em5veGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE0NDI1NjYsImV4cCI6MjAzNzAxODU2Nn0.your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
