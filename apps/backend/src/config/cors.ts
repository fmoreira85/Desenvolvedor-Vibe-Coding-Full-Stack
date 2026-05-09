import type { CorsOptions } from "cors";

import { env } from "./env";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://superb-cranachan-294219.netlify.app"
];

const parseOrigins = (...values: Array<string | undefined>) => {
  const origins = values
    .flatMap((value) => (value ?? "").split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return origins.length > 0 ? Array.from(new Set(origins)) : DEFAULT_ALLOWED_ORIGINS;
};

export const allowedCorsOrigins = parseOrigins(env.corsAllowedOrigins, env.frontendUrl);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedCorsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
};
