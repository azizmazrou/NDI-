"use client";

import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import {
  FileBarChart,
  Download,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assessmentsApi, reportsApi, scoresApi } from "@/lib/api";
import type { Assessment, MaturityScoreResult, GapItem } from "@/types/ndi";
import { getLevelInfo, MATURITY_LEVELS } from "@/types/ndi";

export default function ReportsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [report, setReport] = useState<any>(null);
  const [maturityScore, setMaturityScore] = useState<MaturityScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    loadAssessments();
  }, []);

  async function loadAssessments() {
    try {
      const data = await assessmentsApi.list({ status: "completed" });
      setAssessments(data.items || []);
      if (data.items?.length > 0) {
        setSelectedAssessmentId(data.items[0].id);
      }
    } catch (error) {
      console.error("Failed to load assessments:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedAssessmentId) {
      loadReport(selectedAssessmentId);
    }
  }, [selectedAssessmentId]);

  async function loadReport(assessmentId: string) {
    setLoadingReport(true);
    try {
      const [reportData, scoreData] = await Promise.all([
        reportsApi.getAssessmentReport(assessmentId, locale).catch(() => null),
        scoresApi.getMaturityScore(assessmentId, locale).catch(() => null),
      ]);
      setReport(reportData);
      setMaturityScore(scoreData);
    } catch (error) {
      console.error("Failed to load report:", error);
    } finally {
      setLoadingReport(false);
    }
  }

  async function downloadExcel() {
    if (!selectedAssessmentId) return;
    try {
      const blob = await reportsApi.downloadExcel(selectedAssessmentId, locale);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ndi-report-${selectedAssessmentId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download report:", error);
    }
  }

  const overallLevel = maturityScore?.overall_level || 0;
  const levelInfo = getLevelInfo(overallLevel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="h-6 w-6" />
            {t("report.reports")}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "عرض وتحميل تقارير التقييم"
              : "View and download assessment reports"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadExcel} disabled={!selectedAssessmentId}>
            <FileSpreadsheet className="me-2 h-4 w-4" />
            {t("report.exportExcel")}
          </Button>
        </div>
      </div>

      {/* Assessment Selector */}
      <Card>
        <CardHeader>
          <CardTitle>{t("report.selectAssessment")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder={t("report.selectAssessment")} />
            </SelectTrigger>
            <SelectContent>
              {assessments.map((assessment) => (
                <SelectItem key={assessment.id} value={assessment.id}>
                  {assessment.name || t(`assessment.${assessment.assessment_type}Assessment`)} -{" "}
                  {new Date(assessment.created_at).toLocaleDateString(locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loadingReport ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      ) : !selectedAssessmentId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileBarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">{t("report.selectAssessment")}</p>
            <p className="text-muted-foreground">
              {locale === "ar"
                ? "اختر تقييماً مكتملاً لعرض التقرير"
                : "Select a completed assessment to view the report"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Score */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("report.maturityScore")}</CardTitle>
                <CardDescription>
                  {locale === "ar" ? "مستوى النضج الإجمالي" : "Overall maturity level"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold ${
                      overallLevel >= 4
                        ? "bg-green-500"
                        : overallLevel >= 3
                        ? "bg-yellow-500"
                        : overallLevel >= 2
                        ? "bg-orange-500"
                        : "bg-red-500"
                    }`}
                  >
                    {maturityScore?.overall_score?.toFixed(1) || "0.0"}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {locale === "ar" ? levelInfo.name_ar : levelInfo.name_en}
                    </p>
                    <p className="text-muted-foreground">
                      {t("assessment.currentLevel")}: {overallLevel}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("report.complianceScore")}</CardTitle>
                <CardDescription>
                  {locale === "ar" ? "نسبة الامتثال للمواصفات" : "Specification compliance rate"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={`${(report?.compliance_score || 0) * 2.51} 251`}
                        className="text-primary"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">
                        {report?.compliance_score?.toFixed(0) || 0}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      {(report?.compliance_score || 0) >= 80 ? (
                        <span className="text-green-500 flex items-center gap-1">
                          <CheckCircle className="h-5 w-5" />
                          {locale === "ar" ? "ممتاز" : "Excellent"}
                        </span>
                      ) : (report?.compliance_score || 0) >= 50 ? (
                        <span className="text-yellow-500 flex items-center gap-1">
                          <TrendingUp className="h-5 w-5" />
                          {locale === "ar" ? "جيد" : "Good"}
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertTriangle className="h-5 w-5" />
                          {locale === "ar" ? "يحتاج تحسين" : "Needs Improvement"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Domain Scores */}
          <Card>
            <CardHeader>
              <CardTitle>{t("report.domainScores")}</CardTitle>
              <CardDescription>
                {locale === "ar" ? "درجات كل مجال" : "Scores by domain"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maturityScore?.domain_scores?.map((domain) => (
                  <div key={domain.domain_code} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {domain.domain_code} - {domain.domain_name}
                      </span>
                      <span className="text-muted-foreground">
                        {domain.score.toFixed(1)} / 5.0
                      </span>
                    </div>
                    <Progress value={domain.score * 20} />
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4">
                    {t("common.noResults")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gap Analysis */}
          {report?.gaps && report.gaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("report.gapAnalysis")}</CardTitle>
                <CardDescription>
                  {locale === "ar"
                    ? "الفجوات التي تحتاج معالجة"
                    : "Gaps that need to be addressed"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.gaps.slice(0, 10).map((gap: GapItem, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg border"
                    >
                      <div
                        className={`w-2 h-full min-h-[4rem] rounded-full ${
                          gap.priority === "high"
                            ? "bg-red-500"
                            : gap.priority === "medium"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {gap.question_code}: {gap.question}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {gap.domain_name}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              gap.priority === "high"
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                : gap.priority === "medium"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {t(`report.${gap.priority}`)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">
                            {t("assessment.currentLevel")}: {gap.current_level} →{" "}
                            {t("assessment.targetLevel")}: {gap.target_level}
                          </span>
                        </div>
                        {gap.actions_required && gap.actions_required.length > 0 && (
                          <ul className="mt-2 text-sm space-y-1">
                            {gap.actions_required.map((action, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
