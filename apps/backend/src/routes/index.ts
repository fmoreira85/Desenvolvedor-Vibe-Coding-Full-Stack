import { Router } from "express";

import type { HealthResponse } from "../types/api";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  const payload: HealthResponse = {
    service: "backend",
    status: "ok",
    timestamp: new Date().toISOString()
  };

  response.json(payload);
});
