import { DASHBOARD_ACTOR } from "../domain/constants.js";

export function offerPayloadFromForm(form) {
  const formData = new FormData(form);
  return {
    clientName: String(formData.get("clientName") || ""),
    industry: String(formData.get("industry") || ""),
    budget: formData.get("budget") ? Number(formData.get("budget")) : null,
    currency: String(formData.get("currency") || "EUR"),
    runtime: String(formData.get("runtime") || ""),
    actor: String(formData.get("actor") || DASHBOARD_ACTOR),
  };
}

export function reportPayloadFromForm(form) {
  const formData = new FormData(form);
  return {
    clientName: String(formData.get("clientName") || ""),
    campaignName: String(formData.get("campaignName") || ""),
    reportingPeriod: String(formData.get("reportingPeriod") || ""),
    channel: String(formData.get("channel") || "Alle Kanaele"),
    reportType: String(formData.get("reportType") || "campaign_review"),
    dataSource: String(formData.get("dataSource") || "csv_upload"),
    actor: String(formData.get("actor") || DASHBOARD_ACTOR),
  };
}
