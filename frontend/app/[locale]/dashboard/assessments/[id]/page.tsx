"use client";

import { useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle2, FileBarChart, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DomainCard } from "@/components/assessment/DomainCard";
import { PageLoading } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { useApi, useMutation } from "@/lib/hooks/use-api";
import { assessmentsApi, ndiApi } from "@/lib/api";
import { cn, getLevelColor } from "@/lib/utils";

export default function AssessmentDetailPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  // Fetch assessment
  const fetchAssessment = useCallback(() => assessmentsApi.get(params.id), [params.id]);
  const { data: assessment, loading: loadingAssessment, error: assessmentError, refetch } = useApi(fetchAssessment, [params.id]);

  // Fetch domains
  const fetchDomains = useCallback(() => ndiApi.getDomains(), []);
  const { data: domainsData, loading: loadingDomains } = useApi(fetchDomains, []);

  // Fetch responses to calculate domain progress
  const fetchResponses = useCallback(() => assessmentsApi.getResponses(params.id), [params.id]);
  const { data: responsesData } = useApi(fetchResponses, [params.id]);

  // Submit mutation
  const submitMutation = useMutation(() => assessmentsApi.submit(params.id));

  const handleSubmit = async () => {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من تسليم التقييم؟" : "Are you sure you want to submit this assessment?")) {
      return;
    }
    try {
      await submitMutation.mutate(undefined);
      refetch();
    } catch (err) {
      console.error("Failed to submit assessment:", err);
    }
  };

  if (loadingAssessment || loadingDomains) {
    return <PageLoading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />;
  }

  if (assessmentError || !assessment) {
    return <ErrorState message={assessmentError || "Assessment not found"} onRetry={refetch} />;
  }

  const domains = domainsData?.items || [];
  const responses = responsesData || [];

  // Calculate domain scores from responses
  const getDomainStats = (domainCode: string) => {
    const domainResponses = responses.filter((r: any) => r.question?.code?.startsWith(domainCode));
    const answeredCount = domainResponses.filter((r: any) => r.selected_level !== null).length;
    const totalScore = domainResponses.reduce((sum: number, r: any) => sum + (r.selected_level || 0), 0);
    const averageScore = answeredCount > 0 ? totalScore / answeredCount : undefined;
    return { answeredCount, averageScore };
  };

  const getLevelName = (level: number) => {
    const names: Record<number, { en: string; ar: string }> = {
      0: { en: "Absence of Capabilities", ar: "غياب القدرات" },
      1: { en: "Establishing", ar: "التأسيس" },
      2: { en: "Defined", ar: "التحديد" },
      3: { en: "Activated", ar: "التفعيل" },
      4: { en: "Managed", ar: "الإدارة" },
      5: { en: "Pioneer", ar: "الريادة" },
    };
    return locale === "ar" ? names[level]?.ar : names[level]?.en;
  };

  const totalQuestions = domains.reduce((sum: number, d: any) => sum + (d.question_count || 0), 0);
  const answeredQuestions = assessment.responses_count || 0;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

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
            <span>{assessment.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {assessment.name || t(`assessment.${assessment.assessment_type}Assessment`)}
          </h1>
          <p className="text-muted-foreground">
            {t(`assessment.${assessment.assessment_type}Assessment`)}
          </p>
        </div>

        <div className="flex gap-2">
          <Link href={`/${locale}/dashboard/assessments/${params.id}/report`}>
            <Button variant="outline">
              <FileBarChart className="me-2 h-4 w-4" />
              {t("report.generateReport")}
            </Button>
          </Link>
          {assessment.status !== "completed" && (
            <Button onClick={handleSubmit} disabled={submitMutation.loading}>
              {submitMutation.loading ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <CheckCircle2 className="me-2 h-4 w-4" />
              )}
              {t("assessment.submitAssessment")}
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("assessment.progress")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold">
                {Math.round(progress)}%
              </div>
              <Progress value={progress} className="flex-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {answeredQuestions} / {totalQuestions}{" "}
              {t("assessment.questions")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("assessment.currentLevel")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-2xl font-bold px-3 py-1 rounded",
                  getLevelColor(Math.floor(assessment.current_score || 0))
                )}
              >
                {assessment.current_score?.toFixed(1) || "-"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {getLevelName(Math.floor(assessment.current_score || 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("assessment.targetLevel")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{assessment.target_level || 3}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {getLevelName(assessment.target_level || 3)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.status")}</CardDescription>
          </CardHeader>
          <CardContent>
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium",
                assessment.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : assessment.status === "in_progress"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              )}
            >
              {t(`status.${assessment.status}`)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Domains grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {locale === "ar" ? "المجالات" : "Domains"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain: any) => {
            const stats = getDomainStats(domain.code);
            return (
              <DomainCard
                key={domain.code}
                domain={domain}
                assessmentId={params.id}
                answeredCount={stats.answeredCount}
                averageScore={stats.averageScore}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
