"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, getLevelColor } from "@/lib/utils";

interface DomainCardProps {
  domain: {
    code: string;
    name_en: string;
    name_ar: string;
    question_count: number;
  };
  assessmentId: string;
  answeredCount: number;
  averageScore?: number;
}

export function DomainCard({
  domain,
  assessmentId,
  answeredCount,
  averageScore,
}: DomainCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const progress = (answeredCount / domain.question_count) * 100;
  const isComplete = answeredCount === domain.question_count;

  return (
    <Link href={`/${locale}/assessments/${assessmentId}/domain/${domain.code}`}>
      <Card className="ndi-card-hover cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                  {domain.code}
                </span>
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : answeredCount > 0 ? (
                  <Circle className="h-4 w-4 text-blue-500 fill-blue-500/20" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <h3 className="font-semibold mb-1">
                {locale === "ar" ? domain.name_ar : domain.name_en}
              </h3>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {answeredCount} / {domain.question_count}{" "}
                  {t("assessment.questions")}
                </span>
                {averageScore !== undefined && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-xs font-medium",
                      getLevelColor(Math.floor(averageScore))
                    )}
                  >
                    {averageScore.toFixed(1)}
                  </span>
                )}
              </div>

              <Progress value={progress} className="mt-3 h-1.5" />
            </div>

            <Arrow className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
