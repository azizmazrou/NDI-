"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  FileBarChart,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn, getLevelColor } from "@/lib/utils";
import { assessmentsApi } from "@/lib/api";

interface Assessment {
  id: string;
  name: string;
  organization?: {
    name_en: string;
    name_ar: string;
  };
  status: string;
  current_score: number | null;
  target_level: number;
  progress_percentage: number;
  created_at: string;
}

interface DomainScore {
  code: string;
  name_en: string;
  name_ar: string;
  score: number;
  target: number;
  gap: number;
}

const MOCK_DOMAIN_SCORES: DomainScore[] = [
  { code: "DG", name_en: "Data Governance", name_ar: "حوكمة البيانات", score: 3.2, target: 4, gap: 0.8 },
  { code: "MCM", name_en: "Metadata and Data Catalog", name_ar: "البيانات الوصفية ودليل البيانات", score: 2.8, target: 4, gap: 1.2 },
  { code: "DQ", name_en: "Data Quality", name_ar: "جودة البيانات", score: 2.5, target: 4, gap: 1.5 },
  { code: "DO", name_en: "Data Operations", name_ar: "تخزين البيانات", score: 3.0, target: 4, gap: 1.0 },
  { code: "DCM", name_en: "Document and Content Management", name_ar: "إدارة المحتوى والوثائق", score: 2.3, target: 4, gap: 1.7 },
  { code: "DAM", name_en: "Data Architecture and Modelling", name_ar: "النمذجة وهيكلة البيانات", score: 3.5, target: 4, gap: 0.5 },
  { code: "DSI", name_en: "Data Sharing and Interoperability", name_ar: "تكامل البيانات ومشاركتها", score: 2.0, target: 4, gap: 2.0 },
  { code: "RMD", name_en: "Reference and Master Data", name_ar: "إدارة البيانات المرجعية والرئيسية", score: 2.5, target: 4, gap: 1.5 },
  { code: "BIA", name_en: "Business Intelligence and Analytics", name_ar: "ذكاء الأعمال والتحليلات", score: 3.2, target: 4, gap: 0.8 },
  { code: "DVR", name_en: "Data Value Realization", name_ar: "تحقيق القيمة من البيانات", score: 1.8, target: 4, gap: 2.2 },
  { code: "OD", name_en: "Open Data", name_ar: "البيانات المفتوحة", score: 2.8, target: 4, gap: 1.2 },
  { code: "FOI", name_en: "Freedom of Information", name_ar: "حرية المعلومات", score: 3.0, target: 4, gap: 1.0 },
  { code: "DC", name_en: "Data Classification", name_ar: "تصنيف البيانات", score: 2.5, target: 4, gap: 1.5 },
  { code: "PDP", name_en: "Personal Data Protection", name_ar: "حماية البيانات الشخصية", score: 2.2, target: 4, gap: 1.8 },
];

