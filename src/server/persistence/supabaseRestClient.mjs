export class SupabaseRestClient {
  constructor({ url, serviceRoleKey, schema = "public" }) {
    this.url = stripTrailingSlash(url);
    this.schema = schema;
    this.headers = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": schema,
      "Content-Profile": schema,
    };
  }

  async select(table, { select = "*", filters = [], order, limit } = {}) {
    const params = new URLSearchParams();
    params.set("select", select);
    for (const filter of filters) {
      params.append(filter.column, `${filter.operator || "eq"}.${filter.value}`);
    }
    if (order) params.set("order", order);
    if (limit) params.set("limit", String(limit));
    return this.request(table, { params });
  }

  async insert(table, body) {
    return this.request(table, {
      method: "POST",
      body,
      prefer: "return=representation",
    });
  }

  async patch(table, { filters = [], body }) {
    const params = new URLSearchParams();
    for (const filter of filters) {
      params.append(filter.column, `${filter.operator || "eq"}.${filter.value}`);
    }
    return this.request(table, {
      method: "PATCH",
      params,
      body,
      prefer: "return=representation",
    });
  }

  async request(table, { method = "GET", params, body, prefer } = {}) {
    const query = params?.toString();
    const response = await fetch(`${this.url}/rest/v1/${table}${query ? `?${query}` : ""}`, {
      method,
      headers: {
        ...this.headers,
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message = payload?.message || payload?.hint || `Supabase request failed with ${response.status}`;
      throw new Error(message);
    }

    return Array.isArray(payload) ? payload : payload ? [payload] : [];
  }
}

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}
