"use client";

import { useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { FileBarChart, Download, Eye, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageLoading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useApi } from "@/lib/hooks/use-api";
import { assessmentsApi } from "@/lib/api";
import { getLevelColor } from "@/lib/utils";

export default function ReportsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  // Fetch completed assessments
  const fetchAssessments = useCallback(
    () => assessmentsApi.list({ status: "completed" }),
    []
  );
  const { data, loading, error, refetch } = useApi(fetchAssessments, []);

  if (loading) {
    return <PageLoading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const completedAssessments = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileBarChart className="h-6 w-6" />
          {t("nav.reports")}
        </h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "عرض وتحميل تقارير التقييمات المكتملة"
            : "View and download reports for completed assessments"}
        </p>
      </div>

      {/* Reports List */}
      {completedAssessments.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={FileBarChart}
              title={locale === "ar" ? "لا توجد تقارير" : "No Reports Available"}
              description={
                locale === "ar"
                  ? "لا توجد تقييمات مكتملة بعد. قم بإكمال تقييم لعرض تقريره."
                  : "No completed assessments yet. Complete an assessment to view its report."
              }
              action={{
                label: locale === "ar" ? "بدء تقييم جديد" : "Start New Assessment",
                onClick: () => window.location.href = `/${locale}/dashboard/assessments/new`,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {completedAssessments.map((assessment: any) => (
            <Card key={assessment.id} className="ndi-card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{assessment.name}</CardTitle>
                    <CardDescription>
                      {locale === "ar"
                        ? assessment.organization?.name_ar
                        : assessment.organization?.name_en}
                    </CardDescription>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("assessment.score")}
                  </span>
                  <span
                    className={`text-lg font-bold px-2 py-0.5 rounded ${getLevelColor(
                      Math.floor(assessment.current_score || 0)
                    )}`}
                  >
                    {assessment.current_score?.toFixed(1) || "-"}
                  </span>
                </div>

                {/* Target vs Achieved */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("assessment.targetLevel")}</span>
                    <span className="font-medium">{assessment.target_level}</span>
                  </div>
                  <Progress
                    value={((assessment.current_score || 0) / 5) * 100}
                    className="h-2"
                  />
                </div>

                {/* Date */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {locale === "ar" ? "تاريخ الإكمال" : "Completed"}
                  </span>
                  <span>
                    {assessment.completed_at
                      ? new Date(assessment.completed_at).toLocaleDateString()
                      : "-"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link
                    href={`/${locale}/dashboard/assessments/${assessment.id}/report`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="h-4 w-4 me-2" />
                      {locale === "ar" ? "عرض" : "View"}
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {data && data.total > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{data.total}</div>
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "التقييمات المكتملة" : "Completed Assessments"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {completedAssessments.length > 0
                  ? (
                      completedAssessments.reduce(
                        (sum: number, a: any) => sum + (a.current_score || 0),
                        0
                      ) / completedAssessments.length
                    ).toFixed(1)
                  : "-"}
              </div>
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "متوسط الدرجات" : "Average Score"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {completedAssessments.filter((a: any) => (a.current_score || 0) >= a.target_level).length}
              </div>
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "حققت المستوى المستهدف" : "Met Target Level"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
