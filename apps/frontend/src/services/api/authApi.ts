import type { Session } from "@supabase/supabase-js";

import type { AuthPayload } from "../../types/models";
import { apiClient } from "./client";
import { isSupabaseAuthEnabled, signOutSupabaseSession, supabase } from "../supabase/client";

const buildSessionPayload = async (token: string) => {
  const { data } = await apiClient.get<AuthPayload>("/auth/session", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return {
    ...data,
    token
  };
};

const requireSupabaseSession = async (session: Session | null) => {
  if (!session?.access_token) {
    throw new Error("Conta criada no Supabase. Confirme o email antes de entrar.");
  }

  return buildSessionPayload(session.access_token);
};

export const authApi = {
  register: async (input: { name: string; email: string; password: string }) => {
    if (!isSupabaseAuthEnabled() || !supabase) {
      const { data } = await apiClient.post<AuthPayload>("/auth/register", input);
      return data;
    }

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name
        }
      }
    });

    if (error) {
      throw error;
    }

    return requireSupabaseSession(data.session);
  },
  login: async (input: { email: string; password: string }) => {
    if (!isSupabaseAuthEnabled() || !supabase) {
      const { data } = await apiClient.post<AuthPayload>("/auth/login", input);
      return data;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password
    });

    if (error) {
      throw error;
    }

    return requireSupabaseSession(data.session);
  },
  hydrateSession: async () => {
    if (!isSupabaseAuthEnabled() || !supabase) {
      return null;
    }

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (!data.session?.access_token) {
      return null;
    }

    return buildSessionPayload(data.session.access_token);
  },
  onSessionChange: (callback: (payload: AuthPayload | null) => void) => {
    if (!isSupabaseAuthEnabled() || !supabase) {
      return () => undefined;
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.access_token) {
        callback(null);
        return;
      }

      void buildSessionPayload(session.access_token)
        .then((payload) => callback(payload))
        .catch(() => callback(null));
    });

    return () => {
      subscription.unsubscribe();
    };
  },
  logout: async () => {
    await signOutSupabaseSession();
  }
};
