export type ApiErrorShape = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type Dataset = {
  id: string;
  userId: string;
  name: string;
  status: string;
  originalFilename: string | null;
  rowCount: number;
  previewJson?: unknown;
  createdAt: string;
};

export type InsightJson = {
  summary: string;
  topSpendingCategories: Array<{
    category: string;
    amount: number;
    reason: string;
  }>;
  anomalies: Array<{
    date: string;
    description: string;
    category: string;
    amount: number;
    reason: string;
  }>;
  recommendations: [string, string, string];
  openaiError?: string;
};

export type Insight = {
  id: string;
  createdAt: string;
  model: string;
  insightText: string;
  insightJson: InsightJson | null;
};

export type Transaction = {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: string;
};

export type AuditActivity = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  meta: unknown;
  createdAt: string;
};

export type QuotaInfo = {
  insightsToday: number;
  quota: number;
  remaining: number;
};

export type DatasetDetail = Dataset & {
  insights: Insight[];
  transactionStats: {
    count: number;
    totalAmount: string;
    averageAmount: string;
  };
};

export type PaginatedMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CategoryStat = { category: string; total: number; count: number };
export type MonthStat = { month: string; income: number; expenses: number; net: number };

export type MetricsJson = {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
  avgTransaction: number;
  topCategories: CategoryStat[];
  monthlyBreakdown: MonthStat[];
};

export type MetricSnapshot = {
  id: string;
  computedAt: string;
  metricsJson: MetricsJson;
  cached: boolean;
};

const TOKEN_KEY = "insightstack_token";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
};

async function request<T>(
  path: string,
  init: RequestInit = {},
  withAuth = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = withAuth ? getToken() : null;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(path, { ...init, headers });
  let body: unknown = null;

  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const payload = body as ApiErrorShape | null;
    const message = payload?.error?.message ?? "Request failed";
    throw new Error(message);
  }

  return body as T;
}

export function exportTransactionsToCsv(
  transactions: Transaction[],
  filename = "transactions.csv",
): void {
  const header = "date,description,category,amount";
  const rows = transactions.map(
    (tx) =>
      `${tx.date.slice(0, 10)},"${tx.description.replace(/"/g, '""')}","${tx.category.replace(/"/g, '""')}",${tx.amount}`,
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const api = {
  register: (input: { name: string; email: string; password: string }) =>
    request<{ token: string; user: AuthUser }>(
      "/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
      false,
    ),

  login: (input: { email: string; password: string }) =>
    request<{ token: string; user: AuthUser }>(
      "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
      false,
    ),

  me: () => request<{ token: string; user: AuthUser }>("/api/auth/me"),

  quota: () => request<{ data: QuotaInfo }>("/api/auth/me/quota"),

  listActivity: (page = 1, pageSize = 25) =>
    request<{ data: AuditActivity[]; meta: PaginatedMeta }>(
      `/api/activity?page=${page}&pageSize=${pageSize}`
    ),

  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    request<{ data: { ok: boolean } }>("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),

  deleteAccount: (input: { password: string }) =>
    request<{ data: { ok: boolean } }>("/api/auth/me", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),

  logout: () =>
    request<{ success: boolean }>(
      "/api/auth/logout",
      { method: "POST" },
      false,
    ),

  listDatasets: (params?: {
    page?: number;
    pageSize?: number;
    sort?: "createdAt";
    order?: "asc" | "desc";
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.sort) query.set("sort", params.sort);
    if (params?.order) query.set("order", params.order);
    const path = query.size > 0 ? `/api/datasets?${query.toString()}` : "/api/datasets";
    return request<{ data: Dataset[]; meta: PaginatedMeta }>(path);
  },

  createDataset: (input: { name: string }) =>
    request<{ data: Dataset }>("/api/datasets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),

  renameDataset: (id: string, name: string) =>
    request<{ data: Dataset }>(`/api/datasets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),

  deleteDataset: (id: string) =>
    request<{ data: { id: string } }>(`/api/datasets/${id}`, {
      method: "DELETE",
    }),

  getDataset: (id: string) =>
    request<{ data: DatasetDetail }>(`/api/datasets/${id}`),

  uploadDatasetCsv: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{
      data: {
        id: string;
        status: string;
        rowCount: number;
        originalFilename: string | null;
        previewJson: unknown;
      };
    }>(`/api/datasets/${id}/upload`, {
      method: "POST",
      body: form,
    });
  },

  getMetrics: (id: string) =>
    request<{ data: MetricSnapshot }>(`/api/datasets/${id}/metrics`),

  generateInsights: (id: string) =>
    request<{
      data: Insight;
    }>(`/api/datasets/${id}/insights`, {
      method: "POST",
    }),

  listInsights: (
    id: string,
    params?: {
      page?: number;
      pageSize?: number;
      sort?: "createdAt";
      order?: "asc" | "desc";
    },
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.sort) query.set("sort", params.sort);
    if (params?.order) query.set("order", params.order);
    const path =
      query.size > 0
        ? `/api/datasets/${id}/insights?${query.toString()}`
        : `/api/datasets/${id}/insights`;
    return request<{ data: Insight[]; meta: PaginatedMeta }>(path);
  },

  getTransactions: (
    id: string,
    params?: {
      page?: number;
      pageSize?: number;
      sort?: "date" | "amount" | "category";
      order?: "asc" | "desc";
      search?: string;
      category?: string;
    },
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.sort) query.set("sort", params.sort);
    if (params?.order) query.set("order", params.order);
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    const path =
      query.size > 0
        ? `/api/datasets/${id}/transactions?${query.toString()}`
        : `/api/datasets/${id}/transactions`;
    return request<{ data: Transaction[]; meta: PaginatedMeta; categories: string[] }>(path);
  },

  recentActivity: () =>
    request<{ data: AuditActivity[] }>("/api/activity"),
};
