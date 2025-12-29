"use client";

import { useTranslations, useLocale } from "next-intl";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn, getLevelColor } from "@/lib/utils";
import { MATURITY_LEVELS } from "@/lib/constants";

interface MaturityLevel {
  level: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  acceptance_evidence_en?: string[];
  acceptance_evidence_ar?: string[];
}

interface MaturityLevelSelectorProps {
  levels: MaturityLevel[];
  selectedLevel: number | null;
  onSelect: (level: number) => void;
  disabled?: boolean;
}

export function MaturityLevelSelector({
  levels,
  selectedLevel,
  onSelect,
  disabled = false,
}: MaturityLevelSelectorProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const getLevelInfo = (level: number) => {
    return MATURITY_LEVELS.find((l) => l.level === level);
  };

  return (
    <div className="space-y-2">
      {levels.map((level) => {
        const levelInfo = getLevelInfo(level.level);
        const isSelected = selectedLevel === level.level;
        const isExpanded = expandedLevel === level.level;

        return (
          <div
            key={level.level}
            className={cn(
              "border rounded-lg transition-all",
              isSelected
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-muted-foreground/50",
              disabled && "opacity-50 pointer-events-none"
            )}
          >
            {/* Level header */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer"
              onClick={() => !disabled && onSelect(level.level)}
            >
              {/* Selection indicator */}
              <div
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && <Check className="h-4 w-4" />}
              </div>

              {/* Level info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      getLevelColor(level.level)
                    )}
                  >
                    {locale === "ar" ? `المستوى ${level.level}` : `Level ${level.level}`}
                  </span>
                  <span className="font-medium">
                    {locale === "ar" ? level.name_ar : level.name_en}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {locale === "ar" ? level.description_ar : level.description_en}
                </p>
              </div>

              {/* Expand button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedLevel(isExpanded ? null : level.level);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t">
                <div className="pt-4 space-y-4">
                  {/* Acceptance criteria */}
                  {(level.acceptance_evidence_ar?.length || level.acceptance_evidence_en?.length) && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        {locale === "ar" ? "معايير القبول" : "Acceptance Criteria"}
                      </h4>
                      <ul className="space-y-1">
                        {(locale === "ar"
                          ? level.acceptance_evidence_ar
                          : level.acceptance_evidence_en
                        )?.map((criteria, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="text-primary mt-1">•</span>
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
