import { useEffect, useState } from "react";
import { Stats } from "../types";
import {
  GetAllTasks,
  GetAllLogs,
  GetAllScripts,
} from "../../wailsjs/go/main/App";
import { Task, TaskLog, Script } from "../types";

interface DashboardPageProps {
  stats: Stats | null;
  onNavigate: (page: "dashboard" | "tasks" | "logs" | "notifiers") => void;
}

export default function DashboardPage({
  stats,
  onNavigate,
}: DashboardPageProps) {
  const [recentLogs, setRecentLogs] = useState<TaskLog[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const logs = await GetAllLogs(5);
      setRecentLogs(logs as TaskLog[]);

      const [tasks, scriptsData] = await Promise.all([
        GetAllTasks(),
        GetAllScripts(),
      ]);

      setScripts(scriptsData as Script[]);

      const activeTasks = (tasks as Task[])
        .filter((t) => t.status === "active" && t.nextRunAt)
        .sort((a, b) => {
          if (!a.nextRunAt || !b.nextRunAt) return 0;
          return (
            new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime()
          );
        })
        .slice(0, 5);
      setUpcomingTasks(activeTasks);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const getScriptById = (scriptId: string) => {
    return scripts.find((s) => s.id === scriptId);
  };

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate("tasks")}
          className="group relative overflow-hidden p-5 bg-white border border-gray-200/80 rounded-xl cursor-pointer hover:border-gray-300 hover:shadow-md transition-all duration-300 active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              总任务
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.totalTasks || 0}
            </div>
            <div className="text-xs text-gray-400">全部任务数</div>
          </div>
        </div>
        <div
          onClick={() => onNavigate("tasks")}
          className="group relative overflow-hidden p-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 rounded-xl cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all duration-300 active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/50 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-2">
              活动中
            </div>
            <div className="text-3xl font-bold text-emerald-600 mb-1">
              {stats?.activeTasks || 0}
            </div>
            <div className="text-xs text-emerald-600/60">正在运行</div>
          </div>
        </div>
        <div
          onClick={() => onNavigate("logs")}
          className="group relative overflow-hidden p-5 bg-white border border-gray-200/80 rounded-xl cursor-pointer hover:border-gray-300 hover:shadow-md transition-all duration-300 active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              成功
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.successLogs || 0}
            </div>
            <div className="text-xs text-gray-400">执行成功</div>
          </div>
        </div>
        <div
          onClick={() => onNavigate("logs")}
          className="group relative overflow-hidden p-5 bg-gradient-to-br from-red-50 to-white border border-red-200/80 rounded-xl cursor-pointer hover:border-red-300 hover:shadow-md transition-all duration-300 active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-100/50 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="text-xs font-medium text-red-700 uppercase tracking-wide mb-2">
              失败
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">
              {stats?.failedLogs || 0}
            </div>
            <div className="text-xs text-red-600/60">执行失败</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Tasks */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
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
              <h2 className="text-base font-semibold text-gray-900">
                即将运行
              </h2>
            </div>
            <button
              onClick={() => onNavigate("tasks")}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              查看全部 →
            </button>
          </div>
          <div className="space-y-1.5">
            {upcomingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-gray-400"
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
                <p className="text-sm text-gray-500 font-medium">
                  暂无即将运行的任务
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  创建任务后将在此显示
                </p>
              </div>
            ) : (
              upcomingTasks.map((task) => {
                const script = getScriptById(task.scriptId);
                const scriptTypeIcons = {
                  python: "🐍",
                  nodejs: "📦",
                  shell: "⚡",
                };
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between py-3 px-3 hover:bg-gray-50/80 rounded-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-gray-200 group-hover:to-gray-100 transition-all">
                        <span className="text-lg">
                          {script ? scriptTypeIcons[script.scriptType] : "📄"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-700">
                          {task.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                            {script ? script.name : "未知脚本"}
                          </span>
                        </p>
                      </div>
                    </div>
                    {task.nextRunAt && (
                      <div className="ml-4 text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-blue-600">
                          {formatRelativeTime(task.nextRunAt)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(task.nextRunAt).toLocaleTimeString(
                            "zh-CN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                最近执行
              </h2>
            </div>
            <button
              onClick={() => onNavigate("logs")}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              查看全部 →
            </button>
          </div>
          <div className="space-y-1.5">
            {recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  暂无执行记录
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  任务执行后将在此显示
                </p>
              </div>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-3 px-3 hover:bg-gray-50/80 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        log.success
                          ? "bg-emerald-50 group-hover:bg-emerald-100"
                          : "bg-red-50 group-hover:bg-red-100"
                      }`}
                    >
                      {log.success ? (
                        <svg
                          className="w-5 h-5 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-700">
                          {log.taskName}
                        </p>
                        {log.success ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200/50">
                            成功
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200/50">
                            失败
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>
                          {new Date(log.startTime).toLocaleTimeString("zh-CN")}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="font-mono">{log.duration}ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff < 0) return "已过期";

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天后`;
  if (hours > 0) return `${hours}小时后`;
  if (minutes > 0) return `${minutes}分钟后`;
  return "即将运行";
}
