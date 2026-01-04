"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  BookOpen,
  Search,
  FileText,
  ChevronRight,
  ChevronLeft,
  Download,
  ExternalLink,
  Home,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ndiApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Domain {
  code: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  question_count?: number;
}

export default function KnowledgeBasePage() {
  const locale = useLocale();
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    try {
      const data = await ndiApi.getDomains();
      setDomains(data.items || []);
    } catch (error) {
      console.error("Failed to load domains:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredDomains = domains.filter((domain) => {
    if (!searchQuery) return true;
    const name = locale === "ar" ? domain.name_ar : domain.name_en;
    const desc = locale === "ar" ? domain.description_ar : domain.description_en;
    return (
      name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domain.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const resources = [
    {
      title: locale === "ar" ? "دليل مؤشر البيانات الوطني" : "NDI Framework Guide",
      description: locale === "ar"
        ? "الدليل الرسمي لإطار عمل مؤشر البيانات الوطني"
        : "Official guide to the National Data Index framework",
      type: "PDF",
      url: "#",
    },
    {
      title: locale === "ar" ? "معايير تقييم النضج" : "Maturity Assessment Criteria",
      description: locale === "ar"
        ? "المعايير التفصيلية لكل مستوى من مستويات النضج"
        : "Detailed criteria for each maturity level",
      type: "PDF",
      url: "#",
    },
    {
      title: locale === "ar" ? "قائمة الأدلة المطلوبة" : "Required Evidence Checklist",
      description: locale === "ar"
        ? "قائمة شاملة بالأدلة المطلوبة لكل مستوى"
        : "Comprehensive list of evidence required for each level",
      type: "Excel",
      url: "#",
    },
    {
      title: locale === "ar" ? "أفضل الممارسات" : "Best Practices Guide",
      description: locale === "ar"
        ? "دليل أفضل الممارسات لإدارة البيانات"
        : "Best practices guide for data management",
      type: "PDF",
      url: "#",
    },
  ];

  const maturityLevels = [
    {
      level: 0,
      name_en: "Absence of Capabilities",
      name_ar: "غياب القدرات",
      description_en: "No data management capabilities exist",
      description_ar: "لا توجد قدرات لإدارة البيانات",
      color: "bg-gray-500",
    },
    {
      level: 1,
      name_en: "Establishing",
      name_ar: "التأسيس",
      description_en: "Initial awareness and ad-hoc processes",
      description_ar: "وعي أولي وعمليات غير منظمة",
      color: "bg-red-500",
    },
    {
      level: 2,
      name_en: "Defined",
      name_ar: "التحديد",
      description_en: "Documented policies and defined processes",
      description_ar: "سياسات موثقة وعمليات محددة",
      color: "bg-orange-500",
    },
    {
      level: 3,
      name_en: "Activated",
      name_ar: "التفعيل",
      description_en: "Processes are implemented and active",
      description_ar: "العمليات مطبقة ومفعلة",
      color: "bg-yellow-500",
    },
    {
      level: 4,
      name_en: "Managed",
      name_ar: "الإدارة",
      description_en: "Processes are measured and controlled",
      description_ar: "العمليات مقاسة ومضبوطة",
      color: "bg-green-500",
    },
    {
      level: 5,
      name_en: "Pioneer",
      name_ar: "الريادة",
      description_en: "Continuous optimization and innovation",
      description_ar: "تحسين مستمر وابتكار",
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}`}>
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">
                {locale === "ar" ? "قاعدة المعرفة" : "Knowledge Base"}
              </span>
            </div>
          </div>
          <Link href={`/${locale}/dashboard`}>
            <Button>
              {locale === "ar" ? "لوحة التحكم" : "Dashboard"}
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={locale === "ar" ? "ابحث في قاعدة المعرفة..." : "Search knowledge base..."}
              className="ps-12 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* NDI Domains */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {locale === "ar" ? "مجالات مؤشر البيانات الوطني (14 مجال)" : "NDI Domains (14 Domains)"}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                {locale === "ar" ? "جاري التحميل..." : "Loading..."}
              </p>
            ) : filteredDomains.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                {locale === "ar" ? "لا توجد نتائج" : "No results found"}
              </p>
            ) : (
              filteredDomains.map((domain) => (
                <Card
                  key={domain.code}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedDomain(domain)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                        {domain.code}
                      </span>
                      <Chevron className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base mt-2">
                      {locale === "ar" ? domain.name_ar : domain.name_en}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {locale === "ar" ? domain.description_ar : domain.description_en}
                    </p>
                    {domain.question_count && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {domain.question_count} {locale === "ar" ? "أسئلة" : "questions"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Maturity Levels */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {locale === "ar" ? "مستويات النضج" : "Maturity Levels"}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maturityLevels.map((level) => (
              <Card key={level.level}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold", level.color)}>
                      {level.level}
                    </div>
                    <CardTitle className="text-lg">
                      {locale === "ar" ? level.name_ar : level.name_en}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {locale === "ar" ? level.description_ar : level.description_en}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section>
          <h2 className="text-2xl font-bold mb-6">
            {locale === "ar" ? "الموارد والأدلة" : "Resources & Guides"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {resources.map((resource, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {resource.description}
                      </p>
                      <span className="text-xs px-2 py-1 rounded bg-muted">
                        {resource.type}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
