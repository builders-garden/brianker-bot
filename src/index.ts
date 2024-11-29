import express from "express";
import slowDown from "express-slow-down";

import { env } from "./env.js";
import { setupWebhook } from "./utils/neynar.js";
import { testsRouter, utilsRouter, webhooksRouter } from "./routes/index.js";

export const app = express();

const apiLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 200, // Allow only 200 requests per minute to go at full speed.
  delayMs: (_) => 1000, // Slow down each request after the limit by 1 second.
  validate: { xForwardedForHeader: false },
});

app.use(express.json({ limit: "10mb" }));
app.use(apiLimiter);
app.use("/", utilsRouter);
app.use("/webhooks", webhooksRouter);
// TODO: remove this before deploying
app.use("/tests", testsRouter);

app.listen(env.PORT, async () => {
  console.log(`⚡️ briannah running on port ${env.PORT}`);
  await setupWebhook();
  console.log(`🎣 neynar webhook setup complete.`);
});
