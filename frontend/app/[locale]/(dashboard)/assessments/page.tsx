"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Plus, Search, Filter, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getLevelColor } from "@/lib/utils";

export default function AssessmentsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  // Mock data - replace with API calls
  const assessments = [
    {
      id: "1",
      name: locale === "ar" ? "تقييم وزارة المالية Q4 2024" : "Ministry of Finance Q4 2024",
      organization: locale === "ar" ? "وزارة المالية" : "Ministry of Finance",
      type: "maturity",
      status: "in_progress",
      progress: 65,
      currentScore: 2.8,
      targetLevel: 3,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: locale === "ar" ? "تقييم وزارة الصحة Q4 2024" : "Ministry of Health Q4 2024",
      organization: locale === "ar" ? "وزارة الصحة" : "Ministry of Health",
      type: "maturity",
      status: "completed",
      progress: 100,
      currentScore: 3.5,
      targetLevel: 4,
      createdAt: "2024-01-10",
    },
    {
      id: "3",
      name: locale === "ar" ? "تقييم وزارة التعليم" : "Ministry of Education Assessment",
      organization: locale === "ar" ? "وزارة التعليم" : "Ministry of Education",
      type: "maturity",
      status: "draft",
      progress: 20,
      currentScore: null,
      targetLevel: 3,
      createdAt: "2024-01-20",
    },
  ];

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
        <Link href={`/${locale}/assessments/new`}>
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
              />
            </div>
            <Select defaultValue="all">
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
            <Select defaultValue="all">
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
      <div className="space-y-4">
        {assessments.map((assessment) => (
          <Card key={assessment.id} className="ndi-card-hover">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{assessment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {assessment.organization}
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
                      <span className="font-medium">{assessment.targetLevel}</span>
                    </span>
                    {assessment.currentScore && (
                      <span className="text-muted-foreground">
                        {t("assessment.score")}:{" "}
                        <span
                          className={`font-medium px-1.5 py-0.5 rounded ${getLevelColor(
                            Math.floor(assessment.currentScore)
                          )}`}
                        >
                          {assessment.currentScore.toFixed(1)}
                        </span>
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {t("common.date")}: {assessment.createdAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Progress value={assessment.progress} className="flex-1 h-2" />
                    <span className="text-sm font-medium w-12">
                      {assessment.progress}%
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/${locale}/assessments/${assessment.id}`}>
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

      {/* Empty state */}
      {assessments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {locale === "ar" ? "لا توجد تقييمات" : "No assessments found"}
            </p>
            <Link href={`/${locale}/assessments/new`}>
              <Button>
                <Plus className="me-2 h-4 w-4" />
                {t("assessment.newAssessment")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
