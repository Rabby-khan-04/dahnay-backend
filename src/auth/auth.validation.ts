import { z } from "zod";

export const Register = z.strictObject({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1).optional(),
});
export type Register = z.infer<typeof Register>;

export const Login = z.strictObject({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});
export type Login = z.infer<typeof Login>;

export const UserItem = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.iso.datetime(),
});
export type UserItem = z.infer<typeof UserItem>;
