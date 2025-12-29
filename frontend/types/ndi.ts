/**
 * NDI Type Definitions
 */

// Base types
export interface Organization {
  id: string;
  name_en: string;
  name_ar: string;
  sector?: string;
  description_en?: string;
  description_ar?: string;
  logo_url?: string;
  website?: string;
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
  is_oe_domain: boolean;
  sort_order: number;
}

export interface NDIMaturityLevel {
  id: string;
  question_id: string;
  level: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  acceptance_evidence_en?: string[];
  acceptance_evidence_ar?: string[];
  related_specifications?: string[];
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
export type AssessmentType = "maturity" | "compliance" | "oe";
export type AssessmentStatus = "draft" | "in_progress" | "completed" | "archived";

export interface Assessment {
  id: string;
  organization_id: string;
  assessment_type: AssessmentType;
  status: AssessmentStatus;
  name?: string;
  description?: string;
  target_level?: number;
  current_score?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  organization?: Organization;
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
