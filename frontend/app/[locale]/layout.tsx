import { NextIntlClientProvider, useMessages } from "next-intl";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "@/styles/globals.css";

// Force dynamic rendering - prevents static generation issues during build
export const dynamic = "force-dynamic";

export const metadata = {
  title: "NDI Compliance System | نظام الامتثال لمؤشر البيانات الوطني",
  description:
    "National Data Index Compliance Assessment System for Saudi Government Entities",
};

const locales = ["en", "ar"];

interface RootLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function RootLayout({ children, params: { locale } }: RootLayoutProps) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = useMessages();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <body
        className={`${
          locale === "ar" ? "font-arabic" : "font-sans"
        } antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
