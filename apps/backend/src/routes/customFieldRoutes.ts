import { Router } from "express";

import {
  createCustomFieldHandler,
  deleteCustomFieldHandler,
  listCustomFieldsHandler
} from "../controllers/customFieldController";

export const customFieldRouter = Router();

customFieldRouter.get("/", listCustomFieldsHandler);
customFieldRouter.post("/", createCustomFieldHandler);
customFieldRouter.delete("/:id", deleteCustomFieldHandler);
