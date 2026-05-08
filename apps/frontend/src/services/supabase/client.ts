import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const isSupabaseAuthEnabled = () => Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseAuthEnabled()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const signOutSupabaseSession = async () => {
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
};
