"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  ListTodo,
  TrendingUp,
  FileBarChart,
  ArrowRight,
  ArrowLeft,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { dashboardApi, assessmentsApi, tasksApi } from "@/lib/api";
import type { DashboardStats, Assessment, Task } from "@/types/ndi";

export default function DashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, assessmentsData, tasksData] = await Promise.all([
          dashboardApi.getStats(locale).catch(() => null),
          assessmentsApi.list({ page_size: 3 }).catch(() => ({ items: [] })),
          tasksApi.getMyTasks({ status: "pending" }).catch(() => []),
        ]);

        if (statsData) setStats(statsData);
        setRecentAssessments(assessmentsData.items || []);
        setMyTasks(Array.isArray(tasksData) ? tasksData.slice(0, 5) : []);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [locale]);

  // Fallback stats for demo
  const displayStats = stats || {
    total_assessments: 0,
    active_assessments: 0,
    completed_assessments: 0,
    average_maturity_score: 0,
    average_compliance_score: 0,
    total_tasks: 0,
    pending_tasks: 0,
    overdue_tasks: 0,
    domain_progress: [],
  };

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
            <div className="text-2xl font-bold">{displayStats.total_assessments}</div>
            <p className="text-xs text-muted-foreground">
              {displayStats.completed_assessments} {t("dashboard.completedAssessments")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.averageMaturityScore")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayStats.average_maturity_score?.toFixed(1) || "0.0"}
            </div>
            <Progress
              value={(displayStats.average_maturity_score || 0) * 20}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.pendingTasks")}
            </CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.pending_tasks}</div>
            {displayStats.overdue_tasks > 0 && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {displayStats.overdue_tasks} {t("dashboard.overdueTasks")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.averageComplianceScore")}
            </CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayStats.average_compliance_score?.toFixed(0) || "0"}%
            </div>
            <Progress
              value={displayStats.average_compliance_score || 0}
              className="mt-2"
            />
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
            <div className="space-y-4">
              {recentAssessments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("common.noResults")}
                </p>
              ) : (
                recentAssessments.map((assessment) => (
                  <Link
                    key={assessment.id}
                    href={`/${locale}/dashboard/assessments/${assessment.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {assessment.name || t(`assessment.${assessment.assessment_type}Assessment`)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              assessment.status === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : assessment.status === "in_progress"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {t(`status.${assessment.status}`)}
                          </span>
                          {assessment.maturity_score !== undefined && assessment.maturity_score !== null && (
                            <span className="text-xs text-muted-foreground">
                              {t("assessment.score")}: {assessment.maturity_score.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Progress value={assessment.progress_percentage} className="w-20" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.myTasks")}</CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "المهام المعينة لك"
                  : "Tasks assigned to you"}
              </CardDescription>
            </div>
            <Link href={`/${locale}/dashboard/tasks`}>
              <Button variant="ghost" size="sm">
                {t("dashboard.viewAllTasks")}
                <Arrow className="ms-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myTasks.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t("task.allTasksCompleted")}
                  </p>
                </div>
              ) : (
                myTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        task.priority === "urgent"
                          ? "bg-red-500"
                          : task.priority === "high"
                          ? "bg-orange-500"
                          : task.priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString(locale)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        task.status === "overdue"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : task.status === "in_progress"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {t(`task.${task.status}`)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
        <CardContent className="flex flex-wrap gap-3">
          <Link href={`/${locale}/dashboard/assessments/new`}>
            <Button size="lg">
              <Plus className="me-2 h-5 w-5" />
              {t("dashboard.startAssessment")}
            </Button>
          </Link>
          <Link href={`/${locale}/dashboard/reports`}>
            <Button variant="outline" size="lg">
              <FileBarChart className="me-2 h-5 w-5" />
              {t("dashboard.viewReports")}
            </Button>
          </Link>
          <Link href={`/${locale}/dashboard/tasks`}>
            <Button variant="outline" size="lg">
              <ListTodo className="me-2 h-5 w-5" />
              {t("task.tasks")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
