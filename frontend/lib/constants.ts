/**
 * Application constants
 */

export const APP_NAME = "NDI Compliance System";
export const APP_NAME_AR = "نظام الامتثال لمؤشر البيانات الوطني";

export const SUPPORTED_LOCALES = ["en", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";

export const ASSESSMENT_TYPES = [
  { value: "maturity", label_en: "Maturity Assessment", label_ar: "تقييم النضج" },
  { value: "compliance", label_en: "Compliance Assessment", label_ar: "تقييم الامتثال" },
  { value: "oe", label_en: "Operational Excellence", label_ar: "التميز التشغيلي" },
] as const;

export const ASSESSMENT_STATUSES = [
  { value: "draft", label_en: "Draft", label_ar: "مسودة" },
  { value: "in_progress", label_en: "In Progress", label_ar: "قيد التنفيذ" },
  { value: "completed", label_en: "Completed", label_ar: "مكتمل" },
  { value: "archived", label_en: "Archived", label_ar: "مؤرشف" },
] as const;

export const MATURITY_LEVELS = [
  {
    level: 0,
    name_en: "Absence of Capabilities",
    name_ar: "غياب القدرات",
    score_min: 0,
    score_max: 0.24,
    color: "gray",
  },
  {
    level: 1,
    name_en: "Establishing",
    name_ar: "التأسيس",
    score_min: 0.25,
    score_max: 1.24,
    color: "red",
  },
  {
    level: 2,
    name_en: "Defined",
    name_ar: "التحديد",
    score_min: 1.25,
    score_max: 2.49,
    color: "orange",
  },
  {
    level: 3,
    name_en: "Activated",
    name_ar: "التفعيل",
    score_min: 2.5,
    score_max: 3.99,
    color: "yellow",
  },
  {
    level: 4,
    name_en: "Managed",
    name_ar: "الإدارة",
    score_min: 4,
    score_max: 4.74,
    color: "green",
  },
  {
    level: 5,
    name_en: "Pioneer",
    name_ar: "الريادة",
    score_min: 4.75,
    score_max: 5,
    color: "emerald",
  },
] as const;

export const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "text/plain": [".txt"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const DOMAIN_CODES = [
  "DG",
  "MCM",
  "DQ",
  "DO",
  "DCM",
  "DAM",
  "DSI",
  "RMD",
  "BIA",
  "DVR",
  "OD",
  "FOI",
  "DC",
  "PDP",
] as const;

export const PRIORITY_COLORS = {
  high: "destructive",
  medium: "warning",
  low: "success",
} as const;

export const EFFORT_COLORS = {
  high: "destructive",
  medium: "warning",
  low: "success",
} as const;
