import { NextIntlClientProvider, useMessages } from "next-intl";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "NDI Compliance System | نظام الامتثال لمؤشر البيانات الوطني",
  description:
    "National Data Index Compliance Assessment System for Saudi Government Entities",
};

const locales = ["en", "ar"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

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
        className={`${inter.variable} ${
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
