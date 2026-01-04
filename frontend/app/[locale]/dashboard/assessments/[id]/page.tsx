"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle2, FileBarChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DomainCard } from "@/components/assessment/DomainCard";
import { cn, getLevelColor, formatPercentage } from "@/lib/utils";

export default function AssessmentDetailPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  // Mock data - replace with API call
  const assessment = {
    id: params.id,
    name: locale === "ar" ? "تقييم وزارة المالية Q4 2024" : "Ministry of Finance Q4 2024",
    organization: {
      name_ar: "وزارة المالية",
      name_en: "Ministry of Finance",
    },
    type: "maturity",
    status: "in_progress",
    targetLevel: 3,
    currentScore: 2.8,
    progress: 65,
    totalQuestions: 42,
    answeredQuestions: 27,
  };

  const domains = [
    { code: "DG", name_en: "Data Governance", name_ar: "حوكمة البيانات", question_count: 4, answered: 4, score: 3.2 },
    { code: "MCM", name_en: "Metadata and Data Catalog", name_ar: "البيانات الوصفية ودليل البيانات", question_count: 3, answered: 3, score: 2.8 },
    { code: "DQ", name_en: "Data Quality", name_ar: "جودة البيانات", question_count: 4, answered: 3, score: 2.5 },
    { code: "DO", name_en: "Data Operations", name_ar: "تخزين البيانات", question_count: 3, answered: 2, score: 3.0 },
    { code: "DCM", name_en: "Document and Content Management", name_ar: "إدارة المحتوى والوثائق", question_count: 3, answered: 3, score: 2.3 },
    { code: "DAM", name_en: "Data Architecture and Modelling", name_ar: "النمذجة وهيكلة البيانات", question_count: 2, answered: 2, score: 3.5 },
    { code: "DSI", name_en: "Data Sharing and Interoperability", name_ar: "تكامل البيانات ومشاركتها", question_count: 4, answered: 2, score: 2.0 },
    { code: "RMD", name_en: "Reference and Master Data", name_ar: "إدارة البيانات المرجعية والرئيسية", question_count: 3, answered: 1, score: 2.5 },
    { code: "BIA", name_en: "Business Intelligence and Analytics", name_ar: "ذكاء الأعمال والتحليلات", question_count: 4, answered: 3, score: 3.2 },
    { code: "DVR", name_en: "Data Value Realization", name_ar: "تحقيق القيمة من البيانات", question_count: 2, answered: 0, score: null },
    { code: "OD", name_en: "Open Data", name_ar: "البيانات المفتوحة", question_count: 3, answered: 2, score: 2.8 },
    { code: "FOI", name_en: "Freedom of Information", name_ar: "حرية المعلومات", question_count: 2, answered: 1, score: 3.0 },
    { code: "DC", name_en: "Data Classification", name_ar: "تصنيف البيانات", question_count: 3, answered: 1, score: 2.5 },
    { code: "PDP", name_en: "Personal Data Protection", name_ar: "حماية البيانات الشخصية", question_count: 2, answered: 0, score: null },
  ];

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
          <h1 className="text-2xl font-bold tracking-tight">{assessment.name}</h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? assessment.organization.name_ar
              : assessment.organization.name_en}
          </p>
        </div>

        <div className="flex gap-2">
          <Link href={`/${locale}/dashboard/reports`}>
            <Button variant="outline">
              <FileBarChart className="me-2 h-4 w-4" />
              {t("report.generateReport")}
            </Button>
          </Link>
          {assessment.status !== "completed" && (
            <Button>
              <CheckCircle2 className="me-2 h-4 w-4" />
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
                {formatPercentage(assessment.progress)}
              </div>
              <Progress value={assessment.progress} className="flex-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {assessment.answeredQuestions} / {assessment.totalQuestions}{" "}
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
                  getLevelColor(Math.floor(assessment.currentScore || 0))
                )}
              >
                {assessment.currentScore?.toFixed(1) || "-"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {getLevelName(Math.floor(assessment.currentScore || 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("assessment.targetLevel")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{assessment.targetLevel}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {getLevelName(assessment.targetLevel)}
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
          {domains.map((domain) => (
            <DomainCard
              key={domain.code}
              domain={domain}
              assessmentId={params.id}
              answeredCount={domain.answered}
              averageScore={domain.score || undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
