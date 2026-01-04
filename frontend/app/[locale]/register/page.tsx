"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/contexts/auth-context";

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError(locale === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError(locale === "ar" ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message || (locale === "ar" ? "فشل إنشاء الحساب" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {locale === "ar" ? "إنشاء حساب" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "التسجيل في نظام الامتثال لمؤشر البيانات الوطني"
              : "Register for NDI Compliance System"}
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
              <Label htmlFor="full_name">
                {locale === "ar" ? "الاسم الكامل" : "Full Name"}
              </Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder={locale === "ar" ? "محمد أحمد" : "John Doe"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {locale === "ar" ? "البريد الإلكتروني" : "Email"}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                  <UserPlus className="me-2 h-4 w-4" />
                  {locale === "ar" ? "إنشاء حساب" : "Create Account"}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {locale === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}
            </span>{" "}
            <Link href={`/${locale}/login`} className="text-primary hover:underline">
              {locale === "ar" ? "تسجيل الدخول" : "Sign In"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
