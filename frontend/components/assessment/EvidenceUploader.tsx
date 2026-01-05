"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslations, useLocale } from "next-intl";
import {
  Upload,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  FileText,
  Lightbulb,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { aiApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "uploaded" | "analyzing" | "analyzed" | "error";
  analysis?: {
    supports_level: "yes" | "partial" | "no";
    confidence_score: number;
    covered_criteria?: string[];
    missing_criteria?: string[];
    recommendations?: string[];
    summary_ar?: string;
    summary_en?: string;
  };
  error?: string;
}

interface EvidenceStructure {
  title: string;
  sections: {
    heading: string;
    description: string;
    tips: string[];
  }[];
  general_tips: string[];
  common_mistakes: string[];
}

interface EvidenceUploaderProps {
  responseId: string;
  questionCode?: string;
  targetLevel?: number;
  onUpload: (file: File) => Promise<{ id: string }>;
  onAnalyze: (evidenceId: string) => Promise<any>;
  onDelete?: (evidenceId: string) => Promise<void>;
  existingFiles?: UploadedFile[];
  disabled?: boolean;
}

export function EvidenceUploader({
  responseId,
  questionCode,
  targetLevel,
  onUpload,
  onAnalyze,
  onDelete,
  existingFiles = [],
  disabled = false,
}: EvidenceUploaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
  const [structureDialogOpen, setStructureDialogOpen] = useState(false);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [evidenceStructure, setEvidenceStructure] = useState<EvidenceStructure | null>(null);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const tempId = `temp-${Date.now()}`;

        // Add file to list with uploading status
        setFiles((prev) => [
          ...prev,
          {
            id: tempId,
            name: file.name,
            size: file.size,
            type: file.type,
            status: "uploading",
          },
        ]);

        try {
          // Upload file
          const result = await onUpload(file);

          // Update with real ID and status
          setFiles((prev) =>
            prev.map((f) =>
              f.id === tempId
                ? { ...f, id: result.id, status: "uploaded" }
                : f
            )
          );
        } catch (error) {
          // Handle error
          setFiles((prev) =>
            prev.map((f) =>
              f.id === tempId
                ? { ...f, status: "error", error: "Upload failed" }
                : f
            )
          );
        }
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled,
  });

  const handleAnalyze = async (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: "analyzing" } : f))
    );

    try {
      const analysis = await onAnalyze(fileId);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "analyzed", analysis } : f
        )
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: "error", error: "Analysis failed" }
            : f
        )
      );
    }
  };

  const handleRemove = async (fileId: string) => {
    if (onDelete) {
      try {
        await onDelete(fileId);
      } catch (error) {
        console.error("Failed to delete:", error);
      }
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSuggestStructure = async () => {
    if (!questionCode || targetLevel === undefined) {
      setStructureError(locale === "ar"
        ? "يجب اختيار المستوى أولاً"
        : "Please select a maturity level first");
      return;
    }

    setLoadingStructure(true);
    setStructureError(null);
    setEvidenceStructure(null);

    try {
      const result = await aiApi.suggestEvidenceStructure({
        question_code: questionCode,
        target_level: targetLevel,
        language: locale,
      });

      if (result.status === "success" && result.suggestion) {
        setEvidenceStructure(result.suggestion);
      } else {
        setStructureError(result.message || (locale === "ar"
          ? "فشل في الحصول على اقتراحات"
          : "Failed to get suggestions"));
      }
    } catch (error: any) {
      setStructureError(error.message || (locale === "ar"
        ? "فشل في الاتصال بالخدمة"
        : "Failed to connect to service"));
    } finally {
      setLoadingStructure(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Suggest Structure Button */}
        {questionCode && targetLevel !== undefined && (
          <Dialog open={structureDialogOpen} onOpenChange={setStructureDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStructureDialogOpen(true);
                  if (!evidenceStructure) {
                    handleSuggestStructure();
                  }
                }}
                disabled={disabled}
              >
                <Lightbulb className="h-4 w-4 me-2" />
                {locale === "ar" ? "اقتراح هيكل الدليل" : "Suggest Evidence Structure"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {locale === "ar" ? "هيكل الدليل المقترح" : "Suggested Evidence Structure"}
                </DialogTitle>
                <DialogDescription>
                  {locale === "ar"
                    ? "اقتراحات لهيكل المستند المطلوب لهذا المستوى"
                    : "Suggestions for the required document structure for this level"}
                </DialogDescription>
              </DialogHeader>

              {loadingStructure && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ms-2">{locale === "ar" ? "جاري التحليل..." : "Analyzing..."}</span>
                </div>
              )}

              {structureError && (
                <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                  <AlertCircle className="h-5 w-5 inline me-2" />
                  {structureError}
                </div>
              )}

              {evidenceStructure && (
                <div className="space-y-6">
                  {/* Title */}
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg">
                      {evidenceStructure.title}
                    </h3>
                  </div>

                  {/* Sections */}
                  <div className="space-y-4">
                    <h4 className="font-medium">
                      {locale === "ar" ? "الأقسام الرئيسية" : "Main Sections"}
                    </h4>
                    {evidenceStructure.sections?.map((section, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <h5 className="font-medium text-primary">{section.heading}</h5>
                        <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                        {section.tips?.length > 0 && (
                          <ul className="mt-2 text-sm space-y-1">
                            {section.tips.map((tip, tidx) => (
                              <li key={tidx} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* General Tips */}
                  {evidenceStructure.general_tips?.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">
                        {locale === "ar" ? "نصائح عامة" : "General Tips"}
                      </h4>
                      <ul className="text-sm space-y-1 text-green-700">
                        {evidenceStructure.general_tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Common Mistakes */}
                  {evidenceStructure.common_mistakes?.length > 0 && (
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <h4 className="font-medium text-amber-800 mb-2">
                        {locale === "ar" ? "أخطاء شائعة يجب تجنبها" : "Common Mistakes to Avoid"}
                      </h4>
                      <ul className="text-sm space-y-1 text-amber-700">
                        {evidenceStructure.common_mistakes.map((mistake, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          disabled
            ? "cursor-not-allowed opacity-50 border-muted"
            : "cursor-pointer",
          !disabled && isDragActive
            ? "border-primary bg-primary/5"
            : !disabled && "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">{t("evidence.dragDrop")}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t("evidence.supportedFormats")}
        </p>
        <p className="text-xs text-muted-foreground">{t("evidence.maxSize")}</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="border rounded-lg overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3 bg-muted/50">
                <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>

                    {file.status === "uploading" && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {locale === "ar" ? "جاري الرفع..." : "Uploading..."}
                      </span>
                    )}

                    {file.status === "uploaded" && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        {locale === "ar" ? "تم الرفع" : "Uploaded"}
                      </span>
                    )}

                    {file.status === "analyzing" && (
                      <span className="flex items-center gap-1 text-purple-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t("evidence.analyzing")}
                      </span>
                    )}

                    {file.status === "analyzed" && file.analysis && (
                      <span
                        className={cn(
                          "flex items-center gap-1",
                          file.analysis.supports_level === "yes"
                            ? "text-green-600"
                            : file.analysis.supports_level === "partial"
                            ? "text-yellow-600"
                            : "text-red-600"
                        )}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {file.analysis.supports_level === "yes"
                          ? t("evidence.supportsLevel")
                          : file.analysis.supports_level === "partial"
                          ? t("evidence.partiallySupports")
                          : t("evidence.doesNotSupport")}
                        {file.analysis.confidence_score !== undefined && (
                          <span className="ms-1">
                            ({Math.round(file.analysis.confidence_score * 100)}%)
                          </span>
                        )}
                      </span>
                    )}

                    {file.status === "error" && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        {file.error}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {file.status === "uploaded" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAnalyze(file.id)}
                    >
                      <Sparkles className="h-4 w-4 me-1" />
                      {t("assessment.analyzeEvidence")}
                    </Button>
                  )}

                  {file.status === "analyzed" && file.analysis && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedAnalysis(
                        expandedAnalysis === file.id ? null : file.id
                      )}
                    >
                      {expandedAnalysis === file.id
                        ? (locale === "ar" ? "إخفاء التفاصيل" : "Hide Details")
                        : (locale === "ar" ? "عرض التفاصيل" : "Show Details")}
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Analysis Details */}
              {expandedAnalysis === file.id && file.analysis && (
                <div className="p-4 bg-muted/20 border-t space-y-3">
                  {/* Summary */}
                  {(file.analysis.summary_ar || file.analysis.summary_en) && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">
                        {locale === "ar" ? "الملخص" : "Summary"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {locale === "ar" ? file.analysis.summary_ar : file.analysis.summary_en}
                      </p>
                    </div>
                  )}

                  {/* Covered Criteria */}
                  {file.analysis.covered_criteria && file.analysis.covered_criteria.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-1">
                        {locale === "ar" ? "المعايير المغطاة" : "Covered Criteria"}
                      </h4>
                      <ul className="text-sm space-y-1">
                        {file.analysis.covered_criteria.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing Criteria */}
                  {file.analysis.missing_criteria && file.analysis.missing_criteria.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-amber-700 mb-1">
                        {locale === "ar" ? "المعايير المفقودة" : "Missing Criteria"}
                      </h4>
                      <ul className="text-sm space-y-1">
                        {file.analysis.missing_criteria.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {file.analysis.recommendations && file.analysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-700 mb-1">
                        {locale === "ar" ? "التوصيات" : "Recommendations"}
                      </h4>
                      <ul className="text-sm space-y-1">
                        {file.analysis.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
