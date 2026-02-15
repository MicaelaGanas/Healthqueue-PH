/**
 * API client for backend. Set NEXT_PUBLIC_API_URL in .env to point to your API.
 * Replace localStorage usage across the app with calls to these (or similar) functions
 * once the backend is implemented.
 */

const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "";
};

export function apiUrl(path: string): string {
  const base = getBaseUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : "";
}

export function isApiConfigured(): boolean {
  return Boolean(getBaseUrl());
}

/** Fetch with JSON body and auth placeholder. Extend headers (e.g. Authorization) as needed. */
export async function apiFetch<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...rest } = options;
  let url = apiUrl(path);
  if (params && Object.keys(params).length > 0) {
    const search = new URLSearchParams(params).toString();
    url += (url.includes("?") ? "&" : "?") + search;
  }
  const res = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...rest.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Example: fetch queue status by ticket/number. Replace with real endpoint. */
export type QueueStatusResult = {
  queueNumber: string;
  assignedDepartment: string;
  estimatedWaitTime: string;
  status: "waiting" | "almost" | "proceed";
};

export async function getQueueStatus(queueNumber: string): Promise<QueueStatusResult | null> {
  if (!isApiConfigured()) return null;
  try {
    return await apiFetch<QueueStatusResult>(`/queue/status/${encodeURIComponent(queueNumber)}`);
  } catch {
    return null;
  }
}

/** Example: fetch alerts for nurse dashboard. Replace with real endpoint. */
export type AlertResult = {
  id: string;
  type: string;
  icon: string;
  detail: string;
  time: string;
  unread: boolean;
};

export async function getAlerts(): Promise<AlertResult[]> {
  if (!isApiConfigured()) return [];
  try {
    return await apiFetch<AlertResult[]>("/alerts");
  } catch {
    return [];
  }
}
