import express from "express";
import { nominationsHandler } from "./nominations.js";
import { neynarSignatureMiddleware } from "../../middlewares.js";

const webhooksRouter = express.Router();

webhooksRouter.post(
  "/nominations",
  neynarSignatureMiddleware,
  nominationsHandler
);

export { webhooksRouter };
