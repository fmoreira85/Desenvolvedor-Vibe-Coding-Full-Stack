import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { query, withTransaction } from "../db/helpers";
import {
  getSupabaseAdminClient,
  isSupabaseDataEnabled,
  throwIfSupabaseError
} from "../db/supabase";
import { AppError } from "../errors/AppError";
import { listUserWorkspaces } from "./workspaceService";

type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
};

type VerifiedAuthUser = {
  userId: string;
  email: string;
  name: string | null;
  token: string;
  provider: "local-jwt" | "supabase";
};

const isSupabaseAuthEnabled = () => Boolean(env.supabaseUrl && env.supabaseAnonKey);

const signToken = (user: Pick<UserRow, "id" | "email">) => {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: "7d"
  });
};

const buildAuthPayload = async (
  verifiedUser: Pick<VerifiedAuthUser, "userId" | "email" | "name" | "token">
) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const normalizedName = verifiedUser.name?.trim() || verifiedUser.email.split("@")[0];

    const { error: upsertError } = await supabase.from("users").upsert(
      {
        id: verifiedUser.userId,
        email: verifiedUser.email,
        name: normalizedName,
        password_hash: null
      },
      {
        onConflict: "id"
      }
    );

    throwIfSupabaseError(upsertError, "User profile sync failed.");

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, password_hash")
      .eq("id", verifiedUser.userId)
      .maybeSingle<UserRow>();

    throwIfSupabaseError(userError, "Authenticated user profile lookup failed.");

    if (!user) {
      throw new AppError("Authenticated user profile could not be resolved.", 500);
    }

    const workspaces = await listUserWorkspaces(user.id);

    return {
      token: verifiedUser.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      workspaces
    };
  }

  await withTransaction(async (client) => {
    await client.query(
      `
        INSERT INTO users (id, email, name, password_hash)
        VALUES ($1, $2, $3, NULL)
        ON CONFLICT (id)
        DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name
      `,
      [
        verifiedUser.userId,
        verifiedUser.email,
        verifiedUser.name?.trim() || verifiedUser.email.split("@")[0]
      ]
    );
  });

  const result = await query<UserRow>(
    `
      SELECT id, email, name, password_hash
      FROM users
      WHERE id = $1
    `,
    [verifiedUser.userId]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError("Authenticated user profile could not be resolved.", 500);
  }

  const workspaces = await listUserWorkspaces(user.id);

  return {
    token: verifiedUser.token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    workspaces
  };
};

const verifyLocalJwtToken = (token: string): VerifiedAuthUser => {
  const payload = jwt.verify(token, env.jwtSecret) as {
    sub: string;
    email: string;
  };

  return {
    userId: payload.sub,
    email: payload.email,
    name: null,
    token,
    provider: "local-jwt"
  };
};

const verifySupabaseAccessToken = async (token: string): Promise<VerifiedAuthUser> => {
  const response = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: env.supabaseAnonKey,
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new AppError("Invalid or expired Supabase token.", 401);
  }

  const payload = (await response.json()) as {
    id: string;
    email?: string | null;
    user_metadata?: { name?: string | null } | null;
  };

  if (!payload.id || !payload.email) {
    throw new AppError("Supabase token did not include the expected user claims.", 401);
  }

  return {
    userId: payload.id,
    email: payload.email,
    name: payload.user_metadata?.name ?? null,
    token,
    provider: "supabase"
  };
};

export const registerUser = async (input: {
  email: string;
  name: string;
  password: string;
}) => {
  if (isSupabaseAuthEnabled()) {
    throw new AppError(
      "Local auth routes are disabled when Supabase Auth is enabled. Use the frontend Supabase client instead.",
      410
    );
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  if (input.password.length < 6) {
    throw new AppError("Password must have at least 6 characters.", 400);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await withTransaction(async (client) => {
    const existing = await client.query("SELECT 1 FROM users WHERE email = $1", [normalizedEmail]);

    if ((existing.rowCount ?? 0) > 0) {
      throw new AppError("User already exists for this email.", 409);
    }

    const result = await client.query<UserRow>(
      `
        INSERT INTO users (email, password_hash, name)
        VALUES ($1, $2, $3)
        RETURNING id, email, name, password_hash
      `,
      [normalizedEmail, passwordHash, input.name.trim()]
    );

    return result.rows[0];
  });

  return buildAuthPayload({
    userId: user.id,
    email: user.email,
    name: user.name,
    token: signToken(user)
  });
};

export const loginUser = async (input: { email: string; password: string }) => {
  if (isSupabaseAuthEnabled()) {
    throw new AppError(
      "Local auth routes are disabled when Supabase Auth is enabled. Use the frontend Supabase client instead.",
      410
    );
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  const result = await withTransaction(async (client) => {
    return client.query<UserRow>(
      `
        SELECT id, email, name, password_hash
        FROM users
        WHERE email = $1
      `,
      [normalizedEmail]
    );
  });

  const user = result.rows[0];

  if (!user || !user.password_hash) {
    throw new AppError("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password_hash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  return buildAuthPayload({
    userId: user.id,
    email: user.email,
    name: user.name,
    token: signToken(user)
  });
};

export const resolveAccessToken = async (token: string) => {
  if (isSupabaseAuthEnabled()) {
    try {
      return await verifySupabaseAccessToken(token);
    } catch (error) {
      if (env.nodeEnv === "development") {
        try {
          return verifyLocalJwtToken(token);
        } catch {
          throw error;
        }
      }

      throw error;
    }
  }

  return verifyLocalJwtToken(token);
};

export const getAuthenticatedSession = async (token: string) => {
  const verifiedUser = await resolveAccessToken(token);
  return buildAuthPayload(verifiedUser);
};
