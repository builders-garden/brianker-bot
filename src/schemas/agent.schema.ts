import { z } from "zod";

const defaultChains = [
  "ethereum",
  "mainnet",
  "sepolia",
  "base",
  "baseSepolia",
  "unichain",
  "unichainSepolia",
  "optimism",
  "optimismSepolia",
] as const;

// https://js.langchain.com/docs/tutorials/extraction/
export const createCryptoSchema = z.object({
  name: z.string().describe("The name of the crypto to create"),
  ticker: z.string().describe("The ticker of the crypto to create"),
  imageUrl: z
    .string()
    .url()
    .nullish()
    .describe("The image url to use for the crypto to create"),
  // .default("https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/60026409-0a0f-47a1-c052-25043c02df00/original"),
  dateTime: z
    .string()
    .nullish()
    .describe(
      "The date and time to allow the trading on the pool, converted to GMT time"
    )
    // default to one hour from now
    .default(new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()),
  fid: z.number().describe("The fid of the user requesting the token"),
  chain: z
    .enum(defaultChains)
    .nullish()
    .describe(
      "The ethereum EVM chain to deploy the token on, if not provided, it will default to base"
    )
    .default("base"),
});

export type CreateCryptoSchema = z.infer<typeof createCryptoSchema>;

// https://js.langchain.com/docs/how_to/structured_output/
export const responseFormatterSchema = z.object({
  message: z.string().describe("The message to return to the user"),
  tokenAddress: z
    .string()
    .optional()
    .describe("The address of the token deployed"),
  chain: z
    .enum(defaultChains)
    .nullish()
    .describe(
      "The ethereum EVM chain the token was deployed on, if not provided, it will default to base"
    )
    .default("base"),
});

export type ResponseFormatterSchema = z.infer<typeof responseFormatterSchema>;

export const whoAmISchema = z.object({
  username: z
    .string()
    .describe("The username of the user requesting the information"),
});

export type WhoAmISchema = z.infer<typeof whoAmISchema>;
