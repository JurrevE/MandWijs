import { formatEuro } from "@/config/site";
import type { EmailPreference } from "@/domain/email";
import type { ShoppingPlan } from "@/domain/types";

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]!);
const formatQuantity = (value: number) => new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 3 }).format(value);

export interface WeeklyEmailInput {
  name: string;
  preference: Exclude<EmailPreference, "none">;
  plan: ShoppingPlan;
  unmatchedProductNames: string[];
  validFrom: string;
  validUntil: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
}

export function renderWeeklyEmail(input: WeeklyEmailInput) {
  const stores = [...new Set(input.plan.options.map((option) => option.storeName))];
  const storeLabel = stores.length
    ? `${stores.length} ${stores.length === 1 ? "winkel" : "winkels"}: ${stores.join(" → ")}`
    : "Nog geen bruikbare winkelcombinatie";
  const productRows = input.preference === "full"
    ? input.plan.options.map((option) => {
        const detail = [
          `${formatQuantity(option.requestedQuantity)}×`,
          option.storeName,
          option.actionLabel,
        ].filter(Boolean).join(" · ");
        return `<tr><td style="padding:12px 8px 12px 0;border-bottom:1px solid #e1e9e5"><strong style="display:block">${escapeHtml(option.productName)}</strong><span style="display:block;margin-top:4px;color:#65706c;font-size:12px">${escapeHtml(detail)}</span>${option.warning ? `<span style="display:block;margin-top:4px;color:#98601f;font-size:11px">${escapeHtml(option.warning)}</span>` : ""}</td><td style="padding:12px 0;border-bottom:1px solid #e1e9e5;text-align:right;font-weight:700;white-space:nowrap">${formatEuro(option.priceCents)}</td></tr>`;
      }).join("")
    : "";
  const unmatchedHtml = input.unmatchedProductNames.length
    ? `<div style="margin:20px 0;padding:16px;background:#fff8ed;border-radius:14px;color:#87531c;font-size:12px;line-height:1.6"><strong>Niet betrouwbaar gematcht</strong><br>${input.unmatchedProductNames.map(escapeHtml).join(", ")}. Controleer deze producten zelf in je dashboard.</div>`
    : "";
  const summary = input.preference === "full"
    ? `${input.plan.options.length} gematchte producten met winkelverdeling en prijsvoorwaarden.`
    : `${input.plan.options.length} gematchte producten verdeeld over ${stores.length} ${stores.length === 1 ? "winkel" : "winkels"}.`;
  const textProducts = input.preference === "full"
    ? input.plan.options.map((option) => `- ${formatQuantity(option.requestedQuantity)}× ${option.productName} bij ${option.storeName}: ${formatEuro(option.priceCents)}`).join("\n")
    : "Open MandWijs voor de volledige boodschappenlijst en prijsvoorwaarden.";
  const unmatchedText = input.unmatchedProductNames.length
    ? `\nNiet betrouwbaar gematcht: ${input.unmatchedProductNames.join(", ")}.`
    : "";

  return {
    subject: `Je MandWijs-weekadvies: ${formatEuro(input.plan.totalCents)} geschat`,
    html: `<!doctype html><html lang="nl"><body style="margin:0;background:#f4f7f5;color:#101211;font-family:Arial,sans-serif"><div style="display:none">Je persoonlijke boodschappenadvies voor deze week.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:620px;background:white;border-radius:20px;overflow:hidden"><tr><td style="background:#173d32;padding:30px;color:white"><div style="font-size:22px;font-weight:800">MandWijs</div><h1 style="margin:28px 0 8px;font-size:30px;line-height:1.15">Goedemorgen, ${escapeHtml(input.name)}</h1><p style="margin:0;color:#b9d3ca">Je persoonlijke weekadvies staat klaar.</p></td></tr><tr><td style="padding:30px"><p style="margin:0;color:#65706c;font-size:13px">GELDIG ${escapeHtml(input.validFrom)} – ${escapeHtml(input.validUntil)}</p><div style="margin:18px 0 22px;padding:22px;background:#edf6f2;border-radius:16px"><div style="font-size:13px;color:#65706c">Geschat totaal · ${escapeHtml(input.plan.label)}</div><div style="margin-top:6px;font-size:36px;font-weight:800;color:#173d32">${formatEuro(input.plan.totalCents)}</div><div style="margin-top:6px;font-size:13px;color:#65706c">${escapeHtml(storeLabel)}</div></div><p style="color:#65706c;font-size:13px;line-height:1.6">${escapeHtml(summary)}</p>${productRows ? `<h2 style="margin-top:26px;font-size:18px">Je boodschappen</h2><table width="100%" cellspacing="0">${productRows}</table>` : `<p style="color:#65706c;line-height:1.6">Open je dashboard voor de volledige boodschappenlijst, prijsvoorwaarden en winkelvolgorde.</p>`}${unmatchedHtml}<p style="margin:28px 0"><a href="${escapeHtml(input.dashboardUrl)}" style="display:inline-block;background:#173d32;color:white;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:700">Bekijk je winkelplan</a></p><p style="font-size:12px;line-height:1.6;color:#78837f">Prijzen zijn schattingen op basis van beschikbare actuele data. Verplichte actie-aantallen staan hierboven of in je dashboard. Filiaalvoorraad is niet bevestigd.</p></td></tr><tr><td style="padding:20px 30px;background:#f6f9f7;font-size:11px;color:#78837f">Je ontvangt dit omdat de maandagmail aanstaat. <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#365f51">Voorkeur wijzigen</a></td></tr></table></td></tr></table></body></html>`,
    text: `Goedemorgen, ${input.name}\n\nJe MandWijs-weekadvies voor ${input.validFrom} t/m ${input.validUntil}.\nGeschat totaal: ${formatEuro(input.plan.totalCents)}\n${storeLabel}\n\n${textProducts}${unmatchedText}\n\nBekijk je winkelplan: ${input.dashboardUrl}\nVoorkeur wijzigen: ${input.unsubscribeUrl}\n\nPrijzen zijn schattingen; filiaalvoorraad is niet bevestigd.`,
  };
}
