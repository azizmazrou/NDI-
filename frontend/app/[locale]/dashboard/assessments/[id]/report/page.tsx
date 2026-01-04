"use client";

import { useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Download,
  FileBarChart,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageLoading } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { useApi } from "@/lib/hooks/use-api";
import { assessmentsApi } from "@/lib/api";
import { cn, getLevelColor } from "@/lib/utils";

export default function AssessmentReportPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  // Fetch report
  const fetchReport = useCallback(() => assessmentsApi.getReport(params.id), [params.id]);
  const { data: report, loading, error, refetch } = useApi(fetchReport, [params.id]);

  if (loading) {
    return <PageLoading text={locale === "ar" ? "جاري إنشاء التقرير..." : "Generating report..."} />;
  }

  if (error || !report) {
    return <ErrorState message={error || "Report not found"} onRetry={refetch} />;
  }

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

  const gapToTarget = Math.max(0, report.target_level - (report.overall_score || 0));
  const meetsTarget = (report.overall_score || 0) >= report.target_level;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href={`/${locale}/dashboard/assessments`} className="hover:text-foreground">
              {t("assessment.assessments")}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/dashboard/assessments/${params.id}`} className="hover:text-foreground">
              {report.assessment_name}
            </Link>
            <span>/</span>
            <span>{locale === "ar" ? "التقرير" : "Report"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="h-6 w-6" />
            {locale === "ar" ? "تقرير التقييم" : "Assessment Report"}
          </h1>
        </div>

        <Button onClick={() => window.print()}>
          <Download className="h-4 w-4 me-2" />
          {locale === "ar" ? "تحميل PDF" : "Download PDF"}
        </Button>
      </div>

      {/* Report Header Card */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="text-center border-b">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-xl ndi-gradient flex items-center justify-center">
              <span className="text-white font-bold text-2xl">NDI</span>
            </div>
          </div>
          <CardTitle className="text-2xl">{report.assessment_name}</CardTitle>
          <CardDescription className="text-lg">
            {locale === "ar" ? report.organization?.name_ar : report.organization?.name_en}
          </CardDescription>
          <p className="text-sm text-muted-foreground mt-2">
            {locale === "ar" ? "تاريخ التقرير:" : "Report Date:"}{" "}
            {new Date().toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Overall Score */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">
                {locale === "ar" ? "الدرجة الإجمالية" : "Overall Score"}
              </p>
              <div
                className={cn(
                  "text-4xl font-bold px-4 py-2 rounded-lg inline-block",
                  getLevelColor(Math.floor(report.overall_score || 0))
                )}
              >
                {report.overall_score?.toFixed(1) || "-"}
              </div>
              <p className="text-sm mt-2">
                {getLevelName(Math.floor(report.overall_score || 0))}
              </p>
            </div>

            {/* Target Level */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">
                {t("assessment.targetLevel")}
              </p>
              <div className="text-4xl font-bold">{report.target_level}</div>
              <p className="text-sm mt-2">{getLevelName(report.target_level)}</p>
            </div>

            {/* Status */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">
                {locale === "ar" ? "حالة الهدف" : "Target Status"}
              </p>
              <div className="flex justify-center">
                {meetsTarget ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-8 w-8" />
                    <span className="text-lg font-semibold">
                      {locale === "ar" ? "تم تحقيقه" : "Achieved"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <TrendingUp className="h-8 w-8" />
                    <span className="text-lg font-semibold">
                      {locale === "ar" ? `فجوة: ${gapToTarget.toFixed(1)}` : `Gap: ${gapToTarget.toFixed(1)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Scores */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "درجات المجالات" : "Domain Scores"}</CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "تحليل تفصيلي لكل مجال من مجالات مؤشر البيانات الوطني"
              : "Detailed analysis for each NDI domain"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(report.domain_scores || []).map((domain: any) => (
              <div key={domain.code} className="flex items-center gap-4">
                <div className="w-16 text-center">
                  <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                    {domain.code}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      {locale === "ar" ? domain.name_ar : domain.name_en}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold px-2 py-0.5 rounded",
                        getLevelColor(Math.floor(domain.score || 0))
                      )}
                    >
                      {domain.score?.toFixed(1) || "-"}
                    </span>
                  </div>
                  <Progress value={((domain.score || 0) / 5) * 100} className="h-2" />
                </div>
                <div className="w-20 text-end text-sm text-muted-foreground">
                  {domain.answered_questions}/{domain.total_questions}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            {locale === "ar" ? "التوصيات" : "Recommendations"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "الإجراءات المقترحة لتحسين مستوى النضج"
              : "Suggested actions to improve maturity level"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.recommendations?.length > 0 ? (
            <ul className="space-y-3">
              {report.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {locale === "ar"
                  ? "استخدم ميزة التحليل بالذكاء الاصطناعي للحصول على توصيات مخصصة"
                  : "Use the AI analysis feature to get personalized recommendations"}
              </p>
              <Button variant="outline" className="mt-4">
                {locale === "ar" ? "تحليل بالذكاء الاصطناعي" : "AI Analysis"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-center print:hidden">
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
