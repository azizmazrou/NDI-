"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  ListTodo,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed";
  dueDate: string;
  assessmentId?: string;
  domainCode?: string;
  createdAt: string;
}

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    title: "Review Data Governance policies",
    description: "Complete the review of existing data governance policies and identify gaps",
    priority: "high",
    status: "in_progress",
    dueDate: "2024-12-20",
    domainCode: "DG",
    createdAt: "2024-12-01",
  },
  {
    id: "2",
    title: "Upload evidence for Data Quality",
    description: "Collect and upload all evidence documents for DQ domain assessment",
    priority: "medium",
    status: "pending",
    dueDate: "2024-12-25",
    domainCode: "DQ",
    createdAt: "2024-12-05",
  },
  {
    id: "3",
    title: "Schedule stakeholder meeting",
    description: "Arrange meeting with IT team to discuss data architecture documentation",
    priority: "low",
    status: "completed",
    dueDate: "2024-12-10",
    domainCode: "DAM",
    createdAt: "2024-12-02",
  },
];

export default function TasksPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    dueDate: "",
    domainCode: "",
  });

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: "pending",
      dueDate: newTask.dueDate,
      domainCode: newTask.domainCode || undefined,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setTasks((prev) => [task, ...prev]);
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      domainCode: "",
    });
    setIsDialogOpen(false);
  };

  const handleToggleStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const nextStatus =
            task.status === "pending"
              ? "in_progress"
              : task.status === "in_progress"
              ? "completed"
              : "pending";
          return { ...task, status: nextStatus };
        }
        return task;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((task) => task.status === filter);

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100 dark:bg-red-900/30";
      case "medium":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
      case "low":
        return "text-green-600 bg-green-100 dark:bg-green-900/30";
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ListTodo className="h-6 w-6" />
            {locale === "ar" ? "المهام" : "Tasks"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "إدارة مهام التقييم والمتابعة"
              : "Manage assessment tasks and follow-ups"}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {locale === "ar" ? "مهمة جديدة" : "New Task"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {locale === "ar" ? "إضافة مهمة جديدة" : "Add New Task"}
              </DialogTitle>
              <DialogDescription>
                {locale === "ar"
                  ? "أدخل تفاصيل المهمة الجديدة"
                  : "Enter the details for the new task"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {locale === "ar" ? "عنوان المهمة" : "Task Title"}
                </Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder={
                    locale === "ar" ? "أدخل عنوان المهمة..." : "Enter task title..."
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  {locale === "ar" ? "الوصف" : "Description"}
                </Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder={
                    locale === "ar" ? "أدخل وصف المهمة..." : "Enter task description..."
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{locale === "ar" ? "الأولوية" : "Priority"}</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: Task["priority"]) =>
                      setNewTask((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">
                        {locale === "ar" ? "عالية" : "High"}
                      </SelectItem>
                      <SelectItem value="medium">
                        {locale === "ar" ? "متوسطة" : "Medium"}
                      </SelectItem>
                      <SelectItem value="low">
                        {locale === "ar" ? "منخفضة" : "Low"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">
                    {locale === "ar" ? "تاريخ الاستحقاق" : "Due Date"}
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{locale === "ar" ? "المجال (اختياري)" : "Domain (Optional)"}</Label>
                <Select
                  value={newTask.domainCode}
                  onValueChange={(value) =>
                    setNewTask((prev) => ({ ...prev, domainCode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={locale === "ar" ? "اختر المجال" : "Select domain"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DG">{t("domains.DG")}</SelectItem>
                    <SelectItem value="MCM">{t("domains.MCM")}</SelectItem>
                    <SelectItem value="DQ">{t("domains.DQ")}</SelectItem>
                    <SelectItem value="DO">{t("domains.DO")}</SelectItem>
                    <SelectItem value="DCM">{t("domains.DCM")}</SelectItem>
                    <SelectItem value="DAM">{t("domains.DAM")}</SelectItem>
                    <SelectItem value="DSI">{t("domains.DSI")}</SelectItem>
                    <SelectItem value="RMD">{t("domains.RMD")}</SelectItem>
                    <SelectItem value="BIA">{t("domains.BIA")}</SelectItem>
                    <SelectItem value="DVR">{t("domains.DVR")}</SelectItem>
                    <SelectItem value="OD">{t("domains.OD")}</SelectItem>
                    <SelectItem value="FOI">{t("domains.FOI")}</SelectItem>
                    <SelectItem value="DC">{t("domains.DC")}</SelectItem>
                    <SelectItem value="PDP">{t("domains.PDP")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleAddTask}>{t("common.save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {locale === "ar" ? "إجمالي المهام" : "Total Tasks"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === "ar" ? "قيد الانتظار" : "Pending"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {locale === "ar" ? "قيد التنفيذ" : "In Progress"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {locale === "ar" ? "مكتملة" : "Completed"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "pending", "in_progress", "completed"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === "all"
              ? locale === "ar"
                ? "الكل"
                : "All"
              : status === "pending"
              ? locale === "ar"
                ? "قيد الانتظار"
                : "Pending"
              : status === "in_progress"
              ? locale === "ar"
                ? "قيد التنفيذ"
                : "In Progress"
              : locale === "ar"
              ? "مكتملة"
              : "Completed"}
          </Button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {locale === "ar" ? "لا توجد مهام" : "No tasks found"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={cn(
                "transition-all",
                task.status === "completed" && "opacity-60"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleStatus(task.id)}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {getStatusIcon(task.status)}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={cn(
                          "font-medium",
                          task.status === "completed" && "line-through"
                        )}
                      >
                        {task.title}
                      </h3>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          getPriorityColor(task.priority)
                        )}
                      >
                        {task.priority === "high"
                          ? locale === "ar"
                            ? "عالية"
                            : "High"
                          : task.priority === "medium"
                          ? locale === "ar"
                            ? "متوسطة"
                            : "Medium"
                          : locale === "ar"
                          ? "منخفضة"
                          : "Low"}
                      </span>
                      {task.domainCode && (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {task.domainCode}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3" />
                        {task.dueDate}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
