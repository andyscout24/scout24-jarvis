import { ApiError } from "../errors/apiError.mjs";

export function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

export function sendSuccess(res, statusCode, data, message = "OK") {
  sendJson(res, statusCode, {
    success: true,
    data,
    message,
  });
}

export function sendBinary(res, statusCode, body, {
  contentType = "application/octet-stream",
  filename = "",
} = {}) {
  const headers = {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  };
  if (filename) {
    headers["Content-Disposition"] = `attachment; filename="${filename}"`;
  }
  res.writeHead(statusCode, headers);
  res.end(body);
}

export function sendErrorResponse(res, error) {
  if (error instanceof ApiError) {
    sendJson(res, error.statusCode, {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  sendJson(res, 500, {
    success: false,
    error: {
      code: "internal_error",
      message: "Der Server konnte die Anfrage nicht verarbeiten.",
    },
  });
}
