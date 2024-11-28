import { z } from "zod";

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
});

// https://js.langchain.com/docs/how_to/structured_output/
export const responseFormatterSchema = z.object({
  message: z.string().describe("The message to return to the user"),
  tokenAddress: z
    .string()
    .optional()
    .describe("The address of the token deployed"),
});

export type ResponseFormatterSchema = z.infer<typeof responseFormatterSchema>;
