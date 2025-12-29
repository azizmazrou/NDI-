import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "ar"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
