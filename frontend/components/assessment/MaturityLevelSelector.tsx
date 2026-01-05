"use client";

import { useTranslations, useLocale } from "next-intl";
import { Check, ChevronDown, ChevronUp, FileCheck } from "lucide-react";
import { useState } from "react";
import { cn, getLevelColor } from "@/lib/utils";
import { MATURITY_LEVELS } from "@/lib/constants";

interface AcceptanceEvidence {
  id: string;
  evidence_id: number;
  text_en: string;
  text_ar: string;
  inherits_from_level?: number;
  specification_code?: string;
  sort_order?: number;
}

interface MaturityLevel {
  level: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  acceptance_evidence?: AcceptanceEvidence[];
  // Legacy format support
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

  // Get acceptance evidence text based on locale
  const getEvidenceList = (level: MaturityLevel): string[] => {
    // New format: array of objects with text_en/text_ar
    if (level.acceptance_evidence && level.acceptance_evidence.length > 0) {
      return level.acceptance_evidence.map((ev) =>
        locale === "ar" ? ev.text_ar : ev.text_en
      );
    }
    // Legacy format: arrays of strings
    if (locale === "ar" && level.acceptance_evidence_ar) {
      return level.acceptance_evidence_ar;
    }
    if (level.acceptance_evidence_en) {
      return level.acceptance_evidence_en;
    }
    return [];
  };

  // Get specification codes if available
  const getSpecCodes = (level: MaturityLevel): string[] => {
    if (level.acceptance_evidence) {
      return level.acceptance_evidence
        .filter((ev) => ev.specification_code)
        .map((ev) => ev.specification_code!);
    }
    return [];
  };

  return (
    <div className="space-y-2">
      {levels.map((level) => {
        const levelInfo = getLevelInfo(level.level);
        const isSelected = selectedLevel === level.level;
        const isExpanded = expandedLevel === level.level;
        const evidenceList = getEvidenceList(level);
        const specCodes = getSpecCodes(level);

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

            {/* Expanded content - Acceptance Evidence */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t">
                <div className="pt-4 space-y-4">
                  {evidenceList.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-primary" />
                        {locale === "ar" ? "معايير القبول (الأدلة المطلوبة)" : "Acceptance Criteria (Required Evidence)"}
                      </h4>
                      <ul className="space-y-2">
                        {level.acceptance_evidence?.map((ev, idx) => (
                          <li
                            key={ev.id || idx}
                            className="text-sm text-muted-foreground flex items-start gap-2 bg-muted/50 p-2 rounded"
                          >
                            <span className="text-primary font-medium min-w-[24px]">{ev.evidence_id}.</span>
                            <div className="flex-1">
                              <span>{locale === "ar" ? ev.text_ar : ev.text_en}</span>
                              {ev.specification_code && (
                                <span className="ms-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                  {ev.specification_code}
                                </span>
                              )}
                              {ev.inherits_from_level && (
                                <span className="ms-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                  {locale === "ar"
                                    ? `يرث من المستوى ${ev.inherits_from_level}`
                                    : `Inherits from L${ev.inherits_from_level}`}
                                </span>
                              )}
                            </div>
                          </li>
                        )) || evidenceList.map((criteria, idx) => (
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
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {locale === "ar" ? "لا توجد أدلة مطلوبة لهذا المستوى" : "No evidence required for this level"}
                    </p>
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
