import { formatEuro } from "@/config/site";
import type { EmailPreference } from "@/domain/email";
import type { ShoppingPlan } from "@/domain/types";

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]!);

interface WeeklyEmailInput {
  name: string;
  preference: Exclude<EmailPreference, "none">;
  plan: ShoppingPlan;
  validFrom: string;
  validUntil: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
}

export function renderWeeklyEmail(input: WeeklyEmailInput) {
  const stores = [...new Set(input.plan.options.map((option) => option.storeName))];
  const productRows = input.preference === "full"
    ? input.plan.options.map((option) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e1e9e5">${escapeHtml(option.productName)}</td><td style="padding:10px 0;border-bottom:1px solid #e1e9e5;text-align:right;font-weight:700">${formatEuro(option.priceCents)}</td></tr>`).join("")
    : "";
  return {
    subject: `Je Kopert-weekadvies: ${formatEuro(input.plan.totalCents)} geschat`,
    html: `<!doctype html><html lang="nl"><body style="margin:0;background:#f4f7f5;color:#101211;font-family:Arial,sans-serif"><div style="display:none">Je persoonlijke boodschappenadvies voor deze week.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:620px;background:white;border-radius:20px;overflow:hidden"><tr><td style="background:#173d32;padding:30px;color:white"><div style="font-size:22px;font-weight:800">Kopert</div><h1 style="margin:28px 0 8px;font-size:30px;line-height:1.15">Goedemorgen, ${escapeHtml(input.name)}</h1><p style="margin:0;color:#b9d3ca">Je persoonlijke weekadvies staat klaar.</p></td></tr><tr><td style="padding:30px"><p style="margin:0;color:#65706c;font-size:13px">GELDIG ${escapeHtml(input.validFrom)} – ${escapeHtml(input.validUntil)}</p><div style="margin:18px 0 26px;padding:22px;background:#edf6f2;border-radius:16px"><div style="font-size:13px;color:#65706c">Geschat totaal · ${escapeHtml(input.plan.label)}</div><div style="margin-top:6px;font-size:36px;font-weight:800;color:#173d32">${formatEuro(input.plan.totalCents)}</div><div style="margin-top:6px;font-size:13px;color:#65706c">${stores.length} ${stores.length === 1 ? "winkel" : "winkels"}: ${stores.map(escapeHtml).join(" → ")}</div></div>${productRows ? `<h2 style="font-size:18px">Je boodschappen</h2><table width="100%" cellspacing="0">${productRows}</table>` : `<p style="color:#65706c;line-height:1.6">Open je dashboard voor de volledige boodschappenlijst, prijsvoorwaarden en winkelvolgorde.</p>`}<p style="margin:28px 0"><a href="${escapeHtml(input.dashboardUrl)}" style="display:inline-block;background:#173d32;color:white;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:700">Bekijk je winkelplan</a></p><p style="font-size:12px;line-height:1.6;color:#78837f">Prijzen zijn schattingen op basis van beschikbare data. Verplichte actie-aantallen staan in je dashboard.</p></td></tr><tr><td style="padding:20px 30px;background:#f6f9f7;font-size:11px;color:#78837f">Je ontvangt dit omdat de maandagmail aanstaat. <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#365f51">Uitschrijven</a></td></tr></table></td></tr></table></body></html>`,
  };
}
