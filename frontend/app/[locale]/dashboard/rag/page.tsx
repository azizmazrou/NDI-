"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import {
  Database,
  RefreshCw,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  HelpCircle,
  MessageSquare,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/ui/loading";
import { aiApi } from "@/lib/api";

interface RagStatus {
  status: string;
  total_documents: number;
  by_type: Record<string, number>;
  has_vectors: boolean;
  message: string;
}

interface SearchResult {
  type: string;
  id: string;
  content: string;
  code?: string;
  similarity?: number;
}

export default function RagPage() {
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [ragStatus, setRagStatus] = useState<RagStatus | null>(null);
  const [reindexing, setReindexing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchContext, setSearchContext] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await aiApi.getRagStatus();
      setRagStatus(status);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch RAG status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleReindex = async () => {
    setReindexing(true);
    setError(null);

    try {
      const result = await aiApi.reindexRag();
      if (result.status === "success") {
        await fetchStatus();
      } else {
        setError(result.message || "Reindexing failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reindex");
    } finally {
      setReindexing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const result = await aiApi.searchRag(searchQuery, locale, 10);
      if (result.status === "success") {
        setSearchResults(result.results || []);
        setSearchContext(result.context || "");
      } else {
        setError("Search failed");
      }
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "domain":
        return <Layers className="h-4 w-4" />;
      case "question":
        return <HelpCircle className="h-4 w-4" />;
      case "level":
        return <Database className="h-4 w-4" />;
      case "specification":
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      domain: { en: "Domain", ar: "المجال" },
      question: { en: "Question", ar: "السؤال" },
      level: { en: "Maturity Level", ar: "مستوى النضج" },
      specification: { en: "Specification", ar: "المواصفة" },
    };
    return locale === "ar" ? labels[type]?.ar || type : labels[type]?.en || type;
  };

  if (loading) {
    return <PageLoading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-6 w-6" />
          {locale === "ar" ? "إدارة قاعدة المعرفة (RAG)" : "Knowledge Base Management (RAG)"}
        </h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "إدارة وفحص قاعدة بيانات الاسترجاع المحسنة للذكاء الاصطناعي"
            : "Manage and test the Retrieval-Augmented Generation knowledge base"}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {ragStatus?.status === "ready" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                {locale === "ar" ? "حالة الفهرس" : "Index Status"}
              </CardTitle>
              <CardDescription>{ragStatus?.message}</CardDescription>
            </div>
            <Button onClick={handleReindex} disabled={reindexing}>
              {reindexing ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <RefreshCw className="h-4 w-4 me-2" />
              )}
              {locale === "ar" ? "إعادة الفهرسة" : "Reindex NDI Data"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Total Documents */}
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">{ragStatus?.total_documents || 0}</p>
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "إجمالي المستندات" : "Total Documents"}
              </p>
            </div>

            {/* By Type */}
            {ragStatus?.by_type && Object.entries(ragStatus.by_type).map(([type, count]) => (
              <div key={type} className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {getTypeIcon(type)}
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <p className="text-sm text-muted-foreground">{getTypeLabel(type)}</p>
              </div>
            ))}

            {/* Vector Status */}
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                {ragStatus?.has_vectors ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {ragStatus?.has_vectors
                  ? (locale === "ar" ? "متجهات مفعّلة" : "Vectors Enabled")
                  : (locale === "ar" ? "بحث بالكلمات فقط" : "Keyword Search Only")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Test Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {locale === "ar" ? "اختبار البحث" : "Test Search"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "اختبر قدرات البحث في قاعدة المعرفة"
              : "Test the knowledge base search capabilities"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={locale === "ar" ? "أدخل استعلام البحث..." : "Enter search query..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <Search className="h-4 w-4 me-2" />
              )}
              {locale === "ar" ? "بحث" : "Search"}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">
                {locale === "ar" ? `نتائج البحث (${searchResults.length})` : `Search Results (${searchResults.length})`}
              </h3>

              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div
                    key={`${result.id}-${index}`}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      {getTypeIcon(result.type)}
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {getTypeLabel(result.type)}
                      </span>
                      {result.code && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                          {result.code}
                        </span>
                      )}
                      {result.similarity !== undefined && (
                        <span className="text-xs text-muted-foreground ms-auto">
                          {locale === "ar" ? "التشابه:" : "Similarity:"} {(result.similarity * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{result.content}</p>
                  </div>
                ))}
              </div>

              {/* Context Preview */}
              {searchContext && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">
                    {locale === "ar" ? "السياق المُجمّع (للذكاء الاصطناعي)" : "Aggregated Context (for AI)"}
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {searchContext}
                  </div>
                </div>
              )}
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !searching && (
            <div className="text-center py-8 text-muted-foreground">
              {locale === "ar" ? "لا توجد نتائج. جرب استعلامًا مختلفًا." : "No results found. Try a different query."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {locale === "ar" ? "كيف يعمل RAG" : "How RAG Works"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {locale === "ar" ? (
              <ul className="space-y-2">
                <li><strong>الفهرسة:</strong> يتم تحويل بيانات مؤشر البيانات الوطني (المجالات، الأسئلة، المستويات، المواصفات) إلى متجهات رقمية</li>
                <li><strong>البحث:</strong> عند طرح سؤال، يتم تحويله إلى متجه والبحث عن المحتوى الأكثر تشابهًا</li>
                <li><strong>التوليد:</strong> يتم تمرير السياق المُسترجع للذكاء الاصطناعي لتوليد إجابة دقيقة</li>
                <li><strong>بدون متجهات:</strong> إذا لم تكن API للتضمين متوفرة، يتم استخدام البحث بالكلمات المفتاحية</li>
              </ul>
            ) : (
              <ul className="space-y-2">
                <li><strong>Indexing:</strong> NDI data (domains, questions, levels, specifications) is converted to numerical vectors</li>
                <li><strong>Search:</strong> When a question is asked, it&apos;s converted to a vector and similar content is retrieved</li>
                <li><strong>Generation:</strong> Retrieved context is passed to AI to generate an accurate response</li>
                <li><strong>Without Vectors:</strong> If embedding API is unavailable, keyword search is used as fallback</li>
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
