import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/AppError";

export const notFoundHandler = (_request: Request, _response: Response, next: NextFunction) => {
  next(new AppError("Route not found.", 404));
};

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: error.message,
      details: error.details ?? null
    });

    return;
  }

  console.error(error);

  response.status(500).json({
    error: "Internal server error."
  });
};
