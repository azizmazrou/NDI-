"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Loader2,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assessmentsApi, evidenceApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Evidence {
  id: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  analysis_status?: string;
  uploaded_at: string;
  response_id: string;
  ai_analysis?: {
    supports_level: "yes" | "partial" | "no";
    confidence_score: number;
    summary_en?: string;
    summary_ar?: string;
  };
}

export default function EvidenceManagementPage() {
  const locale = useLocale();

  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAssessments();
  }, []);

  async function loadAssessments() {
    try {
      const data = await assessmentsApi.list({});
      setAssessments(data.items || []);
      if (data.items?.length > 0) {
        setSelectedAssessmentId(data.items[0].id);
      }
    } catch (error) {
      console.error("Failed to load assessments:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedAssessmentId) {
      loadResponses(selectedAssessmentId);
    }
  }, [selectedAssessmentId]);

  async function loadResponses(assessmentId: string) {
    try {
      const data = await assessmentsApi.getResponses(assessmentId);
      setResponses(data || []);
    } catch (error) {
      console.error("Failed to load responses:", error);
      setResponses([]);
    }
  }

  async function handleFileUpload(responseId: string, files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await evidenceApi.upload(responseId, file);
      }
      // Reload responses to get updated evidence
      if (selectedAssessmentId) {
        await loadResponses(selectedAssessmentId);
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze(evidenceId: string) {
    try {
      await evidenceApi.analyze(evidenceId);
      if (selectedAssessmentId) {
        await loadResponses(selectedAssessmentId);
      }
    } catch (error) {
      console.error("Failed to analyze evidence:", error);
    }
  }

  async function handleDelete(evidenceId: string) {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من حذف هذا الدليل؟" : "Are you sure you want to delete this evidence?")) {
      return;
    }

    try {
      await evidenceApi.delete(evidenceId);
      if (selectedAssessmentId) {
        await loadResponses(selectedAssessmentId);
      }
    } catch (error) {
      console.error("Failed to delete evidence:", error);
    }
  }

  const getStatusIcon = (status?: string, supports?: string) => {
    if (!status || status === "pending") {
      return <Clock className="h-4 w-4 text-gray-500" />;
    }
    if (status === "analyzing") {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    if (supports === "yes") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (supports === "partial") {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredResponses = responses.filter((response) => {
    if (!searchQuery) return true;
    const questionText = locale === "ar"
      ? response.question?.question_ar
      : response.question?.question_en;
    return (
      questionText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.question?.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          {locale === "ar" ? "إدارة الأدلة" : "Evidence Management"}
        </h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "رفع وإدارة الأدلة والمستندات الداعمة للتقييم"
            : "Upload and manage supporting evidence and documents"}
        </p>
      </div>

      {/* Assessment Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {locale === "ar" ? "اختر التقييم" : "Select Assessment"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
            <SelectTrigger className="w-full sm:w-[400px]">
              <SelectValue placeholder={locale === "ar" ? "اختر تقييماً" : "Select an assessment"} />
            </SelectTrigger>
            <SelectContent>
              {assessments.map((assessment) => (
                <SelectItem key={assessment.id} value={assessment.id}>
                  {assessment.name || (locale === "ar" ? "تقييم" : "Assessment")} - {new Date(assessment.created_at).toLocaleDateString(locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={locale === "ar" ? "بحث في الأسئلة..." : "Search questions..."}
              className="ps-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Evidence List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-2">
            {locale === "ar" ? "جاري التحميل..." : "Loading..."}
          </p>
        </div>
      ) : !selectedAssessmentId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">
              {locale === "ar" ? "اختر تقييماً للبدء" : "Select an assessment to start"}
            </p>
          </CardContent>
        </Card>
      ) : filteredResponses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">
              {locale === "ar" ? "لا توجد إجابات بعد" : "No responses yet"}
            </p>
            <p className="text-muted-foreground">
              {locale === "ar"
                ? "أجب على الأسئلة أولاً ثم ارفع الأدلة"
                : "Answer questions first, then upload evidence"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredResponses.map((response) => (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                      {response.question?.code}
                    </span>
                    <CardTitle className="text-base mt-2">
                      {locale === "ar" ? response.question?.question_ar : response.question?.question_en}
                    </CardTitle>
                    {response.selected_level !== null && (
                      <CardDescription>
                        {locale === "ar" ? "المستوى المختار: " : "Selected Level: "}
                        <span className="font-medium">{response.selected_level}</span>
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Evidence List */}
                {response.evidence && response.evidence.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {response.evidence.map((ev: Evidence) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(ev.analysis_status, ev.ai_analysis?.supports_level)}
                          <div>
                            <p className="font-medium text-sm">{ev.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(ev.file_size)} • {new Date(ev.uploaded_at).toLocaleDateString(locale)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {ev.analysis_status !== "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAnalyze(ev.id)}
                            >
                              <Sparkles className="h-4 w-4 me-1" />
                              {locale === "ar" ? "تحليل" : "Analyze"}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(ev.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    {locale === "ar" ? "لا توجد أدلة مرفوعة" : "No evidence uploaded"}
                  </p>
                )}

                {/* Upload Button */}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id={`upload-${response.id}`}
                    className="hidden"
                    multiple
                    onChange={(e) => handleFileUpload(response.id, e.target.files)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById(`upload-${response.id}`)?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 me-2" />
                    )}
                    {locale === "ar" ? "رفع دليل" : "Upload Evidence"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    PDF, DOC, XLS, PNG, JPG
                  </span>
                </div>

                {/* AI Analysis Result */}
                {response.evidence?.some((ev: Evidence) => ev.ai_analysis) && (
                  <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">
                        {locale === "ar" ? "نتائج التحليل الذكي" : "AI Analysis Results"}
                      </span>
                    </div>
                    {response.evidence
                      .filter((ev: Evidence) => ev.ai_analysis)
                      .map((ev: Evidence) => (
                        <div key={ev.id} className="text-sm">
                          <p className="text-muted-foreground">
                            {locale === "ar"
                              ? ev.ai_analysis?.summary_ar
                              : ev.ai_analysis?.summary_en}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className={cn(
                              "text-xs px-2 py-1 rounded",
                              ev.ai_analysis?.supports_level === "yes"
                                ? "bg-green-100 text-green-700"
                                : ev.ai_analysis?.supports_level === "partial"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            )}>
                              {ev.ai_analysis?.supports_level === "yes"
                                ? locale === "ar" ? "يدعم المستوى" : "Supports Level"
                                : ev.ai_analysis?.supports_level === "partial"
                                ? locale === "ar" ? "دعم جزئي" : "Partial Support"
                                : locale === "ar" ? "لا يدعم" : "Does Not Support"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {locale === "ar" ? "الثقة: " : "Confidence: "}
                              {((ev.ai_analysis?.confidence_score || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
