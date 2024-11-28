import z from "zod";

export enum CastSender {
  BRIANKER = "brianker",
}

export enum Channel {
  Farcaster = "FARCASTER",
  // Twitter = "TWITTER",
}

const embeddedCastSchema = z.object({
  url: z.string().url(),
});

export const replySchema = z.object({
  text: z.string().min(1),
  id: z.string().min(1),
  replyTo: z.string().min(1),
  embeds: z.array(embeddedCastSchema).default([]),
  channel: z.nativeEnum(Channel),
});

export type ReplyBody = z.infer<typeof replySchema>;
