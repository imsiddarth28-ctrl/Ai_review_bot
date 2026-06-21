export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  oauth_provider: string | null;
  created_at: string;
};

export type Repository = {
  id: string;
  user_id: string;
  repo_name: string;
  provider: string;
  owner: string;
  created_at: string;
};

export type Review = {
  id: string;
  repository_id: string;
  pr_number: number;
  pr_title: string | null;
  status: string;
  severity_summary: Record<string, number> | null;
  ai_model: string | null;
  created_at: string;
};

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function clearToken() {
  localStorage.removeItem('access_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Request failed');
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  me: () => request<User>('/auth/me'),
  updateMe: (data: Pick<User, 'name' | 'email'>) =>
    request<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
  repositories: () => request<Repository[]>('/repositories/'),
  createRepository: (data: { owner: string; repo_name: string; provider: string }) =>
    request<Repository>('/repositories/', { method: 'POST', body: JSON.stringify(data) }),
  deleteRepository: (id: string) => request<{ status: string }>(`/repositories/${id}`, { method: 'DELETE' }),
  reviews: () => request<Review[]>('/reviews/'),
  githubRepositories: () => request<any[]>('/github/repositories'),
};
