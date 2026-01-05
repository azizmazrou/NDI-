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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "uploaded" | "analyzing" | "analyzed" | "error";
  analysis?: {
    supports_level: "yes" | "partial" | "no";
    confidence_score: number;
  };
  error?: string;
}

interface EvidenceUploaderProps {
  responseId: string;
  onUpload: (file: File) => Promise<{ id: string }>;
  onAnalyze: (evidenceId: string) => Promise<any>;
  existingFiles?: UploadedFile[];
  disabled?: boolean;
}

export function EvidenceUploader({
  responseId,
  onUpload,
  onAnalyze,
  existingFiles = [],
  disabled = false,
}: EvidenceUploaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);

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

  const handleRemove = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
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
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
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

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => handleRemove(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