export default function ReportsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [domainScores, setDomainScores] = useState<DomainScore[]>(MOCK_DOMAIN_SCORES);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const response = await assessmentsApi.list({ page_size: 100 });
      setAssessments(response.items || []);
      if (response.items?.length > 0) {
        setSelectedAssessmentId(response.items[0].id);
      }
    } catch (error) {
      console.error("Failed to load assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);

  const overallScore =
    domainScores.reduce((sum, d) => sum + d.score, 0) / domainScores.length;

  const getGapColor = (gap: number) => {
    if (gap <= 0.5) return "text-green-600";
    if (gap <= 1) return "text-yellow-600";
    return "text-red-600";
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert(locale === "ar" ? "سيتم تصدير التقرير كـ PDF" : "Report will be exported as PDF");
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    alert(locale === "ar" ? "سيتم تصدير التقرير كـ Excel" : "Report will be exported as Excel");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="h-6 w-6" />
            {t("report.reports")}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "عرض وتصدير تقارير التقييم"
              : "View and export assessment reports"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="me-2 h-4 w-4" />
            {t("report.exportExcel")}
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="me-2 h-4 w-4" />
            {t("report.exportPdf")}
          </Button>
        </div>
      </div>

      {/* Assessment Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "اختر التقييم" : "Select Assessment"}</CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "اختر التقييم لعرض التقرير"
              : "Choose an assessment to view its report"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue
                placeholder={locale === "ar" ? "اختر التقييم..." : "Select assessment..."}
              />
            </SelectTrigger>
            <SelectContent>
              {assessments.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {locale === "ar" ? "لا توجد تقييمات" : "No assessments found"}
                </div>
              ) : (
                assessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
                    <div className="flex items-center gap-2">
                      <span>{assessment.name}</span>
                      <span className="text-xs text-muted-foreground">
                        (
                        {locale === "ar"
                          ? assessment.organization?.name_ar
                          : assessment.organization?.name_en}
                        )
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedAssessment && (
        <>
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("report.overallScore")}
                    </p>
                    <p
                      className={cn(
                        "text-3xl font-bold mt-1",
                        getLevelColor(Math.floor(overallScore))
                      )}
                    >
                      {overallScore.toFixed(1)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center",
                      getLevelColor(Math.floor(overallScore))
                    )}
                  >
                    {overallScore >= 3 ? (
                      <TrendingUp className="h-6 w-6" />
                    ) : overallScore >= 2 ? (
                      <Minus className="h-6 w-6" />
                    ) : (
                      <TrendingDown className="h-6 w-6" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {t("assessment.targetLevel")}
                </p>
                <p className="text-3xl font-bold mt-1">
                  {selectedAssessment.target_level}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {t("assessment.progress")}
                </p>
                <p className="text-3xl font-bold mt-1">
                  {selectedAssessment.progress_percentage.toFixed(0)}%
                </p>
                <Progress value={selectedAssessment.progress_percentage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{t("common.status")}</p>
                <p
                  className={cn(
                    "text-lg font-medium mt-1 px-2 py-1 rounded inline-block",
                    selectedAssessment.status === "completed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                      : selectedAssessment.status === "in_progress"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-900/30"
                  )}
                >
                  {t(`status.${selectedAssessment.status}`)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Domain Scores */}
          <Card>
            <CardHeader>
              <CardTitle>{t("report.domainScores")}</CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "درجات كل مجال مع تحليل الفجوات"
                  : "Scores for each domain with gap analysis"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {domainScores.map((domain) => (
                  <div key={domain.code} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                          {domain.code}
                        </span>
                        <span className="font-medium">
                          {locale === "ar" ? domain.name_ar : domain.name_en}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn("font-medium", getLevelColor(Math.floor(domain.score)))}>
                          {domain.score.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-muted-foreground">{domain.target}</span>
                        <span className={cn("text-sm font-medium", getGapColor(domain.gap))}>
                          {domain.gap > 0 ? `-${domain.gap.toFixed(1)}` : "0"}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full transition-all",
                          domain.score >= 4
                            ? "bg-green-500"
                            : domain.score >= 3
                            ? "bg-yellow-500"
                            : domain.score >= 2
                            ? "bg-orange-500"
                            : "bg-red-500"
                        )}
                        style={{ width: `${(domain.score / 5) * 100}%` }}
                      />
                      <div
                        className="absolute inset-y-0 w-0.5 bg-primary"
                        style={{ left: `${(domain.target / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gap Analysis Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  {t("report.criticalActions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {domainScores
                    .filter((d) => d.gap >= 1.5)
                    .map((domain) => (
                      <li
                        key={domain.code}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="font-medium px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 text-xs">
                          {domain.code}
                        </span>
                        <span>
                          {locale === "ar" ? domain.name_ar : domain.name_en}
                        </span>
                        <span className="text-red-600 ms-auto">
                          {locale === "ar" ? "فجوة" : "Gap"}: {domain.gap.toFixed(1)}
                        </span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  {t("report.quickWins")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {domainScores
                    .filter((d) => d.gap <= 0.5 && d.gap > 0)
                    .map((domain) => (
                      <li
                        key={domain.code}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="font-medium px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 text-xs">
                          {domain.code}
                        </span>
                        <span>
                          {locale === "ar" ? domain.name_ar : domain.name_en}
                        </span>
                        <span className="text-green-600 ms-auto">
                          {locale === "ar" ? "قريب من الهدف" : "Near target"}
                        </span>
                      </li>
                    ))}
                  {domainScores.filter((d) => d.gap <= 0.5 && d.gap > 0).length === 0 && (
                    <li className="text-sm text-muted-foreground">
                      {locale === "ar"
                        ? "لا توجد مجالات قريبة من الهدف"
                        : "No domains near target"}
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!selectedAssessment && assessments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileBarChart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {locale === "ar"
                ? "لا توجد تقييمات لعرض التقارير"
                : "No assessments available for reports"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
