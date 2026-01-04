"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  ListTodo,
  FileBarChart,
  Settings,
  HelpCircle,
  Menu,
  X,
  Globe,
  Moon,
  Sun,
  Sparkles,
  Upload,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      href: `/${locale}/dashboard`,
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: t("nav.dashboard"),
    },
    {
      href: `/${locale}/dashboard/assessments`,
      icon: <ClipboardCheck className="h-5 w-5" />,
      label: t("nav.assessments"),
    },
    {
      href: `/${locale}/dashboard/tasks`,
      icon: <ListTodo className="h-5 w-5" />,
      label: t("nav.tasks"),
    },
    {
      href: `/${locale}/dashboard/reports`,
      icon: <FileBarChart className="h-5 w-5" />,
      label: t("nav.reports"),
    },
    {
      href: `/${locale}/dashboard/evidence`,
      icon: <Upload className="h-5 w-5" />,
      label: locale === "ar" ? "إدارة الأدلة" : "Evidence",
    },
    {
      href: `/${locale}/dashboard/chat`,
      icon: <Sparkles className="h-5 w-5" />,
      label: locale === "ar" ? "المساعد الذكي" : "AI Assistant",
    },
    {
      href: `/${locale}/knowledge`,
      icon: <BookOpen className="h-5 w-5" />,
      label: locale === "ar" ? "قاعدة المعرفة" : "Knowledge Base",
    },
    {
      href: `/${locale}/dashboard/settings`,
      icon: <Settings className="h-5 w-5" />,
      label: t("nav.settings"),
    },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/dashboard`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const toggleLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    window.location.href = newPath;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-64 flex-col bg-card border-e transition-transform duration-300 lg:translate-x-0",
          locale === "ar" ? "right-0" : "left-0",
          sidebarOpen
            ? "translate-x-0"
            : locale === "ar"
            ? "translate-x-full"
            : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg ndi-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">NDI</span>
            </div>
            <span className="font-semibold text-sm">
              {locale === "ar" ? "نضيء" : "NDI"}
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-muted rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-4 space-y-2">
          <Link
            href={`/${locale}/dashboard/help`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <HelpCircle className="h-5 w-5" />
            {t("nav.help")}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "lg:transition-all",
          locale === "ar" ? "lg:mr-64" : "lg:ml-64"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded-md"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-muted rounded-md"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md text-sm"
            >
              <Globe className="h-4 w-4" />
              {locale === "ar" ? "EN" : "عربي"}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
