import { ReplyBody } from "../schemas.js";
import { processReply, repliesQueue } from "./replies.js";

const REPLIES_JOB_NAME = "create-reply";

export const addToRepliesQueue = async (data: ReplyBody) => {
  if (repliesQueue) {
    await repliesQueue.add(`${REPLIES_JOB_NAME}-${data.id}`, data, {
      attempts: 1,
      delay: 1000,
    });
    return;
  }
  await processReply({ data });
};
