import { clearStoredPassword, getStoredPassword } from "../auth/appPassword";

export class ApiError extends Error {
  readonly status: number;
  readonly data: Record<string, unknown> | null;

  constructor(message: string, status: number, data: Record<string, unknown> | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    headers: { "Content-Type": "application/json", "x-app-password": getStoredPassword() },
    ...options,
  });

  if (!res.ok) {
    if (res.status === 401) clearStoredPassword();
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error ?? "Ocurrió un error inesperado.", res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
