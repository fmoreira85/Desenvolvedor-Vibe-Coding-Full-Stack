import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/AppError";
import { resolveAccessToken } from "../services/authService";

export const authMiddleware = (request: Request, _response: Response, next: NextFunction) => {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    next(new AppError("Authorization header is required.", 401));
    return;
  }

  const token = authorizationHeader.replace("Bearer ", "").trim();

  void resolveAccessToken(token)
    .then((auth) => {
      request.auth = {
        userId: auth.userId,
        email: auth.email,
        name: auth.name
      };
      next();
    })
    .catch(() => {
      next(new AppError("Invalid or expired token.", 401));
    });
};
