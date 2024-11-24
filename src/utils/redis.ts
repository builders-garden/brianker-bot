import { createClient } from "redis";
import { env } from "../env.js";
import { CastSender } from "../schemas.js";

const redisConfig = {
  url: `redis://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`,
  // TLS  url: `rediss://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`,
};

export const redisClient = await createClient(redisConfig)
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export type Subscriber = {
  fid?: number;
  address?: string;
  createdAt?: number;
  sender?: CastSender;
};

export const addSubscriber = async (
  channel: string,
  subscriberId: string | number,
  sender: string,
  subscriber: Subscriber
) => {
  subscriber.createdAt = Date.now();
  subscriber.sender = sender as CastSender;
  await redisClient.set(
    `${channel}-${sender}-${subscriberId}`,
    JSON.stringify(subscriber)
  );
  return subscriber;
};

export const removeSubscriber = async (
  channel: string,
  subscriberId: string | number,
  sender: string
) => {
  await redisClient.del(`${channel}-${sender}-${subscriberId}`);
};

export const getSubscriber = async (
  channel: string,
  subscriberId: string | number,
  sender: string
): Promise<Subscriber | undefined> => {
  const subscriber = await redisClient.get(
    `${channel}-${sender}-${subscriberId}`
  );
  return subscriber ? JSON.parse(subscriber) : undefined;
};

export const isSubscribed = async (
  channel: string,
  subscriberId: string | number,
  sender: string
): Promise<boolean> => {
  return !!(await getSubscriber(channel, subscriberId, sender));
};
