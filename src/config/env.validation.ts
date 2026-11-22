import { z } from "zod";

export const envSchema = z.object({
  // fails fast at boot if env is wrong
  DATABASE_URL: z
    .string()
    .startsWith("mongodb", "DATABASE_URL must be a MongoDB connection string"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().default(604800),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});
export type Env = z.infer<typeof envSchema>;
