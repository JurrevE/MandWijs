import { z } from "zod";

export const emailPreferenceSchema = z.enum(["none", "summary", "full"]);
export type EmailPreference = z.infer<typeof emailPreferenceSchema>;

export const shouldSendWeeklyEmail = (preference: EmailPreference, hasActiveProducts: boolean) =>
  preference !== "none" && hasActiveProducts;

export const weeklyEmailKey = (userId: string, isoWeek: string) => `${userId}:${isoWeek}`;
