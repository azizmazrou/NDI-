"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Building2 } from "lucide-react";
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
import { MATURITY_LEVELS } from "@/lib/constants";

export default function NewAssessmentPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const [formData, setFormData] = useState({
    organizationId: "",
    assessmentType: "maturity",
    name: "",
    targetLevel: "3",
  });

  // Mock organizations - replace with API call
  const organizations = [
    { id: "1", name_ar: "وزارة المالية", name_en: "Ministry of Finance" },
    { id: "2", name_ar: "وزارة الصحة", name_en: "Ministry of Health" },
    { id: "3", name_ar: "وزارة التعليم", name_en: "Ministry of Education" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call API to create assessment
    console.log("Creating assessment:", formData);
    router.push(`/${locale}/assessments/1`); // Redirect to assessment detail
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
              <Select
                value={formData.organizationId}
                onValueChange={(value) =>
                  setFormData({ ...formData, organizationId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("assessment.selectOrganization")} />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {locale === "ar" ? org.name_ar : org.name_en}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assessment Type */}
            <div className="space-y-2">
              <Label htmlFor="type">{t("assessment.selectType")}</Label>
              <Select
                value={formData.assessmentType}
                onValueChange={(value) =>
                  setFormData({ ...formData, assessmentType: value })
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
              <Label htmlFor="name">{t("common.name")}</Label>
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
              />
            </div>

            {/* Target Level */}
            <div className="space-y-2">
              <Label htmlFor="targetLevel">{t("assessment.targetLevel")}</Label>
              <Select
                value={formData.targetLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, targetLevel: value })
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
          <Button type="submit" disabled={!formData.organizationId}>
            {t("common.create")}
            <Arrow className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
