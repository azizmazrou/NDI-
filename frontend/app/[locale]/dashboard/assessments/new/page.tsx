"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assessmentsApi } from "@/lib/api";
import { MATURITY_LEVELS } from "@/types/ndi";

export default function NewAssessmentPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const [formData, setFormData] = useState({
    assessment_type: "maturity",
    name: "",
    description: "",
    target_level: "3",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const assessment = await assessmentsApi.create({
        assessment_type: formData.assessment_type,
        name: formData.name || undefined,
        description: formData.description || undefined,
        target_level: parseInt(formData.target_level),
      });
      router.push(`/${locale}/dashboard/assessments/${assessment.id}`);
    } catch (err: any) {
      console.error("Failed to create assessment:", err);
      setError(err.message || (locale === "ar" ? "فشل في إنشاء التقييم" : "Failed to create assessment"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
            <CardTitle>{t("assessment.selectType")}</CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "حدد نوع التقييم الذي تريد إجراءه"
                : "Select the type of assessment you want to perform"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm dark:bg-red-900 dark:text-red-300">
                {error}
              </div>
            )}

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
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {formData.assessment_type === "maturity"
                  ? locale === "ar"
                    ? "تقييم مستوى نضج إدارة البيانات في الجهة"
                    : "Evaluate the data management maturity level"
                  : locale === "ar"
                  ? "تقييم مدى الامتثال للمواصفات والمعايير"
                  : "Evaluate compliance with specifications and standards"}
              </p>
            </div>

            {/* Assessment Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={
                  locale === "ar"
                    ? "مثال: تقييم Q1 2025"
                    : "e.g., Q1 2025 Assessment"
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t("common.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={
                  locale === "ar"
                    ? "وصف اختياري للتقييم..."
                    : "Optional description for the assessment..."
                }
                rows={3}
              />
            </div>

            {/* Target Level */}
            <div className="space-y-2">
              <Label htmlFor="targetLevel">{t("assessment.targetLevel")}</Label>
              <Select
                value={formData.target_level}
                onValueChange={(value) =>
                  setFormData({ ...formData, target_level: value })
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
              <p className="text-sm text-muted-foreground">
                {locale === "ar"
                  ? "المستوى الذي تهدف الجهة للوصول إليه"
                  : "The level the organization aims to achieve"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t("common.loading") : t("common.create")}
            {!loading && <Arrow className="ms-2 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
