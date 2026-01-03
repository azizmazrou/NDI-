"use client";

import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import {
  ListTodo,
  Plus,
  Filter,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Circle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { tasksApi } from "@/lib/api";
import type { Task, TaskStatus, TaskPriority } from "@/types/ndi";

export default function TasksPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [view, setView] = useState<"my" | "assigned">("my");

  useEffect(() => {
    loadTasks();
  }, [view]);

  async function loadTasks() {
    setLoading(true);
    try {
      const data = view === "my"
        ? await tasksApi.getMyTasks()
        : await tasksApi.getAssignedTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    try {
      await tasksApi.updateStatus(taskId, status);
      loadTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    return true;
  });

  const tasksByStatus = {
    pending: filteredTasks.filter((t) => t.status === "pending"),
    in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
    overdue: filteredTasks.filter((t) => t.status === "overdue"),
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    const colors: Record<TaskPriority, string> = {
      urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
    return (
      <Badge variant="outline" className={colors[priority]}>
        {t(`task.${priority}`)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ListTodo className="h-6 w-6" />
            {t("task.tasks")}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "إدارة المهام المعينة لك"
              : "Manage your assigned tasks"}
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex rounded-lg border p-1">
          <Button
            variant={view === "my" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("my")}
          >
            {t("task.assignedTasks")}
          </Button>
          <Button
            variant={view === "assigned" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("assigned")}
          >
            {t("task.assignedByMe")}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 ms-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("task.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="pending">{t("task.pending")}</SelectItem>
              <SelectItem value="in_progress">{t("task.inProgress")}</SelectItem>
              <SelectItem value="completed">{t("task.completed")}</SelectItem>
              <SelectItem value="overdue">{t("task.overdue")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("task.priority")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="urgent">{t("task.urgent")}</SelectItem>
              <SelectItem value="high">{t("task.high")}</SelectItem>
              <SelectItem value="medium">{t("task.medium")}</SelectItem>
              <SelectItem value="low">{t("task.low")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("task.pending")}</p>
                <p className="text-2xl font-bold">{tasksByStatus.pending.length}</p>
              </div>
              <Circle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("task.inProgress")}</p>
                <p className="text-2xl font-bold">{tasksByStatus.in_progress.length}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("task.completed")}</p>
                <p className="text-2xl font-bold">{tasksByStatus.completed.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("task.overdue")}</p>
                <p className="text-2xl font-bold text-red-500">{tasksByStatus.overdue.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {view === "my" ? t("task.assignedTasks") : t("task.assignedByMe")}
          </CardTitle>
          <CardDescription>
            {filteredTasks.length} {locale === "ar" ? "مهمة" : "tasks"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">{t("task.noTasks")}</p>
              <p className="text-muted-foreground">
                {t("task.allTasksCompleted")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="pt-1">{getStatusIcon(task.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      {getPriorityBadge(task.priority)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(task.due_date).toLocaleDateString(locale)}
                        </span>
                      )}
                      {task.assignee && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {task.assignee.full_name || task.assignee.email}
                        </span>
                      )}
                      {task.domain_code && (
                        <Badge variant="outline">{task.domain_code}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {task.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, "in_progress")}
                      >
                        {t("task.startTask")}
                      </Button>
                    )}
                    {task.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, "completed")}
                      >
                        {t("task.completeTask")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
