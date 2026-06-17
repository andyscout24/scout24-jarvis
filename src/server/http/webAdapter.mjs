export function createWebRequest(request) {
  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  return {
    method: request.method,
    headers,
    async text() {
      return request.text();
    },
  };
}

export function createWebResponse() {
  let statusCode = 200;
  const headers = new Headers();
  let body = null;

  return {
    writeHead(nextStatusCode, nextHeaders = {}) {
      statusCode = nextStatusCode;
      for (const [key, value] of Object.entries(nextHeaders)) {
        headers.set(key, value);
      }
    },

    end(nextBody = "") {
      body = normalizeBody(nextBody);
    },

    toResponse() {
      return new Response(body, {
        status: statusCode,
        headers,
      });
    },
  };
}

function normalizeBody(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Uint8Array || typeof value === "string") return value;
  return String(value);
}
