"use client";

import { useState, useEffect, useCallback } from "react";
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
import { organizationsApi } from "@/lib/api";

const SECTORS = [
  { value: "finance", label_en: "Finance", label_ar: "المالية" },
  { value: "health", label_en: "Health", label_ar: "الصحة" },
  { value: "education", label_en: "Education", label_ar: "التعليم" },
  { value: "technology", label_en: "Technology", label_ar: "التقنية" },
  { value: "energy", label_en: "Energy", label_ar: "الطاقة" },
  { value: "transportation", label_en: "Transportation", label_ar: "النقل" },
  { value: "other", label_en: "Other", label_ar: "أخرى" },
];

export default function EditOrganizationPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const fetchOrg = useCallback(() => organizationsApi.get(params.id), [params.id]);
  const { data: org, loading, error, refetch } = useApi(fetchOrg, [params.id]);

  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    sector: "",
    description_en: "",
    description_ar: "",
    website: "",
  });

  useEffect(() => {
    if (org) {
      setFormData({
        name_en: org.name_en || "",
        name_ar: org.name_ar || "",
        sector: org.sector || "",
        description_en: org.description_en || "",
        description_ar: org.description_ar || "",
        website: org.website || "",
      });
    }
  }, [org]);

  const updateMutation = useMutation((data: typeof formData) =>
    organizationsApi.update(params.id, data)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutate(formData);
      router.push(`/${locale}/dashboard/organizations`);
    } catch (err) {
      console.error("Failed to update organization:", err);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/${locale}/dashboard/organizations`} className="hover:text-foreground">
          {t("organization.organizations")}
        </Link>
        <span>/</span>
        <span>{locale === "ar" ? "تعديل الجهة" : "Edit Organization"}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {locale === "ar" ? "تعديل الجهة" : "Edit Organization"}
        </h1>
        <p className="text-muted-foreground">
          {locale === "ar" ? org?.name_ar : org?.name_en}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {locale === "ar" ? "معلومات الجهة" : "Organization Information"}
            </CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "قم بتعديل المعلومات الأساسية للجهة"
                : "Update the basic information for the organization"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* English Name */}
            <div className="space-y-2">
              <Label htmlFor="name_en">
                {locale === "ar" ? "الاسم بالإنجليزية" : "English Name"} *
              </Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => handleChange("name_en", e.target.value)}
                required
              />
            </div>

            {/* Arabic Name */}
            <div className="space-y-2">
              <Label htmlFor="name_ar">
                {locale === "ar" ? "الاسم بالعربية" : "Arabic Name"} *
              </Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) => handleChange("name_ar", e.target.value)}
                dir="rtl"
                required
              />
            </div>

            {/* Sector */}
            <div className="space-y-2">
              <Label htmlFor="sector">{locale === "ar" ? "القطاع" : "Sector"}</Label>
              <Select
                value={formData.sector}
                onValueChange={(value) => handleChange("sector", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={locale === "ar" ? "اختر القطاع" : "Select sector"} />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {locale === "ar" ? sector.label_ar : sector.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* English Description */}
            <div className="space-y-2">
              <Label htmlFor="description_en">
                {locale === "ar" ? "الوصف بالإنجليزية" : "English Description"}
              </Label>
              <textarea
                id="description_en"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.description_en}
                onChange={(e) => handleChange("description_en", e.target.value)}
              />
            </div>

            {/* Arabic Description */}
            <div className="space-y-2">
              <Label htmlFor="description_ar">
                {locale === "ar" ? "الوصف بالعربية" : "Arabic Description"}
              </Label>
              <textarea
                id="description_ar"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.description_ar}
                onChange={(e) => handleChange("description_ar", e.target.value)}
                dir="rtl"
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">{locale === "ar" ? "الموقع الإلكتروني" : "Website"}</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
              />
            </div>

            {/* Error */}
            {updateMutation.error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {updateMutation.error}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.loading || !formData.name_en || !formData.name_ar}
          >
            {updateMutation.loading ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : null}
            {locale === "ar" ? "حفظ التغييرات" : "Save Changes"}
            <Arrow className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
