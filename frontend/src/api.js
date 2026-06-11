const BASE = import.meta.env.VITE_API_URL || "";
console.log("API BASE:", BASE);
export async function api(path, opts = {}) {
  const { method = "GET", body, token } = opts;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const headers = {};

  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const msg =
        data && data.error
          ? data.error
          : typeof data === "string"
          ? data
          : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return data;
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error("Сервер слишком долго отвечает");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}