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
  Save,
  Building2,
  Globe,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settingsApi, type AIProvider, type SystemPrompt } from "@/lib/api";
import type { OrganizationSettings } from "@/types/ndi";
import { FileText, RotateCcw } from "lucide-react";

const DEFAULT_MODELS: Record<string, string[]> = {
  openai: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
  claude: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
  gemini: ["gemini-pro", "gemini-pro-vision"],
  azure: ["gpt-4", "gpt-4-turbo", "gpt-35-turbo"],
};

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();

  // Organization settings state
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null);
  const [orgForm, setOrgForm] = useState({
    name_en: "",
    name_ar: "",
    sector: "",
    description_en: "",
    description_ar: "",
    website: "",
    contact_email: "",
    contact_phone: "",
    address: "",
  });
  const [savingOrg, setSavingOrg] = useState(false);

  // AI providers state
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [endpoints, setEndpoints] = useState<Record<string, string>>({});
  const [models, setModels] = useState<Record<string, string>>({});
  const [fetchedModels, setFetchedModels] = useState<Record<string, string[]>>({});
  const [fetchingModels, setFetchingModels] = useState<string | null>(null);

  // System prompts state
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [promptEdits, setPromptEdits] = useState<Record<string, string>>({});
  const [savingPrompt, setSavingPrompt] = useState<string | null>(null);
  const [resettingPrompts, setResettingPrompts] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orgData, providersResponse, promptsResponse] = await Promise.all([
        settingsApi.get().catch(() => null),
        settingsApi.getAIProviders().catch(() => ({ providers: [] })),
        settingsApi.getSystemPrompts().catch(() => ({ prompts: [] })),
      ]);

      setPrompts(promptsResponse.prompts || []);

      if (orgData) {
        setOrgSettings(orgData);
        setOrgForm({
          name_en: orgData.name_en || "",
          name_ar: orgData.name_ar || "",
          sector: orgData.sector || "",
          description_en: orgData.description_en || "",
          description_ar: orgData.description_ar || "",
          website: orgData.website || "",
          contact_email: orgData.contact_email || "",
          contact_phone: orgData.contact_phone || "",
          address: orgData.address || "",
        });
      }

      setProviders(providersResponse.providers || []);

      const initialModels: Record<string, string> = {};
      const initialEndpoints: Record<string, string> = {};
      providersResponse.providers?.forEach((p: AIProvider) => {
        if (p.model_name) initialModels[p.id] = p.model_name;
        if (p.api_endpoint) initialEndpoints[p.id] = p.api_endpoint;
      });
      setModels(initialModels);
      setEndpoints(initialEndpoints);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrg = async () => {
    setSavingOrg(true);
    try {
      await settingsApi.update(orgForm);
      await fetchData();
    } catch (error) {
      console.error("Failed to save organization settings:", error);
    } finally {
      setSavingOrg(false);
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

      await settingsApi.updateAIProvider(providerId, updateData);
      await fetchData();
      setApiKeys(prev => ({ ...prev, [providerId]: "" }));
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
      const result = await settingsApi.testAIProvider(providerId, apiKeys[providerId] || undefined);
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
      await settingsApi.updateAIProvider(providerId, { is_default: true, is_enabled: true });
      await fetchData();
    } catch (error) {
      console.error("Failed to set default:", error);
    }
  };

  const handleToggleEnabled = async (providerId: string, enabled: boolean) => {
    try {
      await settingsApi.updateAIProvider(providerId, { is_enabled: enabled });
      await fetchData();
    } catch (error) {
      console.error("Failed to toggle:", error);
    }
  };

  const handleFetchModels = async (providerId: string) => {
    setFetchingModels(providerId);
    try {
      const result = await settingsApi.fetchModels(providerId, apiKeys[providerId] || undefined);
      if (result.models && result.models.length > 0) {
        setFetchedModels(prev => ({ ...prev, [providerId]: result.models }));
      } else if (result.error) {
        console.error("Failed to fetch models:", result.error);
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
    } finally {
      setFetchingModels(null);
    }
  };

  const handleSavePrompt = async (promptId: string) => {
    setSavingPrompt(promptId);
    try {
      await settingsApi.updateSystemPrompt(promptId, {
        prompt_template: promptEdits[promptId],
      });
      await fetchData();
      setEditingPrompt(null);
      setPromptEdits(prev => ({ ...prev, [promptId]: "" }));
    } catch (error) {
      console.error("Failed to save prompt:", error);
    } finally {
      setSavingPrompt(null);
    }
  };

  const handleResetPrompts = async () => {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من إعادة جميع النصوص إلى الافتراضية؟" : "Are you sure you want to reset all prompts to defaults?")) {
      return;
    }
    setResettingPrompts(true);
    try {
      await settingsApi.resetSystemPrompts();
      await fetchData();
    } catch (error) {
      console.error("Failed to reset prompts:", error);
    } finally {
      setResettingPrompts(false);
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
            ? "إدارة إعدادات المنظمة ومزودي الذكاء الاصطناعي"
            : "Manage organization settings and AI providers"}
        </p>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList>
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            {locale === "ar" ? "المنظمة" : "Organization"}
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Bot className="h-4 w-4" />
            {locale === "ar" ? "الذكاء الاصطناعي" : "AI Providers"}
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-2">
            <FileText className="h-4 w-4" />
            {locale === "ar" ? "نصوص الأوامر" : "System Prompts"}
          </TabsTrigger>
        </TabsList>

        {/* Organization Settings Tab */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {locale === "ar" ? "معلومات المنظمة" : "Organization Information"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "المعلومات الأساسية للمنظمة"
                  : "Basic organization information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name_en">
                    {locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}
                  </Label>
                  <Input
                    id="name_en"
                    value={orgForm.name_en}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="Organization name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_ar">
                    {locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}
                  </Label>
                  <Input
                    id="name_ar"
                    value={orgForm.name_ar}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, name_ar: e.target.value }))}
                    placeholder="اسم المنظمة"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">
                  {locale === "ar" ? "القطاع" : "Sector"}
                </Label>
                <Select
                  value={orgForm.sector}
                  onValueChange={(value) => setOrgForm(prev => ({ ...prev, sector: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locale === "ar" ? "اختر القطاع" : "Select sector"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="government">{locale === "ar" ? "حكومي" : "Government"}</SelectItem>
                    <SelectItem value="private">{locale === "ar" ? "خاص" : "Private"}</SelectItem>
                    <SelectItem value="semi_government">{locale === "ar" ? "شبه حكومي" : "Semi-Government"}</SelectItem>
                    <SelectItem value="non_profit">{locale === "ar" ? "غير ربحي" : "Non-Profit"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="description_en">
                    {locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}
                  </Label>
                  <Textarea
                    id="description_en"
                    value={orgForm.description_en}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, description_en: e.target.value }))}
                    placeholder="Brief description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_ar">
                    {locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}
                  </Label>
                  <Textarea
                    id="description_ar"
                    value={orgForm.description_ar}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, description_ar: e.target.value }))}
                    placeholder="وصف مختصر"
                    dir="rtl"
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="website">
                    <Globe className="h-4 w-4 inline me-1" />
                    {locale === "ar" ? "الموقع الإلكتروني" : "Website"}
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={orgForm.website}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">
                    <Mail className="h-4 w-4 inline me-1" />
                    {locale === "ar" ? "البريد الإلكتروني" : "Contact Email"}
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={orgForm.contact_email}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">
                    <Phone className="h-4 w-4 inline me-1" />
                    {locale === "ar" ? "رقم الهاتف" : "Contact Phone"}
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={orgForm.contact_phone}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="+966 XX XXX XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">
                    {locale === "ar" ? "العنوان" : "Address"}
                  </Label>
                  <Input
                    id="address"
                    value={orgForm.address}
                    onChange={(e) => setOrgForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder={locale === "ar" ? "العنوان" : "Address"}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveOrg} disabled={savingOrg}>
                  {savingOrg ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Save className="h-4 w-4 me-2" />
                  )}
                  {locale === "ar" ? "حفظ الإعدادات" : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Providers Tab */}
        <TabsContent value="ai">
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
              {providers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {locale === "ar" ? "لا يوجد مزودين متاحين" : "No providers available"}
                </p>
              ) : (
                providers.map((provider) => (
                  <div key={provider.id} className="border rounded-lg p-4 space-y-4">
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
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${provider.id}-model`}>
                            {locale === "ar" ? "النموذج" : "Model"}
                            {provider.id === "azure" && (
                              <span className="text-xs text-muted-foreground ms-2">
                                ({locale === "ar" ? "اسم النشر" : "Deployment name"})
                              </span>
                            )}
                          </Label>
                          {provider.id !== "azure" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFetchModels(provider.id)}
                              disabled={fetchingModels === provider.id || (!apiKeys[provider.id] && !provider.has_api_key)}
                              className="h-6 text-xs"
                            >
                              {fetchingModels === provider.id ? (
                                <Loader2 className="h-3 w-3 animate-spin me-1" />
                              ) : (
                                <RefreshCw className="h-3 w-3 me-1" />
                              )}
                              {locale === "ar" ? "جلب النماذج" : "Fetch Models"}
                            </Button>
                          )}
                        </div>
                        {provider.id === "azure" ? (
                          // Azure uses deployment name - text input
                          <Input
                            id={`${provider.id}-model`}
                            placeholder={locale === "ar" ? "اسم النشر (مثال: gpt-4-deployment)" : "Deployment name (e.g., gpt-4-deployment)"}
                            value={models[provider.id] || provider.model_name || ""}
                            onChange={(e) => setModels(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          />
                        ) : (
                          // Other providers use dropdown - use fetched models if available
                          <Select
                            value={models[provider.id] || provider.model_name || ""}
                            onValueChange={(value) => setModels(prev => ({ ...prev, [provider.id]: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={locale === "ar" ? "اختر النموذج" : "Select model"} />
                            </SelectTrigger>
                            <SelectContent>
                              {(fetchedModels[provider.id] || DEFAULT_MODELS[provider.id] || []).map((model) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
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
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Prompts Tab */}
        <TabsContent value="prompts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {locale === "ar" ? "نصوص الأوامر النظامية" : "System Prompts"}
                  </CardTitle>
                  <CardDescription>
                    {locale === "ar"
                      ? "تخصيص نصوص الأوامر المستخدمة في تحليل الشواهد والمحادثة"
                      : "Customize prompts used for evidence analysis and chat"}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPrompts}
                  disabled={resettingPrompts}
                >
                  {resettingPrompts ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <RotateCcw className="h-4 w-4 me-2" />
                  )}
                  {locale === "ar" ? "إعادة للافتراضي" : "Reset to Defaults"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {prompts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {locale === "ar" ? "لا توجد نصوص أوامر" : "No prompts available"}
                </p>
              ) : (
                prompts.map((prompt) => (
                  <div key={prompt.id} className="border rounded-lg p-4 space-y-4">
                    {/* Prompt Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {locale === "ar" ? prompt.name_ar : prompt.name_en}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {locale === "ar" ? prompt.description_ar : prompt.description_en}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          prompt.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {prompt.is_active
                            ? (locale === "ar" ? "نشط" : "Active")
                            : (locale === "ar" ? "معطّل" : "Disabled")}
                        </span>
                      </div>
                    </div>

                    {/* Prompt Template */}
                    <div className="space-y-2">
                      <Label>{locale === "ar" ? "نموذج النص" : "Prompt Template"}</Label>
                      <Textarea
                        value={editingPrompt === prompt.id
                          ? (promptEdits[prompt.id] ?? prompt.prompt_template)
                          : prompt.prompt_template}
                        onChange={(e) => {
                          if (editingPrompt !== prompt.id) {
                            setEditingPrompt(prompt.id);
                          }
                          setPromptEdits(prev => ({ ...prev, [prompt.id]: e.target.value }));
                        }}
                        rows={8}
                        className="font-mono text-sm"
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground">
                        {locale === "ar"
                          ? "استخدم {placeholders} للمتغيرات الديناميكية"
                          : "Use {placeholders} for dynamic variables"}
                      </p>
                    </div>

                    {/* Save Button */}
                    {editingPrompt === prompt.id && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPrompt(null);
                            setPromptEdits(prev => ({ ...prev, [prompt.id]: "" }));
                          }}
                        >
                          {locale === "ar" ? "إلغاء" : "Cancel"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSavePrompt(prompt.id)}
                          disabled={savingPrompt === prompt.id}
                        >
                          {savingPrompt === prompt.id ? (
                            <Loader2 className="h-4 w-4 animate-spin me-2" />
                          ) : (
                            <Save className="h-4 w-4 me-2" />
                          )}
                          {locale === "ar" ? "حفظ" : "Save"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
