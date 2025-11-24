import { useEffect, useState } from "react";
import {
  GetAllTasks,
  CreateTask,
  UpdateTask,
  DeleteTask,
  ToggleTaskStatus,
  RunTaskNow,
  GetAllScripts,
} from "../../wailsjs/go/main/App";
import { Task, Script, ScheduleType, TimeConfig } from "../types";

interface TasksPageProps {
  onStatsUpdate: () => void;
}

export default function TasksPage({ onStatsUpdate }: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, scriptsData] = await Promise.all([
        GetAllTasks(),
        GetAllScripts(),
      ]);
      setTasks(tasksData as Task[]);
      setScripts(scriptsData as Script[]);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("确定要删除这个任务吗？")) return;

    try {
      await DeleteTask(id);
      await loadData();
      onStatsUpdate();
    } catch (error) {
      alert("删除失败: " + error);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await ToggleTaskStatus(id);
      await loadData();
      onStatsUpdate();
    } catch (error) {
      alert("状态切换失败: " + error);
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      await RunTaskNow(id);
      alert("任务已开始执行");
    } catch (error) {
      alert("执行失败: " + error);
    }
  };

  const handleSaveTask = async () => {
    await loadData();
    onStatsUpdate();
    setShowModal(false);
  };

  const getScriptById = (scriptId: string) => {
    return scripts.find((s) => s.id === scriptId);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">定时任务</h1>
          <p className="text-sm text-gray-500">配置脚本的定时执行计划</p>
        </div>
        <button onClick={handleCreateTask} className="btn-primary">
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          创建任务
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.length === 0 ? (
          <div className="bg-white border border-gray-200/80 rounded-xl p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              还没有定时任务
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              为脚本创建定时执行计划，自动化您的工作流程
            </p>
            <button onClick={handleCreateTask} className="btn-primary">
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              创建第一个任务
            </button>
          </div>
        ) : (
          tasks.map((task) => {
            const script = getScriptById(task.scriptId);
            return (
              <TaskCard
                key={task.id}
                task={task}
                script={script}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onToggle={handleToggleStatus}
                onRunNow={handleRunNow}
              />
            );
          })
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          scripts={scripts}
          onClose={() => setShowModal(false)}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  script?: Script;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onRunNow: (id: string) => void;
}

function TaskCard({
  task,
  script,
  onEdit,
  onDelete,
  onToggle,
  onRunNow,
}: TaskCardProps) {
  const scriptTypeIcons = {
    python: "🐍",
    nodejs: "📦",
    shell: "⚡",
  };

  const scheduleTypeLabels = {
    daily: "每天",
    weekly: "每周",
    monthly: "每月",
    custom: "自定义",
  };

  const formatSchedule = () => {
    const { scheduleType, timeConfig } = task;
    const hour = String(timeConfig.hour).padStart(2, "0");
    const minute = String(timeConfig.minute).padStart(2, "0");
    const time = `${hour}:${minute}`;

    switch (scheduleType) {
      case "daily":
        return `每天 ${time}`;
      case "weekly":
        if (timeConfig.weekdays && timeConfig.weekdays.length > 0) {
          const days = timeConfig.weekdays
            .map(
              (d) =>
                ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d],
            )
            .join("、");
          return `${days} ${time}`;
        }
        return `每周 ${time}`;
      case "monthly":
        return `每月${timeConfig.monthday}日 ${time}`;
      case "custom":
        return `自定义: ${task.cron}`;
      default:
        return task.cron;
    }
  };

  return (
    <div className="group bg-white border border-gray-200/80 rounded-xl p-5 hover:border-gray-300 hover:shadow-lg transition-all duration-300 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-gray-200 group-hover:to-gray-100 transition-all">
              <span className="text-xl">
                {script ? scriptTypeIcons[script.scriptType] : "📄"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                {task.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                {task.status === "active" ? (
                  <span className="badge-success">运行中</span>
                ) : (
                  <span className="badge-gray">已停止</span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200/50">
                  {scheduleTypeLabels[task.scheduleType]}
                </span>
              </div>
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
                执行脚本
              </p>
              <p className="text-sm text-gray-900 font-semibold truncate">
                {script ? script.name : "未知脚本"}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
                执行时间
              </p>
              <p className="text-sm text-gray-900 font-semibold">
                {formatSchedule()}
              </p>
            </div>
            {task.lastRunAt && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
                  最后运行
                </p>
                <p className="text-sm text-gray-900 font-mono">
                  {new Date(task.lastRunAt).toLocaleString("zh-CN", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {task.nextRunAt && task.status === "active" && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 mb-1.5 font-medium uppercase tracking-wide">
                  下次运行
                </p>
                <p className="text-sm text-blue-900 font-mono font-semibold">
                  {new Date(task.nextRunAt).toLocaleString("zh-CN", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2 ml-5 flex-shrink-0">
          <button
            onClick={() => onToggle(task.id)}
            className={`btn-sm flex items-center justify-center w-24 ${
              task.status === "active" ? "btn-secondary" : "btn-success"
            }`}
          >
            {task.status === "active" ? (
              <>
                <svg
                  className="w-3.5 h-3.5 mr-1.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                <span>停止</span>
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5 mr-1.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>启动</span>
              </>
            )}
          </button>
          <button
            onClick={() => onRunNow(task.id)}
            className="btn-sm btn-primary flex items-center justify-center w-24"
          >
            <svg
              className="w-3.5 h-3.5 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>运行</span>
          </button>
          <button
            onClick={() => onEdit(task)}
            className="btn-sm btn-secondary flex items-center justify-center w-24"
          >
            <svg
              className="w-3.5 h-3.5 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span>编辑</span>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="btn-sm btn-danger flex items-center justify-center w-24"
          >
            <svg
              className="w-3.5 h-3.5 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>删除</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface TaskModalProps {
  task: Task | null;
  scripts: Script[];
  onClose: () => void;
  onSave: () => void;
}

function TaskModal({ task, scripts, onClose, onSave }: TaskModalProps) {
  const [formData, setFormData] = useState({
    name: task?.name || "",
    description: task?.description || "",
    scriptId: task?.scriptId || "",
    scheduleType: task?.scheduleType || ("daily" as ScheduleType),
    timeConfig: task?.timeConfig || {
      hour: 0,
      minute: 0,
      weekday: 1,
      monthday: 1,
      weekdays: [1, 2, 3, 4, 5],
    },
    cron: task?.cron || "0 0 0 * * *",
  });

  const [saving, setSaving] = useState(false);

  const generateCron = (): string => {
    const { scheduleType, timeConfig } = formData;
    const { hour, minute, weekday, monthday, weekdays } = timeConfig;

    switch (scheduleType) {
      case "daily":
        return `0 ${minute} ${hour} * * *`;
      case "weekly":
        if (weekdays && weekdays.length > 0) {
          return `0 ${minute} ${hour} * * ${weekdays.join(",")}`;
        }
        return `0 ${minute} ${hour} * * ${weekday}`;
      case "monthly":
        return `0 ${minute} ${hour} ${monthday} * *`;
      case "custom":
        return formData.cron;
      default:
        return "0 0 0 * * *";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.scriptId) {
      alert("请选择要执行的脚本");
      return;
    }

    setSaving(true);

    try {
      const taskData: any = {
        ...formData,
        cron: generateCron(),
      };

      if (task) {
        taskData.id = task.id;
        await UpdateTask(taskData);
      } else {
        await CreateTask(taskData);
      }

      onSave();
    } catch (error) {
      alert("保存失败: " + error);
    } finally {
      setSaving(false);
    }
  };

  const updateTimeConfig = (updates: Partial<TimeConfig>) => {
    setFormData({
      ...formData,
      timeConfig: { ...formData.timeConfig, ...updates },
    });
  };

  const toggleWeekday = (day: number) => {
    const weekdays = formData.timeConfig.weekdays || [];
    if (weekdays.includes(day)) {
      updateTimeConfig({
        weekdays: weekdays.filter((d) => d !== day),
      });
    } else {
      updateTimeConfig({
        weekdays: [...weekdays, day].sort(),
      });
    }
  };

  const weekdayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content animate-slide-in max-w-2xl">
        <div className="modal-header">
          <h2 className="modal-title">
            {task ? "编辑定时任务" : "创建定时任务"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="space-y-6" id="task-form">
            <div>
              <label className="label label-required">任务名称</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input"
                placeholder="输入任务名称"
              />
            </div>

            <div>
              <label className="label">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="textarea"
                rows={2}
                placeholder="任务描述（可选）"
              />
            </div>

            <div>
              <label className="label label-required">选择脚本</label>
              {scripts.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  还没有可用的脚本，请先在脚本管理页面添加脚本
                </div>
              ) : (
                <select
                  value={formData.scriptId}
                  onChange={(e) =>
                    setFormData({ ...formData, scriptId: e.target.value })
                  }
                  className="select"
                  required
                >
                  <option value="">请选择脚本...</option>
                  {scripts.map((script) => (
                    <option key={script.id} value={script.id}>
                      {script.scriptType === "python" && "🐍 "}
                      {script.scriptType === "nodejs" && "📦 "}
                      {script.scriptType === "shell" && "⚡ "}
                      {script.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="label label-required">执行频率</label>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { value: "daily", label: "每天", icon: "📅" },
                  { value: "weekly", label: "每周", icon: "📆" },
                  { value: "monthly", label: "每月", icon: "🗓️" },
                  { value: "custom", label: "自定义", icon: "⚙️" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        scheduleType: option.value as ScheduleType,
                      })
                    }
                    className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                      formData.scheduleType === option.value
                        ? "border-gray-900 bg-gray-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-center">
                      <span className="text-2xl block mb-2">{option.icon}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {option.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* 时间配置 */}
              {formData.scheduleType !== "custom" && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">小时</label>
                      <select
                        value={formData.timeConfig.hour}
                        onChange={(e) =>
                          updateTimeConfig({ hour: parseInt(e.target.value) })
                        }
                        className="select"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {String(i).padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">分钟</label>
                      <select
                        value={formData.timeConfig.minute}
                        onChange={(e) =>
                          updateTimeConfig({ minute: parseInt(e.target.value) })
                        }
                        className="select"
                      >
                        {[0, 15, 30, 45].map((m) => (
                          <option key={m} value={m}>
                            {String(m).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.scheduleType === "weekly" && (
                    <div>
                      <label className="label">选择星期几</label>
                      <div className="grid grid-cols-7 gap-2">
                        {weekdayNames.map((name, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => toggleWeekday(index)}
                            className={`p-2 rounded-lg text-sm font-medium transition-all ${
                              formData.timeConfig.weekdays?.includes(index)
                                ? "bg-blue-500 text-white shadow-sm"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.scheduleType === "monthly" && (
                    <div>
                      <label className="label">每月第几天</label>
                      <select
                        value={formData.timeConfig.monthday || 1}
                        onChange={(e) =>
                          updateTimeConfig({
                            monthday: parseInt(e.target.value),
                          })
                        }
                        className="select"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(
                          (d) => (
                            <option key={d} value={d}>
                              {d} 日
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">
                      生成的 Cron 表达式:
                    </p>
                    <code className="text-sm font-mono bg-gray-900 text-green-400 px-3 py-2 rounded block">
                      {generateCron()}
                    </code>
                  </div>
                </div>
              )}

              {formData.scheduleType === "custom" && (
                <div>
                  <label className="label label-required">Cron 表达式</label>
                  <input
                    type="text"
                    required
                    value={formData.cron}
                    onChange={(e) =>
                      setFormData({ ...formData, cron: e.target.value })
                    }
                    className="input font-mono text-xs"
                    placeholder="0 0 0 * * * (秒 分 时 日 月 周)"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    格式: 秒 分 时 日 月 周（支持 6 位表达式）
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            type="submit"
            form="task-form"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
