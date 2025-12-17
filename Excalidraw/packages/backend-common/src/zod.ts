import { z } from "zod";

export const userSignupSchema = z.object({
  email: z.string().trim().email("Invalid email format"),

  name: z.string().trim().min(1, "Name is required").optional(),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password is too long"),

  photo: z
    .string()
    .url("Photo must be a valid URL")
    .min(1, "Photo URL is required")
    .optional()
    .or(z.literal("")),
});

export type userSignupType = z.infer<typeof userSignupSchema>;

export const userSigninSchema = z.object({
  email: z.string().trim().email("Invalid email format"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
});

export type userSigninType = z.infer<typeof userSigninSchema>;

export const createRoomSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9-]+$/i, "Slug can contain letters, numbers, hyphens only"),
});

export type createRoomType = z.infer<typeof createRoomSchema>;
