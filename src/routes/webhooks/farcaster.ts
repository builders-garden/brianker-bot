import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { HTTPError } from "ky";

import { env } from "../../env.js";
import {
  brianAgent,
  Logger,
  redisClient,
  replyWithError,
  replyWithSuccess,
  saveBrianRequest,
} from "../../utils/index.js";
import { Channel } from "../../schemas/index.js";

const logger = new Logger("farcaster");
const farcasterFrameHandlerUrl = env.BRIANKER_FRAME_HANDLER_URL!;
const regexPattern = /@brianker/g;

export const farcasterHandler = async (req: Request, res: Response) => {
  const redisOperationId = uuidv4();
  try {
    logger.log(`new cast with @brianker mention received.`);
    const { data } = req.body;

    if (!data) {
      logger.error(`no data received.`);
      saveBrianRequest({
        status: "nok",
        errorMessage: "No data received.",
        inputCast: null,
        brianInputOriginWallet: null,
        brianResponse: null,
        grokResponse: null,
        redisOperationId,
      });
      return res.status(200).send({ status: "nok" });
    }
    console.log("warpcast data", data);

    const {
      text,
      author,
      hash,
      embeds,
    }: {
      text: string;
      author: any;
      hash: string;
      embeds: Array<{
        url: string;
        metadata?: {
          image?: {
            height_px: number;
            width_px: number;
          };
          html?: {
            ogImage?: Array<{
              url: string;
            }>;
          };
        };
      }>;
    } = data;

    // Extract image URLs from embeds
    const imageUrls = embeds
      ?.map((embed) => {
        if (embed.metadata?.image) return embed.url;
        if (embed.metadata?.html?.ogImage?.[0]?.url)
          return embed.metadata.html.ogImage[0].url;
        return null;
      })
      .filter((url) => url !== null);

    logger.info(
      `received cast ${hash} with text ${text} and images ${imageUrls.join(", ")}`
    );

    if (text.match(regexPattern) === null) {
      logger.error(
        `No @brianker mention found in the cast ${hash}. received text - ${text}`
      );
      saveBrianRequest({
        status: "nok",
        errorMessage: `No @brianker mention found in the cast ${hash}.`,
        inputCast: data,
        brianInputOriginWallet: null,
        brianResponse: null,
        grokResponse: null,
        redisOperationId,
      });
      return res.status(200).send({ status: "nok" });
    }

    // Getting the author's address
    const originWallet =
      author.verified_addresses &&
      author.verified_addresses.eth_addresses &&
      author.verified_addresses.eth_addresses.length > 0
        ? author.verified_addresses?.eth_addresses[0]
        : author.custody_address;

    try {
      const brianLangchainResponse = await brianAgent.invoke(
        { input: text, address: originWallet, imageUrl: imageUrls[0] },
        { configurable: { sessionId: originWallet } }
      );
      console.log("brianLangchainResponse", brianLangchainResponse);
      await redisClient.set(redisOperationId, JSON.stringify({}));

      // Ask openai to generate a message for the frame
      replyWithSuccess(Channel.Farcaster, hash, "Here's your coin...", [
        {
          url: `${farcasterFrameHandlerUrl}/frames/brian-tx?id=${redisOperationId}`,
        },
      ]);

      logger.log(`replied to ${hash} with success.`);
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
      replyWithError(Channel.Farcaster, hash, errorMessage);
    }

    return res.status(200).send({ status: "ok" });
  } catch (error) {
    if (error instanceof HTTPError && error.name === "HTTPError") {
      const errorJson = await error.response.json();
      logger.error(
        `[/webhooks/farcaster] [${new Date().toISOString()}] - error sending prompt to brian ${redisOperationId}: ${
          errorJson.error
        }.`
      );
      saveBrianRequest({
        status: "nok",
        errorMessage: "Error sending prompt to brian: " + errorJson.error,
        inputCast: null,
        brianInputOriginWallet: null,
        brianResponse: null,
        grokResponse: null,
        redisOperationId,
      });
    }
    if (error instanceof Error) {
      logger.error(
        `[/webhooks/farcaster] [${new Date().toISOString()}] - error processing cast ${redisOperationId}: ${
          error.message
        }.`
      );
      saveBrianRequest({
        status: "nok",
        errorMessage: "Error processing cast: " + error.message,
        inputCast: null,
        brianInputOriginWallet: null,
        brianResponse: null,
        grokResponse: null,
        redisOperationId,
      });
    }
    return res.status(200).send({ status: "nok" });
  }
};

export function hasCauseProperty(
  error: any
): error is { cause: { error?: string } } {
  return error && typeof error === "object" && "cause" in error;
}
