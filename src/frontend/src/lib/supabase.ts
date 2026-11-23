import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import { IS_DEMO } from '../demo/flag';
import { createDemoSupabase } from '../demo';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = IS_DEMO || Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase credentials not found. Auth features disabled. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable.'
  );
}

// Demo builds (VITE_DEMO=1) get the in-browser stand-in from src/demo instead
// of a network client; see src/demo/index.ts.
// Note: If you see type errors, regenerate types using: npx supabase gen types typescript
const _supabase = IS_DEMO
  ? createDemoSupabase()
  : createClient<Database>(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key',
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: localStorage,
        },
      }
    );

// Export with relaxed typing to avoid type conflicts before database is set up
 
export const supabase = _supabase as unknown as SupabaseClient<any>;

// Helper to get current session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Helper to get current user with profile
export const getCurrentUserWithProfile = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return { user, profile: null };
  }

  return { user, profile };
};

// Helper to get user settings
export const getUserSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }

  return data;
};

// Helper to update user settings
export const updateUserSettings = async (
  userId: string,
   
  updates: any
) => {
  const { error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId);

  if (error) throw error;
};
