import OpenAI from "openai";
import { env } from "../env.js";
import { TransactionsDataType } from "./types.js";
import { Logger } from "./logger.js";

const logger = new Logger("openai");

const openaiClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: env.OPENAI_API_BASE_URL,
});

export const defaultInstructions =
  "\n\nClick on the button to execute the first transaction, wait around 30 seconds for it to go through and then click on the `refresh` button, the second one. Keep going like this until you have executed all the transactions.";

export const openaiSystemPrompt =
  "You are a chatbot, guiding a skilled blockchain user through various tasks on the blockchain with the https://brianknows.org APIs.\n" +
  " You will be provided with a transaction intent (ie. swap asset, mint nft, send asset, register ENS, etc.) and you have to generate a little message for the user with a little joke about it.\n" +
  "The message should be concise and to the point, write it as a fun twitter degen style, mocking user actions or the transaction intent.\n" +
  // "The message should follow the style of these twitter users: https://x.com/yacineMTB https://x.com/functi0nZer0 https://x.com/REMILIONAIRE\n" +
  "\nInstruction: Use the previous chat history, or the context above, to interact and help the user.\n" +
  `ALWAYS END THE MESSAGE SAYING '${defaultInstructions}'`;

const fallbackMessage = `This frame contains all your requested transactions.\n
  Click on the button to execute the first transaction, wait around 30 seconds for it to go through and then click on the "refresh" button, the second one.\n
  Keep going like this until you have executed all the transactions.\n`;

export const getOpenaiMessage = async (
  frameData: TransactionsDataType,
  text: string
): Promise<string> => {
  const openaiPrompt = frameData.requests
    .map((r) => `${r.description}\n`)
    .join("\n");

  try {
    const openaiResponse = await openaiClient.chat.completions.create({
      model: "grok-beta", // bye "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: openaiSystemPrompt,
        },
        {
          role: "user",
          content: `Here's the frame data: ${openaiPrompt}`,
        },
        {
          role: "user",
          content: `Here's the whole user post: ${text}`,
        },
      ],
      // max_tokens: 1000 // comment for grok-beta
    });

    const openaiMessage = openaiResponse.choices[0].message.content;
    logger.log(`OpenAI wrote this message for the frame: ${openaiMessage}`);

    return openaiMessage || fallbackMessage;
  } catch (error) {
    logger.error(`error in getOpenaiMessage: ${error}`);
    return fallbackMessage;
  }
};
