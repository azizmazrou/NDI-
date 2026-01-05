"use client";

import { useCallback, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Download,
  FileBarChart,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Loader2,
  BarChart3,
  Lightbulb,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageLoading } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { useApi } from "@/lib/hooks/use-api";
import { assessmentsApi, aiApi } from "@/lib/api";
import { cn, getLevelColor } from "@/lib/utils";

interface GapItem {
  domain_code: string;
  domain_name: string;
  question_code: string;
  question: string;
  current_level: number;
  target_level: number;
  gap: number;
  priority: string;
  recommendation: string;
}

interface GapAnalysisResult {
  status: string;
  assessment_id: string;
  target_level: number;
  total_gaps: number;
  high_priority_gaps: number;
  gaps: GapItem[];
}

interface Recommendation {
  priority: string;
  domain_code?: string;
  title: string;
  description: string;
  expected_impact: string;
  effort_level: string;
  steps?: string[];
}

interface RecommendationsResult {
  status: string;
  total_recommendations: number;
  recommendations: Recommendation[];
}

export default function AssessmentReportPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  // State for AI features
  const [loadingGapAnalysis, setLoadingGapAnalysis] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResult | null>(null);
  const [gapError, setGapError] = useState<string | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [expandedGaps, setExpandedGaps] = useState<Set<string>>(new Set());

  // Fetch report
  const fetchReport = useCallback(() => assessmentsApi.getReport(params.id), [params.id]);
  const { data: report, loading, error, refetch } = useApi(fetchReport, [params.id]);

  const handleGapAnalysis = async () => {
    setLoadingGapAnalysis(true);
    setGapError(null);

    try {
      const result = await aiApi.gapAnalysis({
        assessment_id: params.id,
        target_level: report?.target_level,
        language: locale,
      });

      if (result.status === "success") {
        setGapAnalysis(result);
      } else {
        setGapError(result.message || (locale === "ar" ? "فشل في التحليل" : "Analysis failed"));
      }
    } catch (error: any) {
      setGapError(error.message || (locale === "ar" ? "فشل في الاتصال بالخدمة" : "Failed to connect"));
    } finally {
      setLoadingGapAnalysis(false);
    }
  };

  const handleGetRecommendations = async () => {
    setLoadingRecommendations(true);
    setRecError(null);

    try {
      const result = await aiApi.getRecommendations({
        assessment_id: params.id,
        language: locale,
      });

      if (result.status === "success") {
        setRecommendations(result);
      } else {
        setRecError(result.message || (locale === "ar" ? "فشل في الحصول على التوصيات" : "Failed to get recommendations"));
      }
    } catch (error: any) {
      setRecError(error.message || (locale === "ar" ? "فشل في الاتصال بالخدمة" : "Failed to connect"));
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const toggleGapExpanded = (code: string) => {
    setExpandedGaps((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  if (loading) {
    return <PageLoading text={locale === "ar" ? "جاري إنشاء التقرير..." : "Generating report..."} />;
  }

  if (error || !report) {
    return <ErrorState message={error || "Report not found"} onRetry={refetch} />;
  }

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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const gapToTarget = Math.max(0, report.target_level - (report.overall_score || 0));
  const meetsTarget = (report.overall_score || 0) >= report.target_level;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href={`/${locale}/dashboard/assessments`} className="hover:text-foreground">
              {t("assessment.assessments")}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/dashboard/assessments/${params.id}`} className="hover:text-foreground">
              {report.assessment_name}
            </Link>
            <span>/</span>
            <span>{locale === "ar" ? "التقرير" : "Report"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="h-6 w-6" />
            {locale === "ar" ? "تقرير التقييم" : "Assessment Report"}
          </h1>
        </div>

        <Button onClick={() => window.print()}>
          <Download className="h-4 w-4 me-2" />
          {locale === "ar" ? "تحميل PDF" : "Download PDF"}
        </Button>
      </div>

      {/* Report Header Card */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="text-center border-b">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-xl ndi-gradient flex items-center justify-center">
              <span className="text-white font-bold text-2xl">NDI</span>
            </div>
          </div>
          <CardTitle className="text-2xl">{report.assessment_name}</CardTitle>
          <CardDescription className="text-lg">
            {locale === "ar" ? report.organization?.name_ar : report.organization?.name_en}
          </CardDescription>
          <p className="text-sm text-muted-foreground mt-2">
            {locale === "ar" ? "تاريخ التقرير:" : "Report Date:"}{" "}
            {new Date().toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Overall Score */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">
                {locale === "ar" ? "الدرجة الإجمالية" : "Overall Score"}
              </p>
              <div
                className={cn(
                  "text-4xl font-bold px-4 py-2 rounded-lg inline-block",
                  getLevelColor(Math.floor(report.overall_score || 0))
                )}
              >
                {report.overall_score?.toFixed(1) || "-"}
              </div>
              <p className="text-sm mt-2">
                {getLevelName(Math.floor(report.overall_score || 0))}
              </p>
            </div>

            {/* Target Level */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">
                {t("assessment.targetLevel")}
              </p>
              <div className="text-4xl font-bold">{report.target_level}</div>
              <p className="text-sm mt-2">{getLevelName(report.target_level)}</p>
            </div>

            {/* Status */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">
                {locale === "ar" ? "حالة الهدف" : "Target Status"}
              </p>
              <div className="flex justify-center">
                {meetsTarget ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-8 w-8" />
                    <span className="text-lg font-semibold">
                      {locale === "ar" ? "تم تحقيقه" : "Achieved"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <TrendingUp className="h-8 w-8" />
                    <span className="text-lg font-semibold">
                      {locale === "ar" ? `فجوة: ${gapToTarget.toFixed(1)}` : `Gap: ${gapToTarget.toFixed(1)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Scores */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "درجات المجالات" : "Domain Scores"}</CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "تحليل تفصيلي لكل مجال من مجالات مؤشر البيانات الوطني"
              : "Detailed analysis for each NDI domain"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(report.domain_scores || []).map((domain: any) => (
              <div key={domain.code} className="flex items-center gap-4">
                <div className="w-16 text-center">
                  <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                    {domain.code}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      {locale === "ar" ? domain.name_ar : domain.name_en}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold px-2 py-0.5 rounded",
                        getLevelColor(Math.floor(domain.score || 0))
                      )}
                    >
                      {domain.score?.toFixed(1) || "-"}
                    </span>
                  </div>
                  <Progress value={((domain.score || 0) / 5) * 100} className="h-2" />
                </div>
                <div className="w-20 text-end text-sm text-muted-foreground">
                  {domain.answered_questions}/{domain.total_questions}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Gap Analysis */}
      <Card className="print:break-before-page">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                {locale === "ar" ? "تحليل الفجوات بالذكاء الاصطناعي" : "AI Gap Analysis"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "تحليل مفصل للفجوات بين المستوى الحالي والمستهدف"
                  : "Detailed analysis of gaps between current and target levels"}
              </CardDescription>
            </div>
            {!gapAnalysis && (
              <Button
                onClick={handleGapAnalysis}
                disabled={loadingGapAnalysis}
                className="print:hidden"
              >
                {loadingGapAnalysis ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <Sparkles className="h-4 w-4 me-2" />
                )}
                {locale === "ar" ? "تحليل الفجوات" : "Analyze Gaps"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingGapAnalysis && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ms-2">{locale === "ar" ? "جاري التحليل..." : "Analyzing..."}</span>
            </div>
          )}

          {gapError && (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">
              <AlertCircle className="h-5 w-5 inline me-2" />
              {gapError}
            </div>
          )}

          {gapAnalysis && gapAnalysis.gaps?.length > 0 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold">{gapAnalysis.total_gaps}</p>
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar" ? "إجمالي الفجوات" : "Total Gaps"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{gapAnalysis.high_priority_gaps}</p>
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar" ? "أولوية عالية" : "High Priority"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{gapAnalysis.target_level}</p>
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar" ? "المستوى المستهدف" : "Target Level"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {gapAnalysis.gaps.filter((g) => g.gap <= 0).length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar" ? "تم تحقيقه" : "Achieved"}
                  </p>
                </div>
              </div>

              {/* Gap items */}
              <div className="space-y-2">
                {gapAnalysis.gaps.map((gap, idx) => (
                  <div
                    key={`${gap.question_code}-${idx}`}
                    className="border rounded-lg overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      onClick={() => toggleGapExpanded(gap.question_code)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                          {gap.question_code}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded border",
                          getPriorityColor(gap.priority)
                        )}>
                          {gap.priority}
                        </span>
                        <span className="text-sm font-medium">
                          {locale === "ar" ? gap.domain_name : gap.domain_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm">
                          <span className={cn("font-bold", getLevelColor(gap.current_level))}>
                            {gap.current_level}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-bold text-primary">{gap.target_level}</span>
                        </div>
                        {expandedGaps.has(gap.question_code) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                    {expandedGaps.has(gap.question_code) && (
                      <div className="p-4 bg-muted/20 border-t space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-1">
                            {locale === "ar" ? "السؤال" : "Question"}
                          </h4>
                          <p className="text-sm text-muted-foreground">{gap.question}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                            {locale === "ar" ? "التوصية" : "Recommendation"}
                          </h4>
                          <p className="text-sm">{gap.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {gapAnalysis && (!gapAnalysis.gaps || gapAnalysis.gaps.length === 0) && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-green-600">
                {locale === "ar" ? "لا توجد فجوات!" : "No gaps found!"}
              </p>
              <p className="text-sm text-muted-foreground">
                {locale === "ar"
                  ? "التقييم يلبي المستوى المستهدف"
                  : "Assessment meets the target level"}
              </p>
            </div>
          )}

          {!gapAnalysis && !loadingGapAnalysis && !gapError && (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {locale === "ar"
                  ? "انقر على 'تحليل الفجوات' لبدء التحليل بالذكاء الاصطناعي"
                  : "Click 'Analyze Gaps' to start AI analysis"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                {locale === "ar" ? "التوصيات الذكية" : "AI Recommendations"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "الإجراءات المقترحة لتحسين مستوى النضج"
                  : "Suggested actions to improve maturity level"}
              </CardDescription>
            </div>
            {!recommendations && (
              <Button
                onClick={handleGetRecommendations}
                disabled={loadingRecommendations}
                className="print:hidden"
              >
                {loadingRecommendations ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <Sparkles className="h-4 w-4 me-2" />
                )}
                {locale === "ar" ? "احصل على توصيات" : "Get Recommendations"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingRecommendations && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ms-2">{locale === "ar" ? "جاري التحليل..." : "Analyzing..."}</span>
            </div>
          )}

          {recError && (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">
              <AlertCircle className="h-5 w-5 inline me-2" />
              {recError}
            </div>
          )}

          {recommendations && recommendations.recommendations?.length > 0 && (
            <div className="space-y-4">
              {recommendations.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium">{rec.title}</h4>
                        {rec.domain_code && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            {rec.domain_code}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded border",
                      getPriorityColor(rec.priority)
                    )}>
                      {rec.priority}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">{rec.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        {locale === "ar" ? "التأثير المتوقع:" : "Expected Impact:"}
                      </span>
                      <span className="ms-1 font-medium">{rec.expected_impact}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {locale === "ar" ? "مستوى الجهد:" : "Effort Level:"}
                      </span>
                      <span className="ms-1 font-medium">{rec.effort_level}</span>
                    </div>
                  </div>

                  {rec.steps && rec.steps.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">
                        {locale === "ar" ? "الخطوات:" : "Steps:"}
                      </h5>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        {rec.steps.map((step, sidx) => (
                          <li key={sidx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Fallback to report recommendations */}
          {!recommendations && !loadingRecommendations && !recError && report.recommendations?.length > 0 && (
            <ul className="space-y-3">
              {report.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          )}

          {!recommendations && !loadingRecommendations && !recError && !report.recommendations?.length && (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {locale === "ar"
                  ? "انقر على 'احصل على توصيات' للحصول على توصيات مخصصة بالذكاء الاصطناعي"
                  : "Click 'Get Recommendations' to get AI-powered personalized recommendations"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-center print:hidden">
        <Link href={`/${locale}/dashboard/assessments/${params.id}`}>
          <Button variant="ghost">
            {locale === "ar" ? <ArrowRight className="h-4 w-4 me-2" /> : <ArrowLeft className="h-4 w-4 me-2" />}
            {locale === "ar" ? "العودة للتقييم" : "Back to Assessment"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
