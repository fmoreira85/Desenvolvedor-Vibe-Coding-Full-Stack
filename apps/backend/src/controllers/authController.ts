import type { Request, Response } from "express";

import { loginUser, registerUser } from "../services/authService";
import { asyncHandler } from "../utils/asyncHandler";
import { assertString } from "../utils/validation";

export const registerHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = await registerUser({
    email: assertString(request.body.email, "email"),
    name: assertString(request.body.name, "name"),
    password: assertString(request.body.password, "password")
  });

  response.status(201).json(payload);
});

export const loginHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = await loginUser({
    email: assertString(request.body.email, "email"),
    password: assertString(request.body.password, "password")
  });

  response.json(payload);
});
