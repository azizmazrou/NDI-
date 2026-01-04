/**
 * NDI Type Definitions
 */

// Organization Settings (single organization)
export interface OrganizationSettings {
  id: number;
  name_en: string;
  name_ar: string;
  sector?: string;
  description_en?: string;
  description_ar?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface NDIDomain {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  question_count?: number;
  icon?: string;
  color?: string;
  sort_order: number;
  questions?: NDIQuestion[];
}

export interface NDIAcceptanceEvidence {
  id: string;
  maturity_level_id: string;
  evidence_id: number;
  text_en: string;
  text_ar: string;
  inherits_from_level?: number;  // If set, this evidence inherits from a lower level
  specification_code?: string;   // e.g., DG.1.1 - links to compliance requirements
  sort_order?: number;
}

export interface NDIMaturityLevel {
  id: string;
  question_id: string;
  level: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  acceptance_evidence?: NDIAcceptanceEvidence[];
}

export interface NDIQuestion {
  id: string;
  domain_id: string;
  code: string;
  question_en: string;
  question_ar: string;
  sort_order: number;
  maturity_levels?: NDIMaturityLevel[];
  domain?: NDIDomain;
}

export interface NDISpecification {
  id: string;
  domain_id: string;
  code: string;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  maturity_level?: number;
  sort_order: number;
}

// Assessment types
export type AssessmentType = "maturity" | "compliance";
export type AssessmentStatus = "draft" | "in_progress" | "completed" | "archived";

export interface Assessment {
  id: string;
  assessment_type: AssessmentType;
  status: AssessmentStatus;
  name?: string;
  description?: string;
  target_level?: number;
  current_score?: number;
  maturity_score?: number;
  compliance_score?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  responses_count: number;
  progress_percentage: number;
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  question_id: string;
  selected_level?: number;
  justification?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  question?: NDIQuestion;
  evidence?: EvidenceSummary[];
}

export interface EvidenceSummary {
  id: string;
  file_name: string;
  file_type?: string;
  analysis_status?: string;
  supports_level?: string;
}

export interface Evidence {
  id: string;
  response_id: string;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  mime_type?: string;
  extracted_text?: string;
  ai_analysis?: EvidenceAnalysis;
  analysis_status?: string;
  uploaded_at: string;
  analyzed_at?: string;
}

export interface EvidenceAnalysis {
  supports_level: "yes" | "partial" | "no";
  covered_criteria: string[];
  missing_criteria: string[];
  confidence_score: number;
  recommendations: string[];
  summary_ar?: string;
  summary_en?: string;
}

// Task types
export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  assessment_id: string;
  question_id?: string;
  domain_code?: string;
  assigned_to: string;
  assigned_by: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  assignee?: User;
  assigner?: User;
  assessment?: Assessment;
  question?: NDIQuestion;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  department?: string;
  job_title?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

// Score types
export interface DomainScoreDetail {
  domain_code: string;
  domain_name: string;
  score: number;
  level: number;
  level_name: string;
  questions_answered: number;
  total_questions: number;
}

export interface MaturityScoreResult {
  assessment_id: string;
  overall_score: number;
  overall_level: number;
  overall_level_name: string;
  domain_scores: DomainScoreDetail[];
  calculated_at: string;
}

export interface ComplianceScoreResult {
  assessment_id: string;
  overall_compliance: number;
  domain_compliance: {
    domain_code: string;
    domain_name: string;
    compliance_percentage: number;
    specifications_met: number;
    total_specifications: number;
  }[];
  calculated_at: string;
}

// Report types
export interface DomainScore {
  domain: NDIDomain;
  average_score: number;
  questions_answered: number;
  total_questions: number;
  level_name_en: string;
  level_name_ar: string;
}

export interface AssessmentReport {
  assessment: Assessment;
  overall_score: number;
  overall_level: number;
  overall_level_name_en: string;
  overall_level_name_ar: string;
  domain_scores: DomainScore[];
  responses: AssessmentResponse[];
  gaps: GapItem[];
  recommendations: Recommendation[];
  generated_at: string;
}

export interface GapItem {
  domain_code: string;
  domain_name: string;
  question_code: string;
  question: string;
  current_level: number;
  target_level: number;
  gap: number;
  actions_required: string[];
  priority: "high" | "medium" | "low";
}

export interface Recommendation {
  id: string;
  domain_code: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  prerequisites: string[];
  expected_outcome: string;
}

// Dashboard types
export interface DashboardStats {
  total_assessments: number;
  active_assessments: number;
  completed_assessments: number;
  average_maturity_score: number;
  average_compliance_score: number;
  total_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  domain_progress: {
    domain_code: string;
    domain_name: string;
    completion_percentage: number;
    average_score: number;
  }[];
}

// API response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// Maturity level info
export const MATURITY_LEVELS = [
  { level: 0, name_en: "Absence of Capabilities", name_ar: "غياب القدرات", color: "gray" },
  { level: 1, name_en: "Establishing", name_ar: "التأسيس", color: "red" },
  { level: 2, name_en: "Defined", name_ar: "التحديد", color: "orange" },
  { level: 3, name_en: "Activated", name_ar: "التفعيل", color: "yellow" },
  { level: 4, name_en: "Managed", name_ar: "الإدارة", color: "green" },
  { level: 5, name_en: "Pioneer", name_ar: "الريادة", color: "emerald" },
] as const;

export function getLevelInfo(level: number) {
  return MATURITY_LEVELS.find((l) => l.level === level) || MATURITY_LEVELS[0];
}

export function scoreToLevel(score: number): number {
  if (score < 0.25) return 0;
  if (score < 1.25) return 1;
  if (score < 2.5) return 2;
  if (score < 4.0) return 3;
  if (score < 4.75) return 4;
  return 5;
}

export function getLevelColor(level: number): string {
  const colors: Record<number, string> = {
    0: "bg-gray-500",
    1: "bg-red-500",
    2: "bg-orange-500",
    3: "bg-yellow-500",
    4: "bg-green-500",
    5: "bg-emerald-500",
  };
  return colors[level] || colors[0];
}

export function getTaskStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    pending: "bg-gray-500",
    in_progress: "bg-blue-500",
    completed: "bg-green-500",
    overdue: "bg-red-500",
  };
  return colors[status];
}

export function getTaskPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    low: "bg-gray-400",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-600",
  };
  return colors[priority];
}
