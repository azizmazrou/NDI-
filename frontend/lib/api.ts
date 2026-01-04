/**
 * API client for NDI backend
 */

import type {
  Assessment,
  AssessmentResponse,
  Task,
  NDIDomain,
  NDIQuestion,
  NDISpecification,
  OrganizationSettings,
  DashboardStats,
  MaturityScoreResult,
  ComplianceScoreResult,
  PaginatedResponse,
} from "@/types/ndi";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function fetchApi<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Default headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(
      errorData?.detail || `API error: ${response.status}`,
      response.status,
      errorData
    );
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// AI Provider types
export interface AIProvider {
  id: string;
  name_en: string;
  name_ar: string;
  api_endpoint: string | null;
  model_name: string | null;
  is_enabled: boolean;
  is_default: boolean;
  has_api_key: boolean;
}

// Organization Settings (single organization)
export const settingsApi = {
  get: () => fetchApi<OrganizationSettings>("/settings/organization"),

  update: (data: Partial<OrganizationSettings>) =>
    fetchApi<OrganizationSettings>("/settings/organization", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // AI Providers
  getAIProviders: () =>
    fetchApi<{ providers: AIProvider[] }>("/settings/ai-providers"),

  updateAIProvider: (providerId: string, data: {
    api_key?: string;
    api_endpoint?: string;
    model_name?: string;
    is_enabled?: boolean;
    is_default?: boolean;
  }) =>
    fetchApi<AIProvider>(`/settings/ai-providers/${providerId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  testAIProvider: (providerId: string, apiKey?: string) =>
    fetchApi<{ success: boolean; message: string; provider_id: string }>(
      `/settings/ai-providers/${providerId}/test`,
      {
        method: "POST",
        body: JSON.stringify({ provider_id: providerId, api_key: apiKey }),
      }
    ),
};

// NDI Data
export const ndiApi = {
  getDomains: () =>
    fetchApi<{ items: NDIDomain[]; total: number }>("/ndi/domains"),

  getDomain: (code: string) => fetchApi<NDIDomain>(`/ndi/domains/${code}`),

  getDomainQuestions: (code: string) => fetchApi<NDIQuestion[]>(`/ndi/domains/${code}/questions`),

  getQuestion: (code: string) => fetchApi<NDIQuestion>(`/ndi/questions/${code}`),

  getQuestionLevels: (code: string) => fetchApi<any[]>(`/ndi/questions/${code}/levels`),

  getSpecifications: (params?: { domain_code?: string; maturity_level?: number }) =>
    fetchApi<{ items: NDISpecification[]; total: number }>("/ndi/specifications", { params }),

  getSpecification: (code: string) => fetchApi<NDISpecification>(`/ndi/specifications/${code}`),
};

// Assessments
export const assessmentsApi = {
  list: (params?: {
    page?: number;
    page_size?: number;
    assessment_type?: string;
    status?: string;
  }) =>
    fetchApi<PaginatedResponse<Assessment>>("/assessments", {
      params,
    }),

  get: (id: string) => fetchApi<Assessment>(`/assessments/${id}`),

  create: (data: {
    assessment_type: string;
    name?: string;
    description?: string;
    target_level?: number;
  }) =>
    fetchApi<Assessment>("/assessments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Assessment>) =>
    fetchApi<Assessment>(`/assessments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/assessments/${id}`, {
      method: "DELETE",
    }),

  submit: (id: string) =>
    fetchApi<Assessment>(`/assessments/${id}/submit`, {
      method: "POST",
    }),

  getReport: (id: string) => fetchApi<any>(`/assessments/${id}/report`),

  // Responses
  getResponses: (assessmentId: string, domainCode?: string) =>
    fetchApi<AssessmentResponse[]>(`/assessments/${assessmentId}/responses`, {
      params: { domain_code: domainCode },
    }),

  saveResponse: (assessmentId: string, data: {
    question_id: string;
    selected_level?: number;
    justification?: string;
    notes?: string;
  }) =>
    fetchApi<AssessmentResponse>(`/assessments/${assessmentId}/responses`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Tasks
export const tasksApi = {
  list: (params?: {
    page?: number;
    page_size?: number;
    assessment_id?: string;
    assigned_to?: string;
    status?: string;
    priority?: string;
  }) =>
    fetchApi<PaginatedResponse<Task>>("/tasks", { params }),

  get: (id: string) => fetchApi<Task>(`/tasks/${id}`),

  create: (data: {
    assessment_id: string;
    question_id?: string;
    domain_code?: string;
    assigned_to: string;
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
  }) =>
    fetchApi<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Task>) =>
    fetchApi<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/tasks/${id}`, {
      method: "DELETE",
    }),

  updateStatus: (id: string, status: string) =>
    fetchApi<Task>(`/tasks/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  getMyTasks: (params?: { status?: string }) =>
    fetchApi<Task[]>("/tasks/my", { params }),

  getAssignedTasks: (params?: { status?: string }) =>
    fetchApi<Task[]>("/tasks/assigned", { params }),
};

// Scores
export const scoresApi = {
  getMaturityScore: (assessmentId: string, language?: string) =>
    fetchApi<MaturityScoreResult>(`/scores/maturity/${assessmentId}`, {
      params: { language },
    }),

  getComplianceScore: (assessmentId: string, language?: string) =>
    fetchApi<ComplianceScoreResult>(`/scores/compliance/${assessmentId}`, {
      params: { language },
    }),

  recalculate: (assessmentId: string) =>
    fetchApi<{ maturity: MaturityScoreResult; compliance: ComplianceScoreResult }>(
      `/scores/recalculate/${assessmentId}`,
      { method: "POST" }
    ),
};

// Dashboard
export const dashboardApi = {
  getStats: (language?: string) =>
    fetchApi<DashboardStats>("/dashboard/stats", {
      params: { language },
    }),

  getRecentActivity: (limit?: number) =>
    fetchApi<any[]>("/dashboard/activity", {
      params: { limit },
    }),
};

// Reports
export const reportsApi = {
  generate: (assessmentId: string, format: "json" | "excel", language?: string) =>
    fetchApi<any>(`/reports/generate/${assessmentId}`, {
      params: { format, language },
    }),

  getAssessmentReport: (assessmentId: string, language?: string) =>
    fetchApi<any>(`/reports/assessment/${assessmentId}`, {
      params: { language },
    }),

  downloadExcel: async (assessmentId: string, language?: string) => {
    const url = `${API_BASE_URL}/reports/generate/${assessmentId}?format=excel${language ? `&language=${language}` : ""}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError("Failed to download report", response.status);
    }
    return response.blob();
  },
};

