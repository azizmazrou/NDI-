"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Plus, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useApi, useMutation } from "@/lib/hooks/use-api";
import { assessmentsApi } from "@/lib/api";
import { getLevelColor } from "@/lib/utils";

export default function AssessmentsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
  });

  const fetchAssessments = useCallback(
    () =>
      assessmentsApi.list({
        status: filters.status !== "all" ? filters.status : undefined,
        assessment_type: filters.type !== "all" ? filters.type : undefined,
      }),
    [filters]
  );

  const { data, loading, error, refetch } = useApi(fetchAssessments, [filters]);
  const deleteMutation = useMutation((id: string) => assessmentsApi.delete(id));

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(locale === "ar" ? "هل أنت متأكد من حذف هذا التقييم؟" : "Are you sure you want to delete this assessment?")) {
      return;
    }
    try {
      await deleteMutation.mutate(id);
      refetch();
    } catch (err) {
      console.error("Failed to delete assessment:", err);
    }
  };

  if (loading) {
    return <PageLoading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const assessments = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("assessment.assessments")}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "إدارة وتتبع تقييمات مؤشر البيانات الوطني"
              : "Manage and track NDI assessments"}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/assessments/new`}>
          <Button>
            <Plus className="me-2 h-4 w-4" />
            {t("assessment.newAssessment")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="draft">{t("status.draft")}</SelectItem>
                <SelectItem value="in_progress">{t("status.in_progress")}</SelectItem>
                <SelectItem value="completed">{t("status.completed")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("common.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="maturity">{t("assessment.maturityAssessment")}</SelectItem>
                <SelectItem value="compliance">{t("assessment.complianceAssessment")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assessments List */}
      {assessments.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title={locale === "ar" ? "لا توجد تقييمات" : "No assessments found"}
              description={
                locale === "ar"
                  ? "لم يتم إنشاء أي تقييمات بعد"
                  : "No assessments have been created yet"
              }
              action={{
                label: t("assessment.newAssessment"),
                onClick: () => window.location.href = `/${locale}/dashboard/assessments/new`,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment: any) => (
            <Link
              key={assessment.id}
              href={`/${locale}/dashboard/assessments/${assessment.id}`}
            >
              <Card className="ndi-card-hover cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{assessment.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {locale === "ar"
                              ? assessment.organization?.name_ar
                              : assessment.organization?.name_en}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full ${
                            assessment.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : assessment.status === "in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {t(`status.${assessment.status}`)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {t("assessment.targetLevel")}:{" "}
                          <span className="font-medium">{assessment.target_level}</span>
                        </span>
                        {assessment.current_score && (
                          <span className="text-muted-foreground">
                            {t("assessment.score")}:{" "}
                            <span
                              className={`font-medium px-1.5 py-0.5 rounded ${getLevelColor(
                                Math.floor(assessment.current_score)
                              )}`}
                            >
                              {assessment.current_score.toFixed(1)}
                            </span>
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {t("common.date")}: {new Date(assessment.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Progress value={assessment.progress_percentage || 0} className="flex-1 h-2" />
                        <span className="text-sm font-medium w-12">
                          {Math.round(assessment.progress_percentage || 0)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        {t("assessment.viewDetails")}
                        <Arrow className="ms-2 h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(assessment.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      {data && data.total > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {locale === "ar"
            ? `إجمالي ${data.total} تقييم`
            : `Total: ${data.total} assessments`}
        </p>
      )}
    </div>
  );
}
