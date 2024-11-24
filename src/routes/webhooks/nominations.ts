import { Request, Response } from "express";
import { HTTPError } from "ky";
import { Logger } from "../../utils/logger.js";
import { BrianSDK } from "@brian-ai/sdk";
import { addToRepliesQueue } from "../../queues/index.js";
import { redisClient } from "../../utils/redis.js";
import { v4 as uuidv4 } from "uuid";
import { TransactionsDataType } from "../../utils/types.js";
import { generateFrameDataPayload } from "../../utils/brian.js";
import { saveBrianRequest } from "../../utils/turso.js";
import { getOpenaiMessage } from "../../utils/openai.js";

const logger = new Logger("nominationsHandler");

const options = {
  apiKey: process.env.BRIAN_API_KEY!,
};
const brian = new BrianSDK(options);

const farcasterFrameHandlerUrl = process.env.ASKBRIAN_FRAME_HANDLER_URL!;

const regexPattern = /@askbrian/g;

function hasCauseProperty(error: any): error is { cause: { error?: string } } {
  return error && typeof error === "object" && "cause" in error;
}

const replyWithError = async (replyTo: string, text?: string) => {
  addToRepliesQueue({
    text: text || "There was an issue with your prompt. Please try again.",
    id: `replyTo-${replyTo}-${Date.now()}`,
    replyTo,
    embeds: [],
  });
};

const replyWithSuccess = async (
  replyTo: string,
  text: string,
  embeds: { url: string }[]
) => {
  addToRepliesQueue({
    text,
    id: `replyTo-${replyTo}-${Date.now()}`,
    replyTo,
    embeds,
  });
};

export const nominationsHandler = async (req: Request, res: Response) => {
  try {
    logger.log(`new cast with @askbrian mention received.`);
    const { data } = req.body;

    if (!data) {
      logger.error(`no data received.`);
      saveBrianRequest({
        status: "nok",
        errorMessage: "No data received.",
      });
      return res.status(200).send({ status: "nok" });
    }

    const { text, author, hash }: { text: string; author: any; hash: string } =
      data;
    logger.info(`received cast ${hash} with text ${text}`);

    if (text.match(regexPattern) === null) {
      logger.error(
        `No @askbrian mention found in the cast ${hash}. received text - ${text}`
      );
      saveBrianRequest({
        status: "nok",
        errorMessage: `No @askbrian mention found in the cast ${hash}.`,
        cast: data,
      });
      return res.status(200).send({ status: "nok" });
    }

    const prompt =
      text.indexOf("@askbrian") !== -1
        ? text.slice(text.indexOf("@askbrian") + 10).trim()
        : "";

    // Getting the author's address
    const originWallet =
      author.verified_addresses &&
      author.verified_addresses.eth_addresses &&
      author.verified_addresses.eth_addresses.length > 0
        ? author.verified_addresses?.eth_addresses[0]
        : author.custody_address;

    try {
      // Ask brian to generate a data payload starting from the prompt
      const brianResponse = await brian.transact({
        prompt,
        address: originWallet,
        chainId: "8453",
      });

      // Generate the frameData object
      const frameData: TransactionsDataType = await generateFrameDataPayload(
        brianResponse,
        originWallet
      );

      const operationId = uuidv4();
      await redisClient.set(operationId, JSON.stringify(frameData));

      // Ask openai to generate a message for the frame
      const openaiMessage = await getOpenaiMessage(frameData, text);
      replyWithSuccess(hash, openaiMessage, [
        {
          url: `${farcasterFrameHandlerUrl}/frames/brian-tx?id=${operationId}`,
        },
      ]);

      saveBrianRequest({
        status: "ok",
        cast: data,
        brianInput: {
          prompt,
          originWallet,
        },
        brianResponse: brianResponse,
        frameData: frameData,
        openaiMessage: openaiMessage,
        redisOperationId: operationId,
      });
      logger.log(
        `replied to ${hash} with ${openaiMessage} and saved request to db.`
      );
    } catch (e) {
      let errorMessage =
        "There was an issue with your prompt. Please try again.";
      if (e instanceof Error) {
        if (hasCauseProperty(e) && typeof e.cause === "object") {
          const cause = e.cause as { error?: string };
          if (cause.error) {
            errorMessage = cause.error;
          }
        }
      }
      logger.error(`Error calling brian endpoint: ${JSON.stringify(e)}`);
      replyWithError(hash, errorMessage);
      saveBrianRequest({
        status: "nok",
        errorMessage: "Error calling brian endpoint: " + (e as Error).message,
        cast: data,
        brianInput: {
          prompt,
          originWallet,
        },
      });
    }

    return res.status(200).send({ status: "ok" });
  } catch (error) {
    if (error instanceof HTTPError && error.name === "HTTPError") {
      const errorJson = await error.response.json();
      logger.error(
        `[/webhooks/nominations] [${new Date().toISOString()}] - error sending prompt to brian: ${
          errorJson.error
        }.`
      );
      saveBrianRequest({
        status: "nok",
        errorMessage: "Error sending prompt to brian: " + errorJson.error,
      });
    }
    if (error instanceof Error) {
      logger.error(
        `[/webhooks/nominations] [${new Date().toISOString()}] - error processing nomination: ${
          error.message
        }.`
      );
      saveBrianRequest({
        status: "nok",
        errorMessage: "Error processing nomination: " + error.message,
      });
    }
    return res.status(200).send({ status: "nok" });
  }
};