// Evidence
export const evidenceApi = {
  upload: async (responseId: string, file: File) => {
    const formData = new FormData();
    formData.append("response_id", responseId);
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/evidence/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new ApiError(error?.detail || "Upload failed", response.status, error);
    }

    return response.json();
  },

  get: (id: string) => fetchApi<any>(`/evidence/${id}`),

  delete: (id: string) =>
    fetchApi<void>(`/evidence/${id}`, {
      method: "DELETE",
    }),

  analyze: (id: string) =>
    fetchApi<any>(`/evidence/${id}/analyze`, {
      method: "POST",
    }),
};

// AI
export const aiApi = {
  analyzeEvidence: (data: {
    evidence_id: string;
    question_code: string;
    selected_level: number;
    language?: string;
  }) =>
    fetchApi<any>("/ai/analyze-evidence", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  gapAnalysis: (data: {
    assessment_id: string;
    target_level?: number;
    domain_code?: string;
    language?: string;
  }) =>
    fetchApi<any>("/ai/gap-analysis", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getRecommendations: (data: {
    assessment_id: string;
    focus_areas?: string[];
    language?: string;
  }) =>
    fetchApi<any>("/ai/recommendations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  chat: (data: { messages: { role: string; content: string }[]; context?: any; language?: string }) =>
    fetchApi<any>("/ai/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // New AI evidence analysis endpoints
  analyzeResponseEvidence: (responseId: string, language?: string) =>
    fetchApi<any>("/ai/evidence/analyze-response", {
      method: "POST",
      params: { response_id: responseId, language },
    }),

  suggestEvidenceStructure: (data: {
    question_code: string;
    target_level: number;
    language?: string;
  }) =>
    fetchApi<any>("/ai/evidence/suggest-structure", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  quickCheckEvidence: (data: {
    content: string;
    question_code: string;
    target_level: number;
  }) =>
    fetchApi<any>("/ai/evidence/quick-check", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Users
export const usersApi = {
  list: (params?: { page?: number; page_size?: number; role?: string; is_active?: boolean }) =>
    fetchApi<PaginatedResponse<any>>("/users", { params }),

  get: (id: string) => fetchApi<any>(`/users/${id}`),

  getMe: () => fetchApi<any>("/users/me"),

  update: (id: string, data: any) =>
    fetchApi<any>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export { ApiError };
