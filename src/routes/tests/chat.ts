import { Request, Response } from "express";
import { BrianSDK } from "@brian-ai/sdk";

import { env } from "../../env.js";
import { Logger } from "../../utils/logger.js";

const logger = new Logger("testHandler");
const options = {
  apiKey: env.BRIAN_API_KEY,
};
const brian = new BrianSDK(options);

const regexPattern = /@brianker/g;

export const chatHandler = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    if (!data) {
      logger.error(`no data received.`);

      return res.status(200).send({ status: "nok" });
    }
    const { text }: { text: string } = data;

    if (text.match(regexPattern) === null) {
      logger.error(
        `No @brianker mention found in the cast. received text - ${text}`
      );

      return res.status(200).send({ status: "nok" });
    }

    const prompt =
      text.indexOf("@brianker") !== -1
        ? text.slice(text.indexOf("@brianker") + 10).trim()
        : "";
    logger.log(`user prompt for brian: ${prompt}`);

    const originWallet = "0xf66c00759467c6524B0C86af132bb52786b37382";

    try {
      // Ask brian to generate a data payload starting from the prompt
      const brianResponse = await brian.transact({
        prompt,
        address: originWallet,
        chainId: "8453",
      });
      logger.log(`brianResponse ${JSON.stringify(brianResponse)}`);

      return res.status(200).send({ status: "ok", message: "ok briano" });
    } catch (error) {
      logger.error(`error asking brian: ${error}`);
    }

    return res.status(200).send({ status: "ok" });
  } catch (error) {
    logger.error(`error in testHandler: ${error}`);
    return res.status(200).send({ status: "nok" });
  }
};
