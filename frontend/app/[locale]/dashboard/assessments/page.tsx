"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assessmentsApi } from "@/lib/api";
import type { Assessment } from "@/types/ndi";
import { getLevelInfo } from "@/types/ndi";

export default function AssessmentsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAssessments();
  }, [statusFilter, typeFilter]);

  async function loadAssessments() {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.assessment_type = typeFilter;

      const data = await assessmentsApi.list(params);
      setAssessments(data.items || []);
    } catch (error) {
      console.error("Failed to load assessments:", error);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredAssessments = assessments.filter((assessment) => {
    if (!searchQuery) return true;
    const name = assessment.name?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase());
  });

  const getLevelColorClass = (score: number | undefined | null) => {
    if (!score) return "bg-gray-100 text-gray-700";
    const level = Math.floor(score);
    const colors: Record<number, string> = {
      0: "bg-gray-100 text-gray-700",
      1: "bg-red-100 text-red-700",
      2: "bg-orange-100 text-orange-700",
      3: "bg-yellow-100 text-yellow-700",
      4: "bg-green-100 text-green-700",
      5: "bg-emerald-100 text-emerald-700",
    };
    return colors[level] || colors[0];
  };

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
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                className="ps-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
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

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {locale === "ar" ? "لا توجد تقييمات" : "No assessments found"}
            </p>
            <Link href={`/${locale}/dashboard/assessments/new`}>
              <Button>
                <Plus className="me-2 h-4 w-4" />
                {t("assessment.newAssessment")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {assessment.name || t(`assessment.${assessment.assessment_type}Assessment`)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t(`assessment.${assessment.assessment_type}Assessment`)}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full ${
                          assessment.status === "completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : assessment.status === "in_progress"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {t(`status.${assessment.status}`)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {assessment.target_level && (
                        <span className="text-muted-foreground">
                          {t("assessment.targetLevel")}:{" "}
                          <span className="font-medium">{assessment.target_level}</span>
                        </span>
                      )}
                      {assessment.maturity_score !== undefined && assessment.maturity_score !== null && (
                        <span className="text-muted-foreground">
                          {t("assessment.maturityScore")}:{" "}
                          <span
                            className={`font-medium px-1.5 py-0.5 rounded ${getLevelColorClass(
                              assessment.maturity_score
                            )}`}
                          >
                            {assessment.maturity_score.toFixed(1)}
                          </span>
                        </span>
                      )}
                      {assessment.compliance_score !== undefined && assessment.compliance_score !== null && (
                        <span className="text-muted-foreground">
                          {t("assessment.complianceScore")}:{" "}
                          <span className="font-medium">
                            {assessment.compliance_score.toFixed(0)}%
                          </span>
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {t("common.date")}: {new Date(assessment.created_at).toLocaleDateString(locale)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Progress value={assessment.progress_percentage} className="flex-1 h-2" />
                      <span className="text-sm font-medium w-12">
                        {assessment.progress_percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/${locale}/dashboard/assessments/${assessment.id}`}>
                      <Button variant="outline" size="sm">
                        {t("assessment.viewDetails")}
                        <Arrow className="ms-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
