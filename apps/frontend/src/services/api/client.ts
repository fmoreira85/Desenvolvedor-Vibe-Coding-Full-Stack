import axios from "axios";

import { useSessionStore } from "../../hooks/useSessionStore";

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/api`
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
      useSessionStore.getState().logout();
      if (window.location.pathname !== "/auth") {
        window.location.assign("/auth");
      }
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
