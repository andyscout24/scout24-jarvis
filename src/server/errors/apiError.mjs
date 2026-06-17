export class ApiError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(code, message, details = undefined) {
  return new ApiError(400, code, message, details);
}

export function payloadTooLarge(code, message, details = undefined) {
  return new ApiError(413, code, message, details);
}

export function notFound(code, message, details = undefined) {
  return new ApiError(404, code, message, details);
}

export function unauthorized(code, message, details = undefined) {
  return new ApiError(401, code, message, details);
}

export function forbidden(code, message, details = undefined) {
  return new ApiError(403, code, message, details);
}
