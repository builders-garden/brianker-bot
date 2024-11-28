import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";

import { saveToken } from "../utils/index.js";
import { createCryptoSchema } from "../schemas/index.js";
import { deployTokenContract } from "./viem.js";
import { LanguageModelLike } from "@langchain/core/language_models/base";

export const defaultInstructions = `You are Brianker, a a web3 assistant to help users launch new tokens easily. 
Only extract relevant information from the text. 
If you do not know the value of an attribute asked to extract, return null for the attribute's value. 

Respond only in valid JSON. The JSON object you return should match the following schema:
  \`\`\`json
{{ message: "string", tokenAddress?: "string", chain: "string" }}
\`\`\` 

Where message is a string, tokenAddress is a string, and chain is a string.
You know all the web3 memes, in the message field lightly make fun of the crypto the user just created using a sarcastic tone.`;

const createCryptoTool = new DynamicStructuredTool({
  name: "deploy_token",
  description:
    "this tool is used to create a new cryptocoin (or token) from a given name, ticker and imageUrl.",
  schema: createCryptoSchema,
  func: async ({
    name,
    ticker,
    imageUrl,
    dateTime,
    fid,
  }: z.infer<typeof createCryptoSchema>) => {
    try {
      console.info(
        `Creating coin ${name} ${ticker} ${imageUrl} ${dateTime} requested by fid ${fid}`
      );
      const startTime = dateTime
        ? new Date(dateTime)
        : new Date(Date.now() + 1 * 60 * 60 * 1000);

      const tokenAddress = await deployTokenContract({
        name,
        symbol: ticker,
        startTime,
      });

      if (!tokenAddress) throw new Error("Token contract not deployed");

      // save the contract address to the database
      console.info(`Token contract deployed with address: ${tokenAddress}`);

      saveToken({
        address: tokenAddress,
        name,
        ticker,
        requestedBy: fid || 0,
        dateTime: startTime.toISOString(),
        image: imageUrl || "",
      });

      return JSON.stringify({
        message: `Token ${name} (${ticker}) deployed successfully at ${tokenAddress}.`,
        tokenAddress: tokenAddress,
        chain: "baseSepolia",
      });
    } catch (error) {
      console.error(`Error creating coin ${name} ${ticker}: ${error}`);
      return JSON.stringify({
        message: `An error occurred while deploying the token ${name} (${ticker}).`,
        tokenAddress: null,
        chain: "baseSepolia",
      });
    }
  },
});

export const createCustomAgent = async ({
  llm,
  instructions,
}: {
  llm: LanguageModelLike;
  instructions?: string;
}) => {
  const tools = [createCryptoTool];

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", instructions || defaultInstructions],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]);

  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  const runnable = new AgentExecutor({
    agent,
    tools,
    verbose: true,
    callbacks: [],
  });

  return new RunnableWithMessageHistory({
    runnable,
    getMessageHistory: () => new ChatMessageHistory(),
    inputMessagesKey: "input",
    historyMessagesKey: "chat_history",
  });
};

export const customAgent = await createCustomAgent({
  llm: new ChatOpenAI({
    modelName: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
  }),
});
