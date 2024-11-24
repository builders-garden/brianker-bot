import { Request, Response } from "express";
import { repliesQueue } from "../../queues/replies.js";

export const metricsHandler = async (_: Request, res: Response) => {
  res.status(200).send({
    result: {
      replies: {
        completed: await repliesQueue?.getCompletedCount(),
        failed: await repliesQueue?.getFailedCount(),
        waiting: await repliesQueue?.getWaitingCount(),
        delayed: await repliesQueue?.getDelayedCount(),
      },
    },
  });
};
