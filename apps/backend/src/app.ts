import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { apiRouter } from "./routes";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  app.get("/", (_request, response) => {
    response.json({
      name: "SDR CRM API",
      status: "ok",
      docs: "Setup base concluido. Endpoints de negocio entram nas proximas fases."
    });
  });

  app.use("/api", apiRouter);

  return app;
};
