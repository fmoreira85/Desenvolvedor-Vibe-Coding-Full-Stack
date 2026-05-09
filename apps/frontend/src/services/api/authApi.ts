import type { Session } from "@supabase/supabase-js";

import type { AuthPayload } from "../../types/models";
import { apiClient } from "./client";
import { isSupabaseAuthEnabled, signOutSupabaseSession, supabase } from "../supabase/client";

const DEFAULT_PRODUCTION_AUTH_REDIRECT_URL = "https://superb-cranachan-294219.netlify.app/login";
const LOCAL_AUTH_REDIRECT_PATH = "/login";

const getEmailRedirectUrl = () => {
  const configuredRedirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL?.trim();

  if (configuredRedirectUrl) {
    return configuredRedirectUrl;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalEnvironment = hostname === "localhost" || hostname === "127.0.0.1";

    if (isLocalEnvironment) {
      return `${window.location.origin}${LOCAL_AUTH_REDIRECT_PATH}`;
    }
  }

  return DEFAULT_PRODUCTION_AUTH_REDIRECT_URL;
};

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

type RegisterResult =
  | {
      status: "authenticated";
      payload: AuthPayload;
    }
  | {
      status: "pending_email_confirmation";
    };

type EmailConfirmationResult =
  | {
      status: "authenticated";
      payload: AuthPayload;
    }
  | {
      status: "confirmed";
    };

export const authApi = {
  register: async (input: { name: string; email: string; password: string }) => {
    if (!isSupabaseAuthEnabled() || !supabase) {
      const { data } = await apiClient.post<AuthPayload>("/auth/register", input);
      return {
        status: "authenticated" as const,
        payload: data
      } satisfies RegisterResult;
    }

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: getEmailRedirectUrl(),
        data: {
          name: input.name
        }
      }
    });

    if (error) {
      throw error;
    }

    if (!data.session?.access_token) {
      return {
        status: "pending_email_confirmation"
      } satisfies RegisterResult;
    }

    return {
      status: "authenticated" as const,
      payload: await buildSessionPayload(data.session.access_token)
    } satisfies RegisterResult;
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
  completeEmailConfirmation: async (input: { tokenHash: string; type: string }) => {
    if (!isSupabaseAuthEnabled() || !supabase) {
      return {
        status: "confirmed"
      } satisfies EmailConfirmationResult;
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: input.tokenHash,
      type: input.type
    });

    if (error) {
      throw error;
    }

    if (!data.session?.access_token) {
      return {
        status: "confirmed"
      } satisfies EmailConfirmationResult;
    }

    return {
      status: "authenticated" as const,
      payload: await buildSessionPayload(data.session.access_token)
    } satisfies EmailConfirmationResult;
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
