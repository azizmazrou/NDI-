"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoading } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { useApi, useMutation } from "@/lib/hooks/use-api";
import { organizationsApi, assessmentsApi } from "@/lib/api";
import { MATURITY_LEVELS } from "@/lib/constants";

export default function NewAssessmentPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const [formData, setFormData] = useState({
    organization_id: "",
    assessment_type: "maturity",
    name: "",
    description: "",
    target_level: 3,
  });

  // Fetch organizations
  const fetchOrganizations = useCallback(() => organizationsApi.list({ page_size: 100 }), []);
  const { data: orgsData, loading: loadingOrgs, error: orgsError, refetch } = useApi(fetchOrganizations, []);

  // Create mutation
  const createMutation = useMutation((data: typeof formData) => assessmentsApi.create(data));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createMutation.mutate(formData);
      router.push(`/${locale}/dashboard/assessments/${result.id}`);
    } catch (err) {
      console.error("Failed to create assessment:", err);
    }
  };

  if (loadingOrgs) {
    return <PageLoading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />;
  }

  if (orgsError) {
    return <ErrorState message={orgsError} onRetry={refetch} />;
  }

  const organizations = orgsData?.items || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/${locale}/dashboard/assessments`} className="hover:text-foreground">
          {t("assessment.assessments")}
        </Link>
        <span>/</span>
        <span>{t("assessment.newAssessment")}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("assessment.newAssessment")}
        </h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "إنشاء تقييم جديد لمؤشر البيانات الوطني"
            : "Create a new NDI assessment"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t("assessment.selectOrganization")}</CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "اختر الجهة التي سيتم تقييمها"
                : "Select the organization to assess"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Organization */}
            <div className="space-y-2">
              <Label htmlFor="organization">{t("organization.title")}</Label>
              {organizations.length === 0 ? (
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    {locale === "ar"
                      ? "لا توجد جهات مسجلة. قم بإضافة جهة أولاً."
                      : "No organizations found. Add one first."}
                  </p>
                  <Link href={`/${locale}/dashboard/organizations/new`}>
                    <Button variant="outline" size="sm">
                      <Building2 className="h-4 w-4 me-2" />
                      {locale === "ar" ? "إضافة جهة" : "Add Organization"}
                    </Button>
                  </Link>
                </div>
              ) : (
                <Select
                  value={formData.organization_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, organization_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("assessment.selectOrganization")} />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org: any) => (
                      <SelectItem key={org.id} value={org.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {locale === "ar" ? org.name_ar : org.name_en}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Assessment Type */}
            <div className="space-y-2">
              <Label htmlFor="type">{t("assessment.selectType")}</Label>
              <Select
                value={formData.assessment_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, assessment_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maturity">
                    {t("assessment.maturityAssessment")}
                  </SelectItem>
                  <SelectItem value="compliance">
                    {t("assessment.complianceAssessment")}
                  </SelectItem>
                  <SelectItem value="oe">
                    {t("assessment.operationalExcellence")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assessment Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.name")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={
                  locale === "ar"
                    ? "مثال: تقييم Q4 2024"
                    : "e.g., Q4 2024 Assessment"
                }
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{locale === "ar" ? "الوصف" : "Description"}</Label>
              <textarea
                id="description"
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={
                  locale === "ar"
                    ? "وصف موجز للتقييم..."
                    : "Brief description of the assessment..."
                }
              />
            </div>

            {/* Target Level */}
            <div className="space-y-2">
              <Label htmlFor="targetLevel">{t("assessment.targetLevel")}</Label>
              <Select
                value={String(formData.target_level)}
                onValueChange={(value) =>
                  setFormData({ ...formData, target_level: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATURITY_LEVELS.filter((l) => l.level > 0).map((level) => (
                    <SelectItem key={level.level} value={String(level.level)}>
                      {level.level} - {locale === "ar" ? level.name_ar : level.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error */}
            {createMutation.error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {createMutation.error}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={createMutation.loading || !formData.organization_id || !formData.name}
          >
            {createMutation.loading ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : null}
            {t("common.create")}
            <Arrow className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
