"use client";

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

export default function DashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  // Mock data - replace with actual API calls
  const stats = {
    totalAssessments: 12,
    completedAssessments: 8,
    inProgressAssessments: 4,
    averageScore: 3.2,
    organizationsCount: 5,
  };

  const recentAssessments = [
    {
      id: "1",
      name: locale === "ar" ? "تقييم وزارة المالية" : "Ministry of Finance Assessment",
      status: "in_progress",
      progress: 65,
      score: null,
    },
    {
      id: "2",
      name: locale === "ar" ? "تقييم وزارة الصحة" : "Ministry of Health Assessment",
      status: "completed",
      progress: 100,
      score: 3.5,
    },
    {
      id: "3",
      name: locale === "ar" ? "تقييم وزارة التعليم" : "Ministry of Education Assessment",
      status: "draft",
      progress: 20,
      score: null,
    },
  ];

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
            <div className="text-2xl font-bold">{stats.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedAssessments} {t("dashboard.completedAssessments")}
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
            <div className="text-2xl font-bold">{stats.inProgressAssessments}</div>
            <Progress value={65} className="mt-2" />
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
            <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {t("levels.3")} {/* Activated */}
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
            <div className="text-2xl font-bold">{stats.organizationsCount}</div>
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
            <Link href={`/${locale}/assessments`}>
              <Button variant="ghost" size="sm">
                {t("common.view")}
                <Arrow className="ms-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
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
                      {assessment.score && (
                        <span className="text-xs text-muted-foreground">
                          {t("assessment.score")}: {assessment.score}
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress value={assessment.progress} className="w-20" />
                </div>
              ))}
            </div>
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
            <Link href={`/${locale}/assessments/new`} className="block">
              <Button className="w-full justify-start" size="lg">
                <Plus className="me-2 h-5 w-5" />
                {t("dashboard.startAssessment")}
              </Button>
            </Link>
            <Link href={`/${locale}/reports`} className="block">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <FileBarChart className="me-2 h-5 w-5" />
                {t("dashboard.viewReports")}
              </Button>
            </Link>
            <Link href={`/${locale}/organizations`} className="block">
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
