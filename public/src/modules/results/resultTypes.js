import { formatCurrency } from "../../utils.js";

export function getResultType(result) {
  if (result.id?.startsWith("offer")) return "offer";
  if (result.id?.startsWith("report")) return "report";
  return "artifact";
}

export function describeResult(result) {
  const type = getResultType(result);

  if (type === "offer") {
    return {
      type,
      title: `${result.clientName} - ${formatCurrency(result.amount, result.currency)}`,
      meta: `Angebot - ${result.status}`,
      ready: result.status === "sent" || result.status === "generated",
    };
  }

  if (type === "report") {
    return {
      type,
      title: `${result.clientName} - ${result.campaignName}`,
      meta: `Report - ${result.fileName}`,
      ready: result.status === "completed" || result.status === "exported" || result.status === "generated",
    };
  }

  return {
    type,
    title: result.name || result.id,
    meta: result.status || "artifact",
    ready: result.status === "completed",
  };
}
