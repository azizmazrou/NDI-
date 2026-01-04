"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Save, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MaturityLevelSelector } from "@/components/assessment/MaturityLevelSelector";
import { EvidenceUploader } from "@/components/assessment/EvidenceUploader";
import { ndiApi, assessmentsApi, evidenceApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface MaturityLevel {
  id: string;
  level: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  acceptance_evidence_en: string;
  acceptance_evidence_ar: string;
}

interface Question {
  id: string;
  code: string;
  question_en: string;
  question_ar: string;
  sort_order: number;
  maturity_levels: MaturityLevel[];
}

interface Domain {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  questions: Question[];
}

interface Response {
  id?: string;
  question_id: string;
  selected_level: number | null;
  justification: string;
  notes: string;
}

export default function DomainAssessmentPage({
  params,
}: {
  params: { id: string; code: string; locale: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const ChevronBack = locale === "ar" ? ChevronRight : ChevronLeft;
  const ChevronForward = locale === "ar" ? ChevronLeft : ChevronRight;

  const [domain, setDomain] = useState<Domain | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [params.code, params.id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load domain with questions
      const domainData = await ndiApi.getDomain(params.code);
      setDomain(domainData);

      // Load existing responses
      const existingResponses = await assessmentsApi.getResponses(params.id, params.code);
      const responseMap: Record<string, Response> = {};
      existingResponses.forEach((r: any) => {
        responseMap[r.question_id] = {
          id: r.id,
          question_id: r.question_id,
          selected_level: r.selected_level,
          justification: r.justification || "",
          notes: r.notes || "",
        };
      });
      setResponses(responseMap);
    } catch (err) {
      console.error("Failed to load domain data:", err);
      setError(locale === "ar" ? "فشل تحميل البيانات" : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = domain?.questions[currentQuestionIndex];

  const currentResponse = currentQuestion
    ? responses[currentQuestion.id] || {
        question_id: currentQuestion.id,
        selected_level: null,
        justification: "",
        notes: "",
      }
    : null;

  const handleLevelSelect = (level: number) => {
    if (!currentQuestion) return;
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...currentResponse!,
        selected_level: level,
      },
    }));
  };

  const handleJustificationChange = (value: string) => {
    if (!currentQuestion) return;
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...currentResponse!,
        justification: value,
      },
    }));
  };

  const handleNotesChange = (value: string) => {
    if (!currentQuestion) return;
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...currentResponse!,
        notes: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!currentQuestion || !currentResponse) return;
    setSaving(true);
    try {
      await assessmentsApi.saveResponse(params.id, {
        question_id: currentQuestion.id,
        selected_level: currentResponse.selected_level,
        justification: currentResponse.justification,
        notes: currentResponse.notes,
      });
    } catch (err) {
      console.error("Failed to save response:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await handleSave();
    if (domain && currentQuestionIndex < domain.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = async () => {
    await handleSave();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleUpload = async (file: File) => {
    if (!currentResponse?.id) {
      // Save the response first to get an ID
      await handleSave();
    }
    // Then upload the file
    return await evidenceApi.upload(currentResponse?.id || "", file);
  };

  const handleAnalyze = async (evidenceId: string) => {
    return await evidenceApi.analyze(evidenceId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !domain) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">{error || "Domain not found"}</p>
        <Link href={`/${locale}/dashboard/assessments/${params.id}`}>
          <Button variant="outline">
            <ChevronBack className="me-2 h-4 w-4" />
            {locale === "ar" ? "العودة للتقييم" : "Back to Assessment"}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href={`/${locale}/dashboard/assessments`}
              className="hover:text-foreground"
            >
              {t("assessment.assessments")}
            </Link>
            <span>/</span>
            <Link
              href={`/${locale}/dashboard/assessments/${params.id}`}
              className="hover:text-foreground"
            >
              {t("assessment.title")}
            </Link>
            <span>/</span>
            <span>{locale === "ar" ? domain.name_ar : domain.name_en}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
              {domain.code}
            </span>
            <h1 className="text-2xl font-bold tracking-tight">
              {locale === "ar" ? domain.name_ar : domain.name_en}
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {locale === "ar" ? domain.description_ar : domain.description_en}
          </p>
        </div>

        <Link href={`/${locale}/dashboard/assessments/${params.id}`}>
          <Button variant="outline">
            <ChevronBack className="me-2 h-4 w-4" />
            {locale === "ar" ? "العودة للتقييم" : "Back to Assessment"}
          </Button>
        </Link>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {domain.questions.map((q, idx) => {
          const hasResponse = responses[q.id]?.selected_level !== null && responses[q.id]?.selected_level !== undefined;
          return (
            <button
              key={q.id}
              onClick={async () => {
                await handleSave();
                setCurrentQuestionIndex(idx);
              }}
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                idx === currentQuestionIndex
                  ? "bg-primary text-primary-foreground"
                  : hasResponse
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Question and Level Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                    {currentQuestion.code}
                  </span>
                  <span className="text-lg">
                    {locale === "ar" ? "السؤال" : "Question"} {currentQuestionIndex + 1} / {domain.questions.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium mb-6">
                  {locale === "ar" ? currentQuestion.question_ar : currentQuestion.question_en}
                </p>

                <div className="space-y-2">
                  <Label>{t("assessment.selectLevel")}</Label>
                  <MaturityLevelSelector
                    levels={currentQuestion.maturity_levels.map((ml) => ({
                      level: ml.level,
                      name_en: ml.name_en,
                      name_ar: ml.name_ar,
                      description_en: ml.description_en,
                      description_ar: ml.description_ar,
                      acceptance_evidence_en: ml.acceptance_evidence_en ? [ml.acceptance_evidence_en] : [],
                      acceptance_evidence_ar: ml.acceptance_evidence_ar ? [ml.acceptance_evidence_ar] : [],
                    }))}
                    selectedLevel={currentResponse?.selected_level ?? null}
                    onSelect={handleLevelSelect}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Justification */}
            <Card>
              <CardHeader>
                <CardTitle>{t("assessment.justification")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={locale === "ar" ? "أدخل المبرر..." : "Enter justification..."}
                  value={currentResponse?.justification || ""}
                  onChange={(e) => handleJustificationChange(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{t("assessment.notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={locale === "ar" ? "ملاحظات إضافية..." : "Additional notes..."}
                  value={currentResponse?.notes || ""}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Evidence Upload */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("assessment.uploadEvidence")}</CardTitle>
              </CardHeader>
              <CardContent>
                <EvidenceUploader
                  responseId={currentResponse?.id || "temp"}
                  onUpload={handleUpload}
                  onAnalyze={handleAnalyze}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || saving}
        >
          <ChevronBack className="me-2 h-4 w-4" />
          {t("common.previous")}
        </Button>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="me-2 h-4 w-4" />
          )}
          {t("common.save")}
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentQuestionIndex === domain.questions.length - 1 || saving}
        >
          {t("common.next")}
          <ChevronForward className="ms-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
