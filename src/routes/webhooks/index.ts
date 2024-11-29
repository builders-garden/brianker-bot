import express from "express";

import { farcasterHandler } from "./farcaster.js";
// import { neynarSignatureMiddleware } from "../../middlewares.js";

const webhooksRouter = express.Router();

webhooksRouter.post(
  "/farcaster",
  /*neynarSignatureMiddleware,*/ farcasterHandler
);

export { webhooksRouter };
