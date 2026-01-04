"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/contexts/auth-context";

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(formData.email, formData.password);
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message || (locale === "ar" ? "فشل تسجيل الدخول" : "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {locale === "ar" ? "تسجيل الدخول" : "Sign In"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "نظام الامتثال لمؤشر البيانات الوطني"
              : "NDI Compliance System"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm dark:bg-red-900 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                {locale === "ar" ? "البريد الإلكتروني" : "Email"}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {locale === "ar" ? "كلمة المرور" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                dir="ltr"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {locale === "ar" ? "جاري التحميل..." : "Loading..."}
                </>
              ) : (
                <>
                  <LogIn className="me-2 h-4 w-4" />
                  {locale === "ar" ? "تسجيل الدخول" : "Sign In"}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {locale === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}
            </span>{" "}
            <Link href={`/${locale}/register`} className="text-primary hover:underline">
              {locale === "ar" ? "إنشاء حساب" : "Register"}
            </Link>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">
              {locale === "ar" ? "بيانات تجريبية:" : "Demo credentials:"}
            </p>
            <p className="text-muted-foreground">
              Email: admin@example.com
              <br />
              Password: admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
