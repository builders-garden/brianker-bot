import { sql } from "drizzle-orm";
import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

export const askbrianFrameResultsTable = sqliteTable("askbrian_frame_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  operations: text("operations").notNull(),
  redisOperationId: text("redis_operation_id").unique(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const askbrianRequestsTable = sqliteTable("askbrian_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  castHash: text("cast_hash"),
  castText: text("cast_text"),
  castAuthorCustodyAddress: text("cast_author_custody_address"),
  castAuthorVerifiedEthAddresses: text("cast_author_verified_eth_addresses"),
  brianInputOriginWallet: text("brian_input_origin_wallet"),
  brianInputPrompt: text("brian_input_prompt"),
  brianResponse: text("brian_response"),
  frameData: text("frame_data"),
  openaiMessage: text("openai_message"),
  redisOperationId: text("redis_operation_id"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
