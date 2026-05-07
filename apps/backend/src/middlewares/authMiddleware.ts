import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/AppError";
import { verifyJwtToken } from "../services/authService";

export const authMiddleware = (request: Request, _response: Response, next: NextFunction) => {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    next(new AppError("Authorization header is required.", 401));
    return;
  }

  const token = authorizationHeader.replace("Bearer ", "").trim();

  try {
    request.auth = verifyJwtToken(token);
    next();
  } catch (_error) {
    next(new AppError("Invalid or expired token.", 401));
  }
};
