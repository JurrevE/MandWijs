import { z } from "zod";

export const emailPreferenceSchema = z.enum(["none", "summary", "full"]);
export type EmailPreference = z.infer<typeof emailPreferenceSchema>;

export const shouldSendWeeklyEmail = (preference: EmailPreference, hasActiveProducts: boolean) =>
  preference !== "none" && hasActiveProducts;

export const weeklyEmailKey = (userId: string, isoWeek: string) => `${userId}:${isoWeek}`;

export function isoWeek(date = new Date()) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return `${target.getUTCFullYear()}-W${String(Math.ceil(((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)).padStart(2, "0")}`;
}

export function currentWeekRange(date = new Date()) {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = monday.getUTCDay() || 7;
  monday.setUTCDate(monday.getUTCDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const format = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return { validFrom: `maandag ${format.format(monday)}`, validUntil: `zondag ${format.format(sunday)}` };
}
