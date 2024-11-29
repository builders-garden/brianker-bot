import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tokenTable = sqliteTable("token", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  address: text("address").unique().notNull(),
  name: text("name").notNull(),
  ticker: text("ticker").notNull(),
  requestedBy: text("requestedBy").notNull(),
  image: text("image").notNull(),
  dateTime: text("date_time").notNull(), // date and time to allow the trading on the pool, converted to GMT time
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Token = typeof tokenTable.$inferSelect;

// track user requests and brian/openai responses
export const briankerRequestsTable = sqliteTable("brianker_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  inputCast: text("input_cast"),
  brianInputOriginWallet: text("brian_input_origin_wallet"),
  brianResponse: text("brian_response"),
  grokResponse: text("grok_response"),
  redisOperationId: text("redis_operation_id"),
  tokenAddress: text("token_address").references(() => tokenTable.address),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type BriankerRequest = typeof briankerRequestsTable.$inferSelect;
