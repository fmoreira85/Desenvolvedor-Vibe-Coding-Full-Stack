import { Pool } from "pg";

import { databaseConfig } from "./config";

const requiresSupabaseSsl = databaseConfig.url.includes("supabase.com");

const buildConnectionString = () => {
  if (!requiresSupabaseSsl) {
    return databaseConfig.url;
  }

  const parsedUrl = new URL(databaseConfig.url);
  parsedUrl.searchParams.delete("sslmode");

  return parsedUrl.toString();
};

export const pool = new Pool({
  connectionString: buildConnectionString(),
  ssl: requiresSupabaseSsl
    ? {
        rejectUnauthorized: false
      }
    : undefined
});
