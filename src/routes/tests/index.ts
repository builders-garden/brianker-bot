import express from "express";
import { chatHandler } from "./chat.js";

const testsRouter = express.Router();

testsRouter.post("/chat", chatHandler);

export { testsRouter };
