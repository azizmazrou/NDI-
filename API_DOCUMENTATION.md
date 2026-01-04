# NDI Compliance System API Documentation

**Version:** 1.0.0
**Base URL:** `/api/v1`
**OpenAPI Docs:** `/api/docs`
**ReDoc:** `/api/redoc`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Dashboard Endpoints](#dashboard-endpoints)
4. [NDI Data Endpoints](#ndi-data-endpoints)
5. [Assessment Endpoints](#assessment-endpoints)
6. [Task Endpoints](#task-endpoints)
7. [Score Endpoints](#score-endpoints)
8. [Report Endpoints](#report-endpoints)
9. [Evidence Endpoints](#evidence-endpoints)
10. [AI Endpoints](#ai-endpoints)
11. [Settings Endpoints](#settings-endpoints)
12. [Error Handling](#error-handling)

---

## Overview

The NDI Compliance System API provides endpoints for managing National Data Index (NDI) compliance assessments. The system supports:

- **14 NDI Domains** with 42 questions
- **6 Maturity Levels** (0-5): Absence, Establishing, Defined, Activated, Managed, Pioneer
- **Bilingual Support** (Arabic/English)
- **AI-powered** evidence analysis and recommendations
- **Real-time** score calculations

### Common Response Formats

All list endpoints return paginated responses:
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

---

## Authentication

> **Note:** Authentication is not yet implemented. All endpoints are currently open.

---

## Dashboard Endpoints

**Prefix:** `/api/v1/dashboard`

### GET /stats
Get dashboard statistics.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `assessment_id` | UUID (optional) | Specific assessment to get stats for |
| `language` | string (optional) | Response language (ar/en) |

**Response:**
```json
{
  "total_assessments": 5,
  "active_assessments": 2,
  "completed_assessments": 3,
  "average_maturity_score": 3.2,
  "average_compliance_score": 75.5,
  "total_tasks": 15,
  "pending_tasks": 5,
  "overdue_tasks": 2,
  "domain_progress": [...]
}
```

### GET /overview
Get system overview counts.

**Response:**
```json
{
  "assessments": {
    "total": 10,
    "completed": 5,
    "in_progress": 3,
    "draft": 2
  },
  "tasks": {
    "total": 50,
    "pending": 20,
    "completed": 30
  },
  "evidence": {
    "total": 100
  },
  "ndi": {
    "domains": 14,
    "questions": 42
  }
}
```

### GET /recent-activity
Get recent system activity.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Number of activities (1-50) |

**Response:**
```json
[
  {
    "type": "assessment",
    "action": "updated",
    "id": "uuid",
    "name": "Assessment Name",
    "status": "in_progress",
    "timestamp": "2024-01-15T10:30:00Z"
  }
]
```

### GET /domain-summary
Get summary by domain.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `assessment_id` | UUID (optional) | Specific assessment |

---

## NDI Data Endpoints

**Prefix:** `/api/v1/ndi`

### GET /domains
List all NDI domains.

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "code": "DG",
      "name_en": "Data Governance",
      "name_ar": "حوكمة البيانات",
      "description_en": "...",
      "description_ar": "...",
      "question_count": 3,
      "icon": "shield",
      "color": "#1E40AF",
      "sort_order": 1
    }
  ],
  "total": 14
}
```

### GET /domains/{code}
Get domain with questions and specifications.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | string | Domain code (e.g., DG, DQ, DS) |

**Response:** Domain object with nested `questions` and `specifications` arrays.

### GET /domains/{code}/questions
Get all questions for a domain with maturity levels.

**Response:**
```json
[
  {
    "id": "uuid",
    "domain_id": "uuid",
    "code": "DG-1",
    "question_en": "Question text in English",
    "question_ar": "نص السؤال بالعربية",
    "sort_order": 1,
    "maturity_levels": [
      {
        "id": "uuid",
        "level": 0,
        "name_en": "Absence of Capabilities",
        "name_ar": "غياب القدرات",
        "description_en": "...",
        "description_ar": "..."
      }
    ]
  }
]
```

### GET /questions/{code}
Get a specific question with maturity levels.

### GET /questions/{code}/levels
Get maturity levels for a question.

### GET /specifications
List all specifications.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `domain_code` | string (optional) | Filter by domain |
| `maturity_level` | integer (optional) | Filter by level (1-5) |

### GET /specifications/{code}
Get a specific specification.

---

## Assessment Endpoints

**Prefix:** `/api/v1/assessments`

### GET /
List assessments with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `page_size` | integer | 20 | Items per page (1-100) |
| `assessment_type` | string | - | Filter by type |
| `status` | string | - | Filter by status |

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "assessment_type": "self",
      "status": "in_progress",
      "name": "Q1 2024 Assessment",
      "description": "...",
      "target_level": 3,
      "current_score": 2.5,
      "maturity_score": 2.5,
      "compliance_score": 65.0,
      "created_by": "uuid",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "completed_at": null,
      "responses_count": 20,
      "progress_percentage": 47.6
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20
}
```

### POST /
Create a new assessment.

**Request Body:**
```json
{
  "name": "Q1 2024 Assessment",
  "description": "Annual compliance assessment",
  "assessment_type": "self",
  "target_level": 3
}
```

### GET /{assessment_id}
Get assessment by ID.

### PUT /{assessment_id}
Update an assessment.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "in_progress",
  "target_level": 4
}
```

### DELETE /{assessment_id}
Delete an assessment.

**Response:** `204 No Content`

### POST /{assessment_id}/submit
Submit an assessment for completion. Calculates final scores.

### GET /{assessment_id}/responses
Get all responses for an assessment.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `domain_code` | string (optional) | Filter by domain |

**Response:**
```json
[
  {
    "id": "uuid",
    "assessment_id": "uuid",
    "question_id": "uuid",
    "selected_level": 3,
    "justification": "...",
    "notes": "...",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "question": {...},
    "evidence": [...]
  }
]
```

### POST /{assessment_id}/responses
Create or update an assessment response.

**Request Body:**
```json
{
  "question_id": "uuid",
  "selected_level": 3,
  "justification": "Evidence-based justification",
  "notes": "Additional notes"
}
```

### GET /{assessment_id}/report
Generate assessment report.

---

## Task Endpoints

**Prefix:** `/api/v1/tasks`

### GET /
List tasks with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `page_size` | integer | Items per page |
| `status` | string | Filter: pending, in_progress, completed, overdue |
| `priority` | string | Filter: low, medium, high, critical |
| `assigned_to` | UUID | Filter by assignee |
| `assigned_by` | UUID | Filter by assigner |
| `assessment_id` | UUID | Filter by assessment |

### GET /my-tasks
Get tasks assigned to a user.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | UUID | Yes | User ID |
| `status` | string | No | Filter by status |

### GET /assigned-by-me
Get tasks assigned by a user.

### GET /stats
Get task statistics.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | UUID (optional) | Filter by user |
| `assessment_id` | UUID (optional) | Filter by assessment |

**Response:**
```json
{
  "total": 50,
  "pending": 20,
  "in_progress": 10,
  "completed": 18,
  "overdue": 2
}
```

### POST /
Create a new task.

**Request Body:**
```json
{
  "assessment_id": "uuid",
  "question_id": "uuid",
  "assigned_to": "uuid",
  "title_en": "Collect evidence for DG-1",
  "title_ar": "جمع الأدلة لـ DG-1",
  "description_en": "...",
  "description_ar": "...",
  "priority": "high",
  "due_date": "2024-02-15"
}
```

### GET /{task_id}
Get task by ID.

### PUT /{task_id}
Update a task.

### PATCH /{task_id}/status
Update task status only.

**Request Body:**
```json
{
  "status": "completed"
}
```

### DELETE /{task_id}
Delete a task.

---

## Score Endpoints

**Prefix:** `/api/v1/scores`

### GET /assessments/{assessment_id}/maturity-score
Calculate maturity score for an assessment.

**Response:**
```json
{
  "overall_score": 3.2,
  "overall_level": 3,
  "overall_level_name_en": "Activated",
  "overall_level_name_ar": "التفعيل",
  "domain_scores": [
    {
      "domain_code": "DG",
      "domain_name_en": "Data Governance",
      "domain_name_ar": "حوكمة البيانات",
      "score": 3.5,
      "level": 3,
      "level_name_en": "Activated",
      "level_name_ar": "التفعيل",
      "answered_count": 3,
      "total_questions": 3
    }
  ]
}
```

### GET /assessments/{assessment_id}/compliance-score
Calculate compliance score for an assessment.

**Response:**
```json
{
  "compliance_percentage": 75.5,
  "is_compliant": false,
  "target_level": 3,
  "domains_meeting_target": 8,
  "total_domains": 14,
  "gap_domains": [
    {
      "domain_code": "DQ",
      "current_level": 2,
      "target_level": 3,
      "gap": 1
    }
  ]
}
```

### GET /assessments/{assessment_id}/combined
Get combined maturity and compliance assessment.

### POST /assessments/{assessment_id}/recalculate
Recalculate and update assessment scores.

---

## Report Endpoints

**Prefix:** `/api/v1/reports`

### GET /assessments/{assessment_id}/report
Generate assessment report in specified format.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | json | Output format: json, pdf, excel |
| `language` | string | ar | Report language: ar, en |

**Response (format=json):**
Full assessment report with maturity, compliance, and response details.

**Response (format=excel):**
Excel file download with multiple sheets:
- Summary
- Domain Scores
- Responses

### GET /assessments/{assessment_id}/export
Export assessment data for backup or transfer.

**Response:** JSON file download

### GET /summary
Get summary of all completed assessments.

---

## Evidence Endpoints

**Prefix:** `/api/v1/evidence`

### POST /upload
Upload evidence file.

**Request Body:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `response_id` | UUID | Yes | Assessment response ID |
| `file` | file | Yes | Evidence file |

**Allowed File Types:**
- Documents: `.pdf`, `.docx`, `.doc`, `.txt`
- Spreadsheets: `.xlsx`, `.xls`
- Presentations: `.pptx`, `.ppt`
- Images: `.png`, `.jpg`, `.jpeg`

**Response:**
```json
{
  "id": "uuid",
  "response_id": "uuid",
  "file_name": "evidence.pdf",
  "file_path": "/uploads/...",
  "file_type": "pdf",
  "file_size": 1024000,
  "mime_type": "application/pdf",
  "analysis_status": "pending",
  "extracted_text": null,
  "ai_analysis": null,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### GET /{evidence_id}
Get evidence by ID.

### DELETE /{evidence_id}
Delete evidence file.

### POST /{evidence_id}/analyze
Analyze evidence using AI.

**Response:**
```json
{
  "supports_level": 3,
  "covered_criteria": ["Criterion 1", "Criterion 2"],
  "missing_criteria": ["Criterion 3"],
  "confidence_score": 0.85,
  "recommendations": ["Add more details about..."],
  "summary": "This evidence demonstrates..."
}
```

---

## AI Endpoints

**Prefix:** `/api/v1/ai`

### POST /analyze-evidence
Analyze evidence document against NDI criteria.

**Request Body:**
```json
{
  "evidence_id": "uuid",
  "question_code": "DG-1",
  "selected_level": 3,
  "language": "ar"
}
```

**Response:**
```json
{
  "evidence_id": "uuid",
  "supports_level": 3,
  "covered_criteria": [...],
  "missing_criteria": [...],
  "confidence_score": 0.85,
  "recommendations": [...],
  "summary": "..."
}
```

### POST /gap-analysis
Perform gap analysis on an assessment.

**Request Body:**
```json
{
  "assessment_id": "uuid",
  "target_level": 4,
  "domain_code": "DG",
  "language": "ar"
}
```

### POST /recommendations
Get AI-generated recommendations for improvement.

**Request Body:**
```json
{
  "assessment_id": "uuid",
  "focus_areas": ["DG", "DQ"],
  "language": "ar"
}
```

### POST /chat
Chat with AI about NDI topics using RAG.

**Request Body:**
```json
{
  "messages": [
    {"role": "user", "content": "What is Data Governance?"}
  ],
  "context": {
    "assessment_id": "uuid"
  },
  "language": "ar"
}
```

**Response:**
```json
{
  "response": "Data Governance is...",
  "sources": [...],
  "suggested_questions": [...]
}
```

### POST /evidence/analyze-response
Analyze evidence for a specific response.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `response_id` | UUID | - | Response ID |
| `language` | string | ar | Language |

### POST /evidence/suggest-structure
Suggest evidence structure for a question.

**Request Body:**
```json
{
  "question_code": "DG-1",
  "target_level": 3,
  "language": "ar"
}
```

### POST /evidence/quick-check
Quick check if content supports a maturity level.

**Request Body:**
```json
{
  "content": "Evidence content text...",
  "question_code": "DG-1",
  "target_level": 3
}
```

---

## Settings Endpoints

**Prefix:** `/api/v1/settings/settings`

### GET /
Get all settings for the settings page.

**Response:**
```json
{
  "ai_providers": [...],
  "settings": [...]
}
```

### GET /ai-providers
Get all AI providers configuration.

**Response:**
```json
{
  "providers": [
    {
      "id": "openai",
      "name_en": "OpenAI",
      "name_ar": "OpenAI",
      "api_endpoint": null,
      "model_name": "gpt-4",
      "is_enabled": true,
      "is_default": true,
      "has_api_key": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /ai-providers/{provider_id}
Get a specific AI provider configuration.

### PUT /ai-providers/{provider_id}
Update AI provider configuration.

**Request Body:**
```json
{
  "api_key": "sk-...",
  "model_name": "gpt-4-turbo",
  "is_enabled": true,
  "is_default": true
}
```

### POST /ai-providers/{provider_id}/test
Test AI provider connection.

**Request Body:**
```json
{
  "api_key": "sk-..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection successful",
  "provider_id": "openai"
}
```

---

## Error Handling

### Error Response Format

```json
{
  "detail": "Error message description"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `204` | No Content (successful deletion) |
| `400` | Bad Request - Invalid input |
| `404` | Not Found - Resource doesn't exist |
| `422` | Validation Error - Invalid request body |
| `500` | Internal Server Error |
| `501` | Not Implemented (e.g., PDF export) |

### Validation Error Response

```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Appendix: NDI Domains

| Code | Name (EN) | Name (AR) | Questions |
|------|-----------|-----------|-----------|
| DG | Data Governance | حوكمة البيانات | 3 |
| DQ | Data Quality | جودة البيانات | 3 |
| DS | Data Security | أمن البيانات | 3 |
| DP | Data Privacy | خصوصية البيانات | 3 |
| DM | Data Management | إدارة البيانات | 3 |
| DA | Data Analytics | تحليلات البيانات | 3 |
| DI | Data Integration | تكامل البيانات | 3 |
| DC | Data Culture | ثقافة البيانات | 3 |
| DT | Data Technology | تقنية البيانات | 3 |
| DO | Data Operations | عمليات البيانات | 3 |
| DR | Data Risk | مخاطر البيانات | 3 |
| DV | Data Value | قيمة البيانات | 3 |
| DE | Data Ethics | أخلاقيات البيانات | 3 |
| DL | Data Literacy | الإلمام بالبيانات | 3 |

## Appendix: Maturity Levels

| Level | Name (EN) | Name (AR) | Score Range |
|-------|-----------|-----------|-------------|
| 0 | Absence of Capabilities | غياب القدرات | < 0.25 |
| 1 | Establishing | التأسيس | 0.25 - 1.25 |
| 2 | Defined | التحديد | 1.25 - 2.5 |
| 3 | Activated | التفعيل | 2.5 - 4.0 |
| 4 | Managed | الإدارة | 4.0 - 4.75 |
| 5 | Pioneer | الريادة | >= 4.75 |
