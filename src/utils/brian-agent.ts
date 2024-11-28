import { env } from "@/env.js";
import { createCryptoSchema } from "@/schemas/index.js";
import { createBrianAgent } from "@brian-ai/langchain";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

const createCryptoTool = new DynamicStructuredTool({
  name: "create_segugio",
  description: "this tool is used to create a crypto.",
  schema: createCryptoSchema,
  func: async ({
    name,
    ticker,
    imageUrl,
    dateTime,
  }: z.infer<typeof createCryptoSchema>) => {
    try {
      console.log("Creating coin", name, ticker, imageUrl, dateTime);
      // TODO: call contract function to create the coin
      return `${name} created.`;
    } catch (error) {
      console.error("Error creating coin", error);
      return `An error occurred while creating the coin ${name} $${ticker}.`;
    }
  },
});

export const brianAgent = await createBrianAgent({
  apiKey: env.BRIAN_API_KEY,
  privateKeyOrAccount: env.PRIVATE_KEY as `0x${string}`,
  llm: new ChatOpenAI(),
  tools: [createCryptoTool],
});
