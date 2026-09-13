// Point this at your deployed backend (Render URL), or leave as-is for local dev.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const TOKEN_KEY = "gym_tracker_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof URLSearchParams)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Request failed");
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getMe: () => request("/auth/me"),

  register: (email: string, password: string, name: string, lastName: string) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, last_name: lastName }),
    }),

  login: async (email: string, password: string) => {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    const data = await request("/auth/login", { method: "POST", body: form });
    setToken(data.access_token);
    return data;
  },

  getToday: () => request("/today"),

  getRoutine: (dayOfWeek?: number) =>
    request(`/exercises${dayOfWeek !== undefined ? `?day_of_week=${dayOfWeek}` : ""}`),

  addExercise: (name: string, dayOfWeek: number, orderIndex = 0) =>
    request("/exercises", {
      method: "POST",
      body: JSON.stringify({ name, day_of_week: dayOfWeek, order_index: orderIndex }),
    }),

  deleteExercise: (id: number) => request(`/exercises/${id}`, { method: "DELETE" }),

  updateExerciseOrder: (id: number, orderIndex: number) =>
    request(`/exercises/${id}/order`, {
      method: "PATCH",
      body: JSON.stringify({ order_index: orderIndex }),
    }),

  addLog: (exerciseId: number, weight: number, reps?: number, sets?: number) =>
    request(`/exercises/${exerciseId}/logs`, {
      method: "POST",
      body: JSON.stringify({ weight, reps, sets }),
    }),

  getLogs: (exerciseId: number, daysBack = 60) =>
    request(`/exercises/${exerciseId}/logs?days_back=${daysBack}`),

  updateProfile: (fields: { profile_picture?: string; name?: string; last_name?: string }) =>
    request("/auth/me", { method: "PATCH", body: JSON.stringify(fields) }),

  googleLogin: (credential: string) =>
    request("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }),

  addBodyMetric: (fields: {
    weight?: number;
    muscle_mass?: number;
    fat_percentage?: number;
    visceral_fat?: number;
  }) => request("/body-metrics", { method: "POST", body: JSON.stringify(fields) }),

  getBodyMetrics: (daysBack: number) => request(`/body-metrics?days_back=${daysBack}`),
};
