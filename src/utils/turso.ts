import { env } from "@/env.js";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import {
  BriankerRequest,
  briankerRequestsTable,
  Token,
  tokenTable,
} from "@/schemas/index.js";

export const tursoClient = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(tursoClient);

export const saveBrianRequest = async (
  brianRequest: Omit<BriankerRequest, "id" | "createdAt" | "updatedAt">
) => {
  await db.insert(briankerRequestsTable).values({
    status: brianRequest.status,
    errorMessage: brianRequest.errorMessage || null,
    inputCast: brianRequest.inputCast || null,
    brianInputOriginWallet: brianRequest.brianInputOriginWallet || null,
    brianResponse: JSON.stringify(brianRequest.brianResponse || null),
    grokResponse: brianRequest.grokResponse || null,
    redisOperationId: brianRequest.redisOperationId || null,
  });
};

export const saveToken = async (
  token: Omit<Token, "id" | "createdAt" | "updatedAt">
) => {
  await db.insert(tokenTable).values({
    address: token.address,
    name: token.name,
    ticker: token.ticker,
    requestedBy: token.requestedBy,
    image: token.image,
    dateTime: token.dateTime,
  });
};
