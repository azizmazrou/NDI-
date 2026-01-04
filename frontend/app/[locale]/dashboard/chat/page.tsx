"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  MessageSquare,
  Send,
  Upload,
  File,
  X,
  Loader2,
  Bot,
  User,
  Paperclip,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { aiApi } from "@/lib/api";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: { name: string; type: string }[];
  timestamp: Date;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

export default function ChatPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        locale === "ar"
          ? "مرحباً! أنا مساعدك الذكي لمؤشر البيانات الوطني. يمكنني مساعدتك في:\n\n• الإجابة على أسئلة حول متطلبات NDI\n• تحليل المستندات والشواهد\n• تقديم توصيات لتحسين مستوى النضج\n\nكيف يمكنني مساعدتك اليوم؟"
          : "Hello! I'm your NDI AI Assistant. I can help you with:\n\n• Answering questions about NDI requirements\n• Analyzing documents and evidence\n• Providing recommendations to improve maturity level\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        alert(
          locale === "ar"
            ? `الملف ${file.name} أكبر من الحد الأقصى المسموح (50MB)`
            : `File ${file.name} exceeds maximum size (50MB)`
        );
        continue;
      }
      newFiles.push({
        id: `file-${Date.now()}-${i}`,
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
      });
    }
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    event.target.value = "";
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSend = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      attachments: uploadedFiles.map((f) => ({ name: f.name, type: f.type })),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const currentFiles = [...uploadedFiles];
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      // Build context with file information
      const context: any = {};
      if (currentFiles.length > 0) {
        context.attached_files = currentFiles.map((f) => ({
          name: f.name,
          type: f.type,
          size: f.size,
        }));
      }

      const response = await aiApi.chat({
        messages: [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: input },
        ],
        context: Object.keys(context).length > 0 ? context : undefined,
        language: locale,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          response.response ||
          response.content ||
          (locale === "ar"
            ? "عذراً، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى."
            : "Sorry, I couldn't process your request. Please try again."),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          locale === "ar"
            ? "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى."
            : "Sorry, there was a connection error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    locale === "ar"
      ? "ما هي متطلبات المستوى الثالث لحوكمة البيانات؟"
      : "What are the Level 3 requirements for Data Governance?",
    locale === "ar"
      ? "كيف يمكنني تحسين جودة البيانات في منظمتي؟"
      : "How can I improve data quality in my organization?",
    locale === "ar"
      ? "ما هي أفضل الممارسات لتصنيف البيانات؟"
      : "What are the best practices for data classification?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          {t("ai.title")}
        </h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "تحدث مع المساعد الذكي للحصول على إجابات حول NDI"
            : "Chat with AI Assistant for NDI guidance"}
        </p>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : ""
              )}
            >
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              <div
                className={cn(
                  "flex-1 max-w-[80%] rounded-lg p-4",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-xs",
                          message.role === "user"
                            ? "bg-primary-foreground/20"
                            : "bg-background"
                        )}
                      >
                        <File className="h-3 w-3" />
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                <p
                  className={cn(
                    "text-xs mt-2",
                    message.role === "user"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {message.timestamp.toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{t("ai.analyzing")}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="flex-shrink-0 px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">
              {locale === "ar" ? "أسئلة مقترحة:" : "Suggested questions:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(question)}
                  className="text-xs bg-muted hover:bg-muted/80 rounded-full px-3 py-1.5 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="flex-shrink-0 px-4 py-2 border-t">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2"
                >
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium truncate max-w-[150px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 hover:bg-background rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept={Object.keys(ACCEPTED_FILE_TYPES).join(",")}
              multiple
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title={locale === "ar" ? "إرفاق ملف" : "Attach file"}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("ai.chatPlaceholder")}
                className="min-h-[44px] max-h-[120px] resize-none pr-12"
                rows={1}
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            {locale === "ar"
              ? "يمكنك إرفاق ملفات PDF, DOCX, XLSX للتحليل"
              : "You can attach PDF, DOCX, XLSX files for analysis"}
          </p>
        </div>
      </Card>
    </div>
  );
}
