import { NextFunction, Request, Response } from "express";
import { env } from "./env.js";
import { createHmac } from "crypto";
import { Logger } from "./utils/logger.js";

const logger = new Logger("middleware");

/**
 * @dev middleware that checks for the presence of the X-Neynar-Signature header and validates it (if there are multiple webhooks calling the bot we can use this to verify the source and prevent malicious or multiple requests)
 * @param {Request} req input express request
 * @param {Response} res output express response
 * @param {NextFunction} next express next function
 */
export const neynarSignatureMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const signature = req.header("X-Neynar-Signature");
  if (!signature) {
    logger.error("Neynar Signature missing from request headers");
    res
      .status(401)
      .send("Unauthorized - Neynar Signature missing from request headers");
    return;
  }
  logger.info("Neynar Signature found in request headers");

  const webhookSecret = env.NEYNAR_WEBHOOK_SECRET;
  const body = JSON.stringify(req.body);
  const generatedSignature = createHmac("sha512", webhookSecret)
    .update(body)
    .digest("hex");

  if (signature !== generatedSignature) {
    logger.error("Invalid Neynar Signature");
    res.status(401).send("Unauthorized - invalid Neynar Signature");
    return;
  } else {
    logger.log("Neynar Signature is valid");
  }
  next();
};
