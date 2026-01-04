"use client";

import { useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  ClipboardCheck,
  Building2,
  TrendingUp,
  FileBarChart,
  ArrowRight,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageLoading } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { useApi } from "@/lib/hooks/use-api";
import { assessmentsApi, organizationsApi } from "@/lib/api";
import { getLevelColor } from "@/lib/utils";

export default function DashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  // Fetch assessments
  const fetchAssessments = useCallback(
    () => assessmentsApi.list({ page_size: 5 }),
    []
  );
  const {
    data: assessmentsData,
    loading: loadingAssessments,
    error: assessmentsError,
    refetch: refetchAssessments,
  } = useApi(fetchAssessments, []);

  // Fetch organizations count
  const fetchOrgs = useCallback(() => organizationsApi.list({ page_size: 1 }), []);
  const { data: orgsData, loading: loadingOrgs } = useApi(fetchOrgs, []);

  if (loadingAssessments || loadingOrgs) {
    return <PageLoading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />;
  }

  if (assessmentsError) {
    return <ErrorState message={assessmentsError} onRetry={refetchAssessments} />;
  }

  const assessments = assessmentsData?.items || [];
  const totalAssessments = assessmentsData?.total || 0;
  const completedAssessments = assessments.filter((a: any) => a.status === "completed").length;
  const inProgressAssessments = assessments.filter((a: any) => a.status === "in_progress").length;

  // Calculate average score from completed assessments
  const completedWithScore = assessments.filter((a: any) => a.status === "completed" && a.current_score);
  const averageScore = completedWithScore.length > 0
    ? completedWithScore.reduce((sum: number, a: any) => sum + (a.current_score || 0), 0) / completedWithScore.length
    : 0;

  const organizationsCount = orgsData?.total || 0;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("dashboard.welcome")}
        </h1>
        <p className="text-muted-foreground">
          {t("dashboard.overview")}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.totalAssessments")}
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {completedAssessments} {t("dashboard.completedAssessments")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.inProgressAssessments")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressAssessments}</div>
            <Progress
              value={totalAssessments > 0 ? (inProgressAssessments / totalAssessments) * 100 : 0}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.averageScore")}
            </CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {t(`levels.${Math.floor(averageScore)}`)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.organizationsCount")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizationsCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Assessments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.recentAssessments")}</CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "آخر التقييمات المنشأة"
                  : "Recently created assessments"}
              </CardDescription>
            </div>
            <Link href={`/${locale}/dashboard/assessments`}>
              <Button variant="ghost" size="sm">
                {t("common.view")}
                <Arrow className="ms-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {assessments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {locale === "ar" ? "لا توجد تقييمات" : "No assessments yet"}
              </p>
            ) : (
              <div className="space-y-4">
                {assessments.slice(0, 5).map((assessment: any) => (
                  <Link
                    key={assessment.id}
                    href={`/${locale}/dashboard/assessments/${assessment.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{assessment.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              assessment.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : assessment.status === "in_progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {t(`status.${assessment.status}`)}
                          </span>
                          {assessment.current_score && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${getLevelColor(Math.floor(assessment.current_score))}`}>
                              {t("assessment.score")}: {assessment.current_score.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Progress value={assessment.progress_percentage || 0} className="w-20" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "إجراءات سريعة للبدء"
                : "Quick actions to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/${locale}/dashboard/assessments/new`} className="block">
              <Button className="w-full justify-start" size="lg">
                <Plus className="me-2 h-5 w-5" />
                {t("dashboard.startAssessment")}
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/reports`} className="block">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <FileBarChart className="me-2 h-5 w-5" />
                {t("dashboard.viewReports")}
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/organizations`} className="block">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Building2 className="me-2 h-5 w-5" />
                {t("organization.organizations")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
