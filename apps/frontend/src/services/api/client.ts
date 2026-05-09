import axios from "axios";

import { useSessionStore } from "../../hooks/useSessionStore";
import { signOutSupabaseSession } from "../supabase/client";

const DEFAULT_PRODUCTION_API_URL = "https://sdr-crmbackend-production.up.railway.app";
const DEFAULT_LOCAL_API_URL = "http://localhost:3001";

const resolveApiUrl = () => {
  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalEnvironment = hostname === "localhost" || hostname === "127.0.0.1";

    return isLocalEnvironment ? DEFAULT_LOCAL_API_URL : DEFAULT_PRODUCTION_API_URL;
  }

  return DEFAULT_LOCAL_API_URL;
};

export const apiClient = axios.create({
  baseURL: `${resolveApiUrl()}/api`,
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && useSessionStore.getState().token) {
      void signOutSupabaseSession().finally(() => {
        useSessionStore.getState().logout();
        if (window.location.pathname !== "/auth") {
          window.location.assign("/auth");
        }
      });
    }

    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { error?: string; details?: unknown } | undefined;

    if (payload?.error) {
      return payload.error;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Algo deu errado ao processar a solicitação.";
};

export const getApiErrorDetails = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { details?: unknown } | undefined;
    return payload?.details;
  }

  return undefined;
};
