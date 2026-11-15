const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  constructor(message, status, code, details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function getCsrfToken() {
  let response;
  try {
    response = await fetch(`${API_BASE}/auth/csrf`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new ApiError("Cannot reach the Society API. Start the Spring Boot backend and retry.",
      0, "API_UNAVAILABLE");
  }
  if (!response.ok) {
    throw new ApiError("Could not establish a secure request token. Refresh and try again.",
      response.status, "CSRF_TOKEN_UNAVAILABLE");
  }
  const data = await response.json();
  if (!data.token) {
    throw new ApiError("The server did not return a CSRF token.",
      response.status, "CSRF_TOKEN_UNAVAILABLE");
  }
  return data.token;
}

async function errorFromResponse(response, fallbackMessage) {
  const body = await response.text();
  if (!body.trim()) {
    return new ApiError(
      response.status >= 500
        ? "The Society API could not complete this request. Check the backend and retry."
        : fallbackMessage,
      response.status,
      response.status >= 500 ? "API_UNAVAILABLE" : "INVALID_API_RESPONSE",
    );
  }
  try {
    const data = JSON.parse(body);
    return new ApiError(data.message ?? fallbackMessage,
      response.status, data.code, data.details);
  } catch {
    return new ApiError(
      response.status >= 500
        ? "The Society API could not complete this request. Check the backend and retry."
        : fallbackMessage,
      response.status,
      response.status >= 500 ? "API_UNAVAILABLE" : "INVALID_API_RESPONSE",
    );
  }
}

async function request(path, { method = "GET", body, headers = {}, responseType = "json" } = {}) {
  const normalizedMethod = method.toUpperCase();
  const requestHeaders = { Accept: "application/json", ...headers };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
  if (!["GET", "HEAD", "OPTIONS"].includes(normalizedMethod)) {
    requestHeaders["X-XSRF-TOKEN"] = await getCsrfToken();
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: normalizedMethod,
      credentials: "include",
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the Society API. Start the Spring Boot backend and retry.",
      0, "API_UNAVAILABLE");
  }
  if (responseType === "blob") {
    if (!response.ok) throw await errorFromResponse(response, "The download could not be completed.");
    return response.blob();
  }
  if (response.status === 204) return null;
  const bodyText = await response.text();
  if (!bodyText.trim()) {
    if (response.ok) return null;
    throw new ApiError(
      response.status >= 500
        ? "The Society API could not complete this request. Check the backend and retry."
        : "The request could not be completed.",
      response.status,
      response.status >= 500 ? "API_UNAVAILABLE" : "INVALID_API_RESPONSE",
    );
  }
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new ApiError(
      response.status >= 500
        ? "The Society API could not complete this request. Check the backend and retry."
        : "The server returned an unreadable response.",
      response.status,
      response.status >= 500 ? "API_UNAVAILABLE" : "INVALID_API_RESPONSE",
    );
  }
  if (!response.ok) throw new ApiError(data.message ?? "The request could not be completed.",
    response.status, data.code, data.details);
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  delete: (path) => request(path, { method: "DELETE" }),
  blob: (path) => request(path, { responseType: "blob" }),
};

export function saveDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
