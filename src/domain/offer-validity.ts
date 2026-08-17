import type { Offer } from "@/domain/types";

export const DEFAULT_MARKET_TIME_ZONE = "Europe/Amsterdam";

export function calendarDateInTimeZone(
  date: Date,
  timeZone = DEFAULT_MARKET_TIME_ZONE,
) {
  if (Number.isNaN(date.getTime())) throw new Error("De peildatum is ongeldig.");

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");
  if (!year || !month || !day) throw new Error("De lokale peildatum kon niet worden bepaald.");
  return `${year}-${month}-${day}`;
}

export const isDateWithinOfferWindow = (
  calendarDate: string,
  validFrom: string,
  validUntil: string,
) => validFrom <= calendarDate && calendarDate <= validUntil;

export function isOfferCurrentOnDate(
  offer: Pick<Offer, "actionType" | "validFrom" | "validUntil">,
  asOf: Date,
) {
  if (offer.actionType === "none") return true;
  return isDateWithinOfferWindow(
    calendarDateInTimeZone(asOf),
    offer.validFrom,
    offer.validUntil,
  );
}
