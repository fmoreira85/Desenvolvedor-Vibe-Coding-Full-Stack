import { Router } from "express";

import { loginHandler, registerHandler, sessionHandler } from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.get("/session", authMiddleware, sessionHandler);
