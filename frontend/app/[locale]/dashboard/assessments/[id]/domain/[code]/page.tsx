"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageLoading } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { MaturityLevelSelector } from "@/components/assessment/MaturityLevelSelector";
import { EvidenceUploader } from "@/components/assessment/EvidenceUploader";
import { useApi, useMutation } from "@/lib/hooks/use-api";
import { assessmentsApi, ndiApi, evidenceApi } from "@/lib/api";
import { cn, getLevelColor } from "@/lib/utils";

export default function DomainQuestionsPage({
  params,
}: {
  params: { id: string; code: string; locale: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, { level: number | null; justification: string }>>({});
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set());

  // Fetch assessment
  const fetchAssessment = useCallback(() => assessmentsApi.get(params.id), [params.id]);
  const { data: assessment, loading: loadingAssessment, error: assessmentError } = useApi(fetchAssessment, [params.id]);

  // Fetch domain with questions
  const fetchDomain = useCallback(() => ndiApi.getDomain(params.code), [params.code]);
  const { data: domain, loading: loadingDomain, error: domainError, refetch } = useApi(fetchDomain, [params.code]);

  // Fetch existing responses
  const fetchResponses = useCallback(
    () => assessmentsApi.getResponses(params.id, params.code),
    [params.id, params.code]
  );
  const { data: existingResponses, loading: loadingResponses } = useApi(fetchResponses, [params.id, params.code]);

  // Save response mutation
  const saveMutation = useMutation((data: { question_id: string; selected_level: number; justification?: string }) =>
    assessmentsApi.saveResponse(params.id, data)
  );

  // Initialize responses from existing data
  useState(() => {
    if (existingResponses) {
      const initialResponses: Record<string, { level: number | null; justification: string }> = {};
      existingResponses.forEach((r: any) => {
        if (r.question) {
          initialResponses[r.question.code] = {
            level: r.selected_level,
            justification: r.justification || "",
          };
          if (r.selected_level !== null) {
            setSavedQuestions((prev) => new Set([...prev, r.question.code]));
          }
        }
      });
      setResponses(initialResponses);
    }
  });

  const handleSaveResponse = async (questionCode: string, questionId: string) => {
    const response = responses[questionCode];
    if (response?.level === null || response?.level === undefined) return;

    try {
      await saveMutation.mutate({
        question_id: questionId,
        selected_level: response.level,
        justification: response.justification,
      });
      setSavedQuestions((prev) => new Set([...prev, questionCode]));
    } catch (err) {
      console.error("Failed to save response:", err);
    }
  };

  const handleUpload = async (file: File) => {
    // This would need the response ID - for now we'll just log
    console.log("Upload file:", file.name);
    return { id: "temp-id" };
  };

  const handleAnalyze = async (evidenceId: string) => {
    console.log("Analyze evidence:", evidenceId);
    return {};
  };

  if (loadingAssessment || loadingDomain || loadingResponses) {
    return <PageLoading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />;
  }

  if (assessmentError || domainError || !domain) {
    return <ErrorState message={assessmentError || domainError || "Domain not found"} onRetry={refetch} />;
  }

  const questions = domain.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = savedQuestions.size;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href={`/${locale}/dashboard/assessments`} className="hover:text-foreground">
              {t("assessment.assessments")}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/dashboard/assessments/${params.id}`} className="hover:text-foreground">
              {assessment?.name}
            </Link>
            <span>/</span>
            <span>{locale === "ar" ? domain.name_ar : domain.name_en}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-primary me-2">[{domain.code}]</span>
            {locale === "ar" ? domain.name_ar : domain.name_en}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar" ? domain.description_ar : domain.description_en}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">{t("assessment.progress")}: </span>
            <span className="font-medium">{answeredCount}/{questions.length}</span>
          </div>
          <Progress value={progress} className="w-32" />
        </div>
      </div>

      {/* Questions navigation */}
      <div className="flex gap-2 flex-wrap">
        {questions.map((q: any, index: number) => {
          const isSaved = savedQuestions.has(q.code);
          const isCurrent = index === currentQuestionIndex;
          return (
            <Button
              key={q.code}
              variant={isCurrent ? "default" : "outline"}
              size="sm"
              className={cn(
                "relative",
                isSaved && !isCurrent && "border-green-500 text-green-600"
              )}
              onClick={() => setCurrentQuestionIndex(index)}
            >
              {index + 1}
              {isSaved && (
                <CheckCircle2 className="h-3 w-3 absolute -top-1 -end-1 text-green-500" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  {locale === "ar" ? `السؤال ${currentQuestionIndex + 1}` : `Question ${currentQuestionIndex + 1}`}
                </CardTitle>
                <CardDescription className="mt-2 text-base text-foreground">
                  {locale === "ar" ? currentQuestion.question_ar : currentQuestion.question_en}
                </CardDescription>
              </div>
              <span className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {currentQuestion.code}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Maturity Level Selection */}
            <div>
              <h3 className="font-medium mb-4">
                {locale === "ar" ? "اختر مستوى النضج" : "Select Maturity Level"}
              </h3>
              <MaturityLevelSelector
                levels={currentQuestion.maturity_levels || []}
                selectedLevel={responses[currentQuestion.code]?.level ?? null}
                onSelect={(level) =>
                  setResponses((prev) => ({
                    ...prev,
                    [currentQuestion.code]: {
                      ...prev[currentQuestion.code],
                      level,
                    },
                  }))
                }
              />
            </div>

            {/* Justification */}
            <div className="space-y-2">
              <label className="font-medium">
                {locale === "ar" ? "المبررات والملاحظات" : "Justification & Notes"}
              </label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder={
                  locale === "ar"
                    ? "أضف المبررات والملاحظات هنا..."
                    : "Add justification and notes here..."
                }
                value={responses[currentQuestion.code]?.justification || ""}
                onChange={(e) =>
                  setResponses((prev) => ({
                    ...prev,
                    [currentQuestion.code]: {
                      ...prev[currentQuestion.code],
                      justification: e.target.value,
                    },
                  }))
                }
              />
            </div>

            {/* Evidence Upload */}
            <div className="space-y-2">
              <h3 className="font-medium">
                {locale === "ar" ? "الأدلة والمستندات" : "Evidence & Documents"}
              </h3>
              <EvidenceUploader
                responseId="temp"
                onUpload={handleUpload}
                onAnalyze={handleAnalyze}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                {locale === "ar" ? <ArrowRight className="h-4 w-4 me-2" /> : <ArrowLeft className="h-4 w-4 me-2" />}
                {locale === "ar" ? "السابق" : "Previous"}
              </Button>

              <Button
                onClick={() => handleSaveResponse(currentQuestion.code, currentQuestion.id)}
                disabled={
                  saveMutation.loading ||
                  responses[currentQuestion.code]?.level === null ||
                  responses[currentQuestion.code]?.level === undefined
                }
              >
                {saveMutation.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <Save className="h-4 w-4 me-2" />
                )}
                {locale === "ar" ? "حفظ الإجابة" : "Save Response"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                {locale === "ar" ? "التالي" : "Next"}
                {locale === "ar" ? <ArrowLeft className="h-4 w-4 ms-2" /> : <ArrowRight className="h-4 w-4 ms-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back to Assessment */}
      <div className="flex justify-center">
        <Link href={`/${locale}/dashboard/assessments/${params.id}`}>
          <Button variant="ghost">
            {locale === "ar" ? <ArrowRight className="h-4 w-4 me-2" /> : <ArrowLeft className="h-4 w-4 me-2" />}
            {locale === "ar" ? "العودة للتقييم" : "Back to Assessment"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
