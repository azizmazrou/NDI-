"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  ClipboardCheck,
  BarChart3,
  Shield,
  Sparkles,
  Upload,
  BookOpen,
  LogIn,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const features = [
    {
      icon: <ClipboardCheck className="h-8 w-8" />,
      title: locale === "ar" ? "تقييم النضج" : "Maturity Assessment",
      description: locale === "ar"
        ? "تقييم شامل لمستوى نضج إدارة البيانات وفق 14 مجالاً"
        : "Comprehensive assessment of data management maturity across 14 domains",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: locale === "ar" ? "التقارير والتحليلات" : "Reports & Analytics",
      description: locale === "ar"
        ? "تقارير تفصيلية مع تحليل الفجوات والتوصيات"
        : "Detailed reports with gap analysis and recommendations",
    },
    {
      icon: <Upload className="h-8 w-8" />,
      title: locale === "ar" ? "إدارة الأدلة" : "Evidence Management",
      description: locale === "ar"
        ? "رفع وإدارة الأدلة والمستندات الداعمة"
        : "Upload and manage supporting evidence and documents",
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: locale === "ar" ? "المساعد الذكي" : "AI Assistant",
      description: locale === "ar"
        ? "مساعد ذكي للإجابة على استفساراتك حول NDI"
        : "AI-powered assistant to answer your NDI questions",
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: locale === "ar" ? "قاعدة المعرفة" : "Knowledge Base",
      description: locale === "ar"
        ? "مكتبة شاملة للمعايير والمواصفات والأدلة"
        : "Comprehensive library of standards, specifications and guides",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: locale === "ar" ? "الامتثال" : "Compliance",
      description: locale === "ar"
        ? "تتبع الامتثال للمواصفات والمعايير الوطنية"
        : "Track compliance with national specifications and standards",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg ndi-gradient flex items-center justify-center">
              <span className="text-white font-bold">NDI</span>
            </div>
            <span className="font-bold text-lg">
              {locale === "ar" ? "نظام الامتثال" : "Compliance System"}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href={`/${locale}/login`}>
              <Button variant="ghost">
                <LogIn className="h-4 w-4 me-2" />
                {locale === "ar" ? "تسجيل الدخول" : "Sign In"}
              </Button>
            </Link>
            <Link href={`/${locale}/register`}>
              <Button>
                <UserPlus className="h-4 w-4 me-2" />
                {locale === "ar" ? "إنشاء حساب" : "Register"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          {locale === "ar"
            ? "نظام الامتثال لمؤشر البيانات الوطني"
            : "NDI Compliance System"}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          {locale === "ar"
            ? "منصة متكاملة لتقييم وتحسين مستوى نضج إدارة البيانات في الجهات الحكومية السعودية"
            : "Comprehensive platform for assessing and improving data management maturity in Saudi government entities"}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href={`/${locale}/dashboard`}>
            <Button size="lg" className="text-lg px-8">
              {locale === "ar" ? "ابدأ التقييم" : "Start Assessment"}
              <Arrow className="ms-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href={`/${locale}/knowledge`}>
            <Button size="lg" variant="outline" className="text-lg px-8">
              <BookOpen className="me-2 h-5 w-5" />
              {locale === "ar" ? "قاعدة المعرفة" : "Knowledge Base"}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {locale === "ar" ? "المميزات الرئيسية" : "Key Features"}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-card rounded-2xl border p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-8 text-center">
            {locale === "ar" ? "روابط سريعة" : "Quick Links"}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href={`/${locale}/dashboard/assessments/new`}>
              <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                <ClipboardCheck className="h-8 w-8" />
                <span>{locale === "ar" ? "تقييم جديد" : "New Assessment"}</span>
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/reports`}>
              <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                <BarChart3 className="h-8 w-8" />
                <span>{locale === "ar" ? "التقارير" : "Reports"}</span>
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/chat`}>
              <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                <Sparkles className="h-8 w-8" />
                <span>{locale === "ar" ? "المساعد الذكي" : "AI Assistant"}</span>
              </Button>
            </Link>
            <Link href={`/${locale}/knowledge`}>
              <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                <BookOpen className="h-8 w-8" />
                <span>{locale === "ar" ? "قاعدة المعرفة" : "Knowledge Base"}</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>
            {locale === "ar"
              ? "© 2025 نظام الامتثال لمؤشر البيانات الوطني. جميع الحقوق محفوظة."
              : "© 2025 NDI Compliance System. All rights reserved."}
          </p>
        </div>
      </footer>
    </div>
  );
}
