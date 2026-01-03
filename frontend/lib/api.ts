/**
 * API client for NDI backend
 */

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

// Organizations
export const organizationsApi = {
  list: (params?: { page?: number; page_size?: number; sector?: string; search?: string }) =>
    fetchApi<{ items: any[]; total: number; page: number; page_size: number }>("/organizations", { params }),

  get: (id: string) => fetchApi<any>(`/organizations/${id}`),

  create: (data: any) =>
    fetchApi<any>("/organizations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/organizations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/organizations/${id}`, {
      method: "DELETE",
    }),
};

// NDI Data
export const ndiApi = {
  getDomains: (includeOe: boolean = true) =>
    fetchApi<{ items: any[]; total: number }>("/ndi/domains", {
      params: { include_oe: includeOe },
    }),

  getDomain: (code: string) => fetchApi<any>(`/ndi/domains/${code}`),

  getDomainQuestions: (code: string) => fetchApi<any[]>(`/ndi/domains/${code}/questions`),

  getQuestion: (code: string) => fetchApi<any>(`/ndi/questions/${code}`),

  getQuestionLevels: (code: string) => fetchApi<any[]>(`/ndi/questions/${code}/levels`),

  getSpecifications: (params?: { domain_code?: string; maturity_level?: number }) =>
    fetchApi<{ items: any[]; total: number }>("/ndi/specifications", { params }),

  getSpecification: (code: string) => fetchApi<any>(`/ndi/specifications/${code}`),
};

// Assessments
export const assessmentsApi = {
  list: (params?: {
    page?: number;
    page_size?: number;
    organization_id?: string;
    assessment_type?: string;
    status?: string;
  }) =>
    fetchApi<{ items: any[]; total: number; page: number; page_size: number }>("/assessments", {
      params,
    }),

  get: (id: string) => fetchApi<any>(`/assessments/${id}`),

  create: (data: any) =>
    fetchApi<any>("/assessments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/assessments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/assessments/${id}`, {
      method: "DELETE",
    }),

  submit: (id: string) =>
    fetchApi<any>(`/assessments/${id}/submit`, {
      method: "POST",
    }),

  getReport: (id: string) => fetchApi<any>(`/assessments/${id}/report`),

  // Responses
  getResponses: (assessmentId: string, domainCode?: string) =>
    fetchApi<any[]>(`/assessments/${assessmentId}/responses`, {
      params: { domain_code: domainCode },
    }),

  saveResponse: (assessmentId: string, data: any) =>
    fetchApi<any>(`/assessments/${assessmentId}/responses`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
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
};

export { ApiError };
