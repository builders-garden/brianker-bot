import * as dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .trim()
    .default("3000")
    .transform((v) => parseInt(v)),
  // frame handler
  ASKBRIAN_FRAME_HANDLER_URL: z.string().url().trim().min(1),
  // brian
  BRIAN_API_URL: z.string().url().trim().min(1),
  BRIAN_API_KEY: z.string().trim().min(1),
  // redis
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z
    .string()
    .transform((val) => (val ? parseInt(val) : undefined))
    .optional(),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  // neynar
  NEYNAR_API_KEY: z.string().trim().min(1),
  NEYNAR_SIGNER_UUID: z.string().trim().min(1),
  NEYNAR_WEBHOOK_NAME: z.string().trim().min(1),
  NEYNAR_WEBHOOK_TARGET_URL: z.string().url().trim().min(1),
  NEYNAR_WEBHOOK_SECRET: z.string().trim().min(1),
  // turso
  TURSO_DATABASE_URL: z.string().url().trim().min(1),
  TURSO_AUTH_TOKEN: z.string().trim().min(1),
  // openai
  OPENAI_API_BASE_URL: z.string().url().trim().min(1),
  OPENAI_API_KEY: z.string().trim().min(1),
});

const { data, success, error } = envSchema.safeParse(process.env);

if (!success) {
  console.error(
    `An error has occurred while parsing environment variables:${error.errors.map(
      (e) => ` ${e.path.join(".")} is ${e.message}`
    )}`
  );
  process.exit(1);
}

export type EnvSchemaType = z.infer<typeof envSchema>;
export const env = data;
