"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Plus, Search, Building2, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useApi, useMutation } from "@/lib/hooks/use-api";
import { organizationsApi } from "@/lib/api";

interface Organization {
  id: string;
  name_en: string;
  name_ar: string;
  sector?: string;
  description_en?: string;
  description_ar?: string;
  website?: string;
  created_at: string;
}

export default function OrganizationsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchOrganizations = useCallback(
    () => organizationsApi.list({ search: search || undefined }),
    [search]
  );

  const { data, loading, error, refetch } = useApi<{
    items: Organization[];
    total: number;
  }>(fetchOrganizations, [search]);

  const deleteMutation = useMutation((id: string) => organizationsApi.delete(id));

  const handleDelete = async (id: string) => {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من حذف هذه الجهة؟" : "Are you sure you want to delete this organization?")) {
      return;
    }
    try {
      await deleteMutation.mutate(id);
      refetch();
    } catch (err) {
      console.error("Failed to delete organization:", err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  if (loading) {
    return <PageLoading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={refetch}
      />
    );
  }

  const organizations = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("organization.organizations")}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "إدارة الجهات الحكومية المسجلة في النظام"
              : "Manage government entities registered in the system"}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/organizations/new`}>
          <Button>
            <Plus className="me-2 h-4 w-4" />
            {locale === "ar" ? "إضافة جهة" : "Add Organization"}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                className="ps-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">
              {t("common.search")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Organizations List */}
      {organizations.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Building2}
              title={locale === "ar" ? "لا توجد جهات" : "No Organizations"}
              description={
                locale === "ar"
                  ? "لم يتم إضافة أي جهات حكومية بعد"
                  : "No government entities have been added yet"
              }
              action={{
                label: locale === "ar" ? "إضافة جهة" : "Add Organization",
                onClick: () => window.location.href = `/${locale}/dashboard/organizations/new`,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className="ndi-card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {locale === "ar" ? org.name_ar : org.name_en}
                      </CardTitle>
                      {org.sector && (
                        <p className="text-xs text-muted-foreground">{org.sector}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {locale === "ar"
                    ? org.description_ar || "لا يوجد وصف"
                    : org.description_en || "No description"}
                </p>
                <div className="flex items-center justify-between">
                  {org.website && (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {locale === "ar" ? "الموقع" : "Website"}
                    </a>
                  )}
                  <div className="flex gap-1 ms-auto">
                    <Link href={`/${locale}/dashboard/organizations/${org.id}/edit`}>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(org.id)}
                      disabled={deleteMutation.loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {data && data.total > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {locale === "ar"
            ? `إجمالي ${data.total} جهة`
            : `Total: ${data.total} organizations`}
        </p>
      )}
    </div>
  );
}
