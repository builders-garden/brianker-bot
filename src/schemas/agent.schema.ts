import { z } from "zod";

// https://js.langchain.com/docs/tutorials/extraction/
export const createCryptoSchema = z.object({
  name: z.string().describe("The name of the cryptocoin to create"),
  ticker: z.string().describe("The ticker of the cryptocoin to create"),
  imageUrl: z
    .string()
    .url()
    .describe("The image url of the cryptocoin to create"),
  dateTime: z
    .string()
    .nullish()
    .describe(
      "The date and time to allow the trading on the pool, converted to GMT time"
    )
    // default to one hour from now
    .default(new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()),
});
