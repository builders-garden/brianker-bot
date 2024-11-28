import { Channel } from "../schemas/index.js";
import { addToRepliesQueue } from "../queues/index.js";

export const replyWithError = async (
  channel: Channel,
  replyTo: string,
  text?: string
) => {
  addToRepliesQueue({
    text: text || "There was an issue with your prompt. Please try again.",
    id: `replyTo-${replyTo}-${Date.now()}`,
    replyTo,
    embeds: [],
    channel,
  });
};

export const replyWithSuccess = async (
  channel: Channel,
  replyTo: string,
  text: string,
  embeds: { url: string }[]
) => {
  addToRepliesQueue({
    text,
    id: `replyTo-${replyTo}-${Date.now()}`,
    replyTo,
    embeds,
    channel,
  });
};
