import { HTTPError } from "ky";
import { getAddress } from "viem";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { BrianSDK } from "@brian-ai/sdk";
import { type Cast } from "@neynar/nodejs-sdk/build/neynar-api/v2/index.js";

import { env } from "../../env.js";
import {
  Logger,
  redisClient,
  replyWithError,
  replyWithSuccess,
  saveBrianRequest,
  updateToken,
} from "../../utils/index.js";
import { Channel } from "../../schemas/index.js";
import { customAgent } from "../../utils/custom-agent.js";

const logger = new Logger("farcaster");

const brianSdk = new BrianSDK({
  apiKey: env.BRIAN_API_KEY,
});

const regexPattern = /@briannah/g;

export function hasCauseProperty(
  error: any
): error is { cause: { error?: string } } {
  return error && typeof error === "object" && "cause" in error;
}

const extractJsonFromOutput = (text: string) => {
  // Define the regular expression pattern to match JSON blocks
  const pattern = /```json\s*((.|\n)*?)\s*```/gs;

  // Find all non-overlapping matches of the pattern in the string
  const matches = pattern.exec(text);
  console.log("json matches", matches);

  if (matches && matches[1]) {
    try {
      return JSON.parse(matches[1].trim());
    } catch (error) {
      logger.error(`Failed to parse: ${text}`);
      return {
        message: `An error occured parsing the response, try again...`,
        tokenAddress: null,
        chain: "baseSepolia",
      };
    }
  } else {
    try {
      return JSON.parse(text);
    } catch (e) {}
    logger.error(`No JSON found in: ${text}`);
    return {
      message: `An error occured, try again...`,
      tokenAddress: null,
      chain: "baseSepolia",
    };
  }
};

export const farcasterHandler = async (req: Request, res: Response) => {
  const redisOperationId = uuidv4();
  try {
    logger.log(`new cast with @briannah mention received.`);
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
        tokenAddress: null,
      });

      return res
        .status(400)
        .send({ status: "nok", error: "No data received." });
    }

    const { text, author, hash, embeds }: Cast = data;
    console.log("warpcast data", text, author.fid, hash, embeds);

    // Send a success response to neynar so they don't retry
    res.status(200).send({ status: "ok" });

    // Extract image URLs from embeds
    const imageUrls = embeds
      ?.map((embed) => {
        if ("url" in embed) {
          return embed.url;
        }
        return null;
      })
      .filter((url) => url !== null);

    logger.info(
      `received cast ${hash}: text ${text} img ${imageUrls.length > 0 ? imageUrls[0] : ""}`
    );

    if (text.match(regexPattern) === null) {
      logger.error(
        `No @briannah mention found in the cast ${hash}. received text - ${text}`
      );
      saveBrianRequest({
        status: "nok",
        errorMessage: `No @briannah mention found in the cast ${hash}.`,
        inputCast: data,
        brianInputOriginWallet: null,
        brianResponse: null,
        grokResponse: null,
        redisOperationId,
        tokenAddress: null,
      });
      return;
    }

    try {
      // Use brian to extract the parameters
      const { completion } = await brianSdk.extract({
        prompt: `${text} and imageUrl ${imageUrls[0]}`,
      });
      console.log("brianResponse", completion);

      if (!completion || !completion[0].name || !completion[0].symbol) {
        throw new Error("Missing token name or symbol");
      }
      const tokenName = completion[0].name;
      const tokenSymbol = completion[0].symbol;
      const imageUrl =
        completion?.[0].uri ??
        "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/60026409-0a0f-47a1-c052-25043c02df00/original";

      // Ask brian to extract the parameters
      logger.log(
        `langchain deploy token ${tokenName} (${tokenSymbol}) to base`
      );
      const langchainResponse = await customAgent.invoke(
        {
          input: `Deploy a new crypto called ${tokenName} with ticker ${tokenSymbol} and imageUrl "${imageUrl}" my fid is ${author.fid}. The dateTime to start trading in the pool could be in this text if you do not find it, return null: "${text}"`,
        },
        { configurable: { sessionId: author.fid } }
      );
      const responseFormatted = extractJsonFromOutput(langchainResponse.output);
      saveBrianRequest({
        status: "ok",
        errorMessage: null,
        inputCast: JSON.stringify(data),
        brianInputOriginWallet: author.fid.toString(),
        brianResponse: JSON.stringify(responseFormatted),
        grokResponse: null,
        redisOperationId,
        tokenAddress: responseFormatted.tokenAddress ?? "",
      });
      if (responseFormatted.tokenAddress) {
        await updateToken({
          tokenAddress: getAddress(responseFormatted.tokenAddress),
          fid: author.fid,
          username: author.username,
          displayName: author.display_name ?? "",
          profileImage: author.pfp_url ?? "",
        });
      }
      await redisClient.set(redisOperationId, JSON.stringify({}));

      // Ask openai to generate a message for the frame
      replyWithSuccess(Channel.Farcaster, hash, responseFormatted.message, [
        {
          url: `${env.BRIANKER_FRAME_HANDLER_URL}/token/${responseFormatted.tokenAddress ?? ""}`,
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
      try {
        const whoAmIResponse = await customAgent.invoke(
          {
            input: `Hi Briannah I'm @${author.username}, what can you do?`,
          },
          { configurable: { sessionId: author.fid } }
        );
        const whoAmIFormatted = extractJsonFromOutput(whoAmIResponse.output);
        if (whoAmIFormatted.message) {
          errorMessage = whoAmIFormatted.message;
        }
      } catch (err) {
        logger.error(`error getting whoAmI ${JSON.stringify(err)}`);
      }
      logger.error(`Error calling brian endpoint: ${JSON.stringify(e)}`);
      replyWithError(Channel.Farcaster, hash, errorMessage);
    }

    return;
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
        tokenAddress: null,
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
        tokenAddress: null,
      });
    }
    return;
  }
};
