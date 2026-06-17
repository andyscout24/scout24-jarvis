import { badRequest, payloadTooLarge } from "../errors/apiError.mjs";

const maxJsonBodyBytes = 1024 * 1024;

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    req.on("data", (chunk) => {
      if (settled) return;
      raw += chunk;
      if (Buffer.byteLength(raw) > maxJsonBodyBytes) {
        fail(payloadTooLarge("payload_too_large", "Der Request Body ist zu gross."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(badRequest("invalid_json", "Der Request Body ist kein gueltiges JSON."));
      }
    });
    req.on("error", (error) => {
      if (!settled) reject(error);
    });
  });
}

export function getApiSegments(url) {
  return url.pathname.split("/").filter(Boolean).slice(1);
}
