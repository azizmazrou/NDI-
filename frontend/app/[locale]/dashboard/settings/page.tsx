"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Settings,
  Key,
  Bot,
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
  TestTube,
  Save
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AIProvider {
  id: string;
  name_en: string;
  name_ar: string;
  api_endpoint: string | null;
  model_name: string | null;
  is_enabled: boolean;
  is_default: boolean;
  has_api_key: boolean;
}

const DEFAULT_MODELS: Record<string, string[]> = {
  openai: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
  claude: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
  gemini: ["gemini-pro", "gemini-pro-vision"],
  azure: ["gpt-4", "gpt-4-turbo", "gpt-35-turbo"],
};

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [endpoints, setEndpoints] = useState<Record<string, string>>({});
  const [models, setModels] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/v1/settings/ai-providers");
      const data = await response.json();
      setProviders(data.providers || []);

      // Initialize state from providers
      const initialModels: Record<string, string> = {};
      const initialEndpoints: Record<string, string> = {};
      data.providers?.forEach((p: AIProvider) => {
        if (p.model_name) initialModels[p.id] = p.model_name;
        if (p.api_endpoint) initialEndpoints[p.id] = p.api_endpoint;
      });
      setModels(initialModels);
      setEndpoints(initialEndpoints);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (providerId: string) => {
    setSaving(providerId);
    try {
      const updateData: Record<string, any> = {};

      if (apiKeys[providerId]) {
        updateData.api_key = apiKeys[providerId];
      }
      if (endpoints[providerId] !== undefined) {
        updateData.api_endpoint = endpoints[providerId];
      }
      if (models[providerId]) {
        updateData.model_name = models[providerId];
      }

      const response = await fetch(`/api/v1/settings/ai-providers/${providerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await fetchProviders();
        // Clear the API key input after saving
        setApiKeys(prev => ({ ...prev, [providerId]: "" }));
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (providerId: string) => {
    setTesting(providerId);
    setTestResults(prev => ({ ...prev, [providerId]: { success: false, message: "Testing..." } }));

    try {
      const response = await fetch(`/api/v1/settings/ai-providers/${providerId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: providerId,
          api_key: apiKeys[providerId] || null,
        }),
      });

      const result = await response.json();
      setTestResults(prev => ({
        ...prev,
        [providerId]: { success: result.success, message: result.message }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [providerId]: { success: false, message: "Connection failed" }
      }));
    } finally {
      setTesting(null);
    }
  };

  const handleSetDefault = async (providerId: string) => {
    try {
      await fetch(`/api/v1/settings/ai-providers/${providerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true, is_enabled: true }),
      });
      await fetchProviders();
    } catch (error) {
      console.error("Failed to set default:", error);
    }
  };

  const handleToggleEnabled = async (providerId: string, enabled: boolean) => {
    try {
      await fetch(`/api/v1/settings/ai-providers/${providerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: enabled }),
      });
      await fetchProviders();
    } catch (error) {
      console.error("Failed to toggle:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          {locale === "ar" ? "الإعدادات" : "Settings"}
        </h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "إدارة إعدادات التطبيق ومزودي الذكاء الاصطناعي"
            : "Manage application settings and AI providers"}
        </p>
      </div>

      {/* AI Providers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {locale === "ar" ? "مزودي الذكاء الاصطناعي" : "AI Providers"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "قم بتكوين مفاتيح API لمزودي الذكاء الاصطناعي المختلفين"
              : "Configure API keys for different AI providers"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="border rounded-lg p-4 space-y-4"
            >
              {/* Provider Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    provider.is_enabled ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    <Bot className={`h-5 w-5 ${
                      provider.is_enabled ? "text-green-600" : "text-gray-400"
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {locale === "ar" ? provider.name_ar : provider.name_en}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      {provider.has_api_key ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Check className="h-3 w-3" />
                          {locale === "ar" ? "مفتاح API مُكوَّن" : "API Key configured"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600">
                          <X className="h-3 w-3" />
                          {locale === "ar" ? "مفتاح API غير مُكوَّن" : "API Key not configured"}
                        </span>
                      )}
                      {provider.is_default && (
                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">
                          {locale === "ar" ? "الافتراضي" : "Default"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={provider.is_enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleEnabled(provider.id, !provider.is_enabled)}
                  >
                    {provider.is_enabled
                      ? (locale === "ar" ? "مفعّل" : "Enabled")
                      : (locale === "ar" ? "معطّل" : "Disabled")}
                  </Button>
                  {!provider.is_default && provider.has_api_key && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(provider.id)}
                    >
                      {locale === "ar" ? "تعيين كافتراضي" : "Set Default"}
                    </Button>
                  )}
                </div>
              </div>

              {/* API Key Input */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${provider.id}-key`}>
                    <Key className="h-4 w-4 inline me-1" />
                    {locale === "ar" ? "مفتاح API" : "API Key"}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`${provider.id}-key`}
                      type={showApiKey[provider.id] ? "text" : "password"}
                      placeholder={provider.has_api_key
                        ? "••••••••••••••••"
                        : (locale === "ar" ? "أدخل مفتاح API" : "Enter API key")}
                      value={apiKeys[provider.id] || ""}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                      className="pe-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${provider.id}-model`}>
                    {locale === "ar" ? "النموذج" : "Model"}
                  </Label>
                  <Select
                    value={models[provider.id] || provider.model_name || ""}
                    onValueChange={(value) => setModels(prev => ({ ...prev, [provider.id]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={locale === "ar" ? "اختر النموذج" : "Select model"} />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_MODELS[provider.id]?.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {provider.id === "azure" && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`${provider.id}-endpoint`}>
                      {locale === "ar" ? "نقطة النهاية" : "Endpoint URL"}
                    </Label>
                    <Input
                      id={`${provider.id}-endpoint`}
                      placeholder="https://your-resource.openai.azure.com"
                      value={endpoints[provider.id] || provider.api_endpoint || ""}
                      onChange={(e) => setEndpoints(prev => ({ ...prev, [provider.id]: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              {/* Test Result */}
              {testResults[provider.id] && (
                <div className={`p-3 rounded-lg text-sm ${
                  testResults[provider.id].success
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {testResults[provider.id].success ? (
                    <Check className="h-4 w-4 inline me-2" />
                  ) : (
                    <X className="h-4 w-4 inline me-2" />
                  )}
                  {testResults[provider.id].message}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(provider.id)}
                  disabled={testing === provider.id || (!apiKeys[provider.id] && !provider.has_api_key)}
                >
                  {testing === provider.id ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <TestTube className="h-4 w-4 me-2" />
                  )}
                  {locale === "ar" ? "اختبار الاتصال" : "Test Connection"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave(provider.id)}
                  disabled={saving === provider.id || !apiKeys[provider.id]}
                >
                  {saving === provider.id ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Save className="h-4 w-4 me-2" />
                  )}
                  {locale === "ar" ? "حفظ" : "Save"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
