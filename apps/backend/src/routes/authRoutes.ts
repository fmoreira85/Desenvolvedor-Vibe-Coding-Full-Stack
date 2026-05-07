import { Router } from "express";

import { loginHandler, registerHandler } from "../controllers/authController";

export const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
