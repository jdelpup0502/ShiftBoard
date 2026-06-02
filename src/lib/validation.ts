import { z } from "zod";

export const BCRYPT_COST = 12;

export const JOB_TITLES = ["SERVER", "HOST", "BUSSER", "BARTENDER"] as const;
export const ROLES = ["MANAGER", "EMPLOYEE"] as const;

export const EmailSchema = z
  .string()
  .min(1, "Email is required.")
  .max(254)
  .email("Invalid email address.")
  .transform((s) => s.trim().toLowerCase());

export const NameSchema = z
  .string()
  .min(1, "Name is required.")
  .max(100, "Name must be 100 characters or less.")
  .transform((s) => s.trim());

export const NoteSchema = z
  .string()
  .max(500, "Note must be 500 characters or less.")
  .optional()
  .transform((s) => s?.trim() || null);

export const PasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password is too long.")
  .refine(
    (pw) => /[a-zA-Z]/.test(pw) && /\d/.test(pw),
    "Password must contain at least one letter and one number.",
  );

export const DayOfWeekSchema = z.coerce
  .number()
  .int("Invalid day of week.")
  .min(0, "Invalid day of week.")
  .max(6, "Invalid day of week.");

export const JobTitleSchema = z.enum(JOB_TITLES, {
  error: () => "Invalid job title.",
});

export const RoleSchema = z.enum(ROLES, {
  error: () => "Invalid role.",
});

export const CountSchema = z.coerce
  .number()
  .int("Count must be a whole number.")
  .min(0, "Count must be 0 or greater.")
  .max(50, "Count cannot exceed 50.");

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((e) => e.message).join(" ");
}
