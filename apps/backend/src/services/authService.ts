import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { withTransaction } from "../db/helpers";
import { AppError } from "../errors/AppError";
import { listUserWorkspaces } from "./workspaceService";

type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
};

const signToken = (user: Pick<UserRow, "id" | "email">) => {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: "7d"
  });
};

export const registerUser = async (input: {
  email: string;
  name: string;
  password: string;
}) => {
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

  const token = signToken(user);
  const workspaces = await listUserWorkspaces(user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    workspaces
  };
};

export const loginUser = async (input: { email: string; password: string }) => {
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

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password_hash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = signToken(user);
  const workspaces = await listUserWorkspaces(user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    workspaces
  };
};

export const verifyJwtToken = (token: string) => {
  const payload = jwt.verify(token, env.jwtSecret) as { sub: string; email: string };

  return {
    userId: payload.sub,
    email: payload.email
  };
};
