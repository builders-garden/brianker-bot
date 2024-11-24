import { env } from "../env.js";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { TransactionResult } from "@brian-ai/sdk";
import { TransactionsDataType } from "./types.js";
import { askbrianRequestsTable } from "./db/schema.js";

export const tursoClient = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(tursoClient);

type BrianRequest = {
  status: string;
  errorMessage?: string;
  cast?: {
    hash: string;
    text: string;
    author: {
      custody_address: string;
      verified_addresses: {
        eth_addresses: string[];
      };
    };
  };
  brianInput?: {
    originWallet: string;
    prompt: string;
  };
  brianResponse?: TransactionResult[];
  frameData?: TransactionsDataType;
  openaiMessage?: string;
  redisOperationId?: string;
};

export const saveBrianRequest = async (brianRequest: BrianRequest) => {
  await db.insert(askbrianRequestsTable).values({
    status: brianRequest.status,
    errorMessage: brianRequest.errorMessage || null,
    castHash: brianRequest.cast?.hash || null,
    castText: brianRequest.cast?.text || null,
    castAuthorCustodyAddress:
      brianRequest.cast?.author?.custody_address || null,
    castAuthorVerifiedEthAddresses: JSON.stringify(
      brianRequest.cast?.author?.verified_addresses?.eth_addresses || []
    ),
    brianInputOriginWallet: brianRequest.brianInput?.originWallet || null,
    brianInputPrompt: brianRequest.brianInput?.prompt || null,
    brianResponse: JSON.stringify(brianRequest.brianResponse || null),
    frameData: JSON.stringify(brianRequest.frameData || null),
    openaiMessage: brianRequest.openaiMessage || null,
    redisOperationId: brianRequest.redisOperationId || null,
  });
};
