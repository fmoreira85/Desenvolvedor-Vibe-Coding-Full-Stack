import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "../config/env";
import { AppError } from "../errors/AppError";

let supabaseAdminClient: SupabaseClient | null = null;

const RealtimeWebSocket = require("ws") as typeof globalThis.WebSocket;

if (!globalThis.WebSocket) {
  globalThis.WebSocket = RealtimeWebSocket;
}

export const isSupabaseDataEnabled = () =>
  Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);

export const getSupabaseAdminClient = () => {
  if (!isSupabaseDataEnabled()) {
    throw new AppError("Supabase server credentials are not configured.", 500);
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch
      },
      realtime: {
        transport: RealtimeWebSocket as never
      }
    });
  }

  return supabaseAdminClient;
};

export const throwIfSupabaseError = (
  error: PostgrestError | null,
  message = "Database operation failed.",
  statusCode = 500
) => {
  if (!error) {
    return;
  }

  throw new AppError(error.message || message, statusCode, {
    code: error.code,
    details: error.details,
    hint: error.hint
  });
};
