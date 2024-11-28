import { AxiosError } from "axios";
import { MetricsTime, Queue, Worker } from "bullmq";

import { Channel, type ReplyBody } from "@/schemas/index.js";
import { Logger, publishCast } from "@/utils/index.js";
import { env } from "@/env.js";
import { redisConnection } from "@/queues/connection.js";

const REPLIES_QUEUE_NAME = "replies";
const logger = new Logger("replies-worker");

/**
 * @dev this function process the reply message from the queue, or directly if the queue is not available.
 * @param job the job to process
 */
export const processReply = async (job: { data: ReplyBody }) => {
  // @ts-ignore
  const { text, replyTo, embeds, channel }: ReplyBody = job.data;

  logger.log(`new reply received. iterating.`);
  logger.log(`${channel} reply text: ${text}`);

  if (channel === Channel.Farcaster) {
    const hash = await publishCast(text, {
      embeds,
      replyTo,
    });
    logger.log(`reply ${hash} published successfully .`);
  }
};

if (env.REDIS_HOST) {
  // @ts-ignore
  const repliesWorker = new Worker(
    REPLIES_QUEUE_NAME,
    async (job: { data: ReplyBody }) => {
      try {
        await processReply(job);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 429) {
          logger.log(`rate limited, trying later.`);
          await repliesWorker.rateLimit(1000 * 5);
          throw Worker.RateLimitError();
        } else if (error instanceof Error) {
          logger.error(`error processing reply: ${error.message}.`);
        }
      }
    },
    {
      connection: redisConnection,
      metrics: {
        maxDataPoints: MetricsTime.ONE_WEEK,
      },
      limiter: {
        // max: 24,
        // duration: 1000 * 60,
        max: 2,
        duration: 1000,
      },
    }
  );
}

export const repliesQueue = env.REDIS_HOST
  ? new Queue(REPLIES_QUEUE_NAME, {
      connection: redisConnection,
    })
  : null;
