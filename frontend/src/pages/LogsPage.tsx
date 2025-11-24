import { useEffect, useState } from "react";
import { GetAllLogs, GetTaskLogs } from "../../wailsjs/go/main/App";
import { TaskLog } from "../types";
import LogDetailModal from "../components/LogDetailModal";

export default function LogsPage() {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<TaskLog | null>(null);
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5秒刷新一次

  useEffect(() => {
    loadLogs();
    if (autoRefresh) {
      const interval = setInterval(loadLogs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await GetAllLogs(100);
      const sortedLogs = (data as TaskLog[]).sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );
      setLogs(sortedLogs);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "success") return log.success;
    if (filter === "failed") return !log.success;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">执行日志</h1>
          <p className="text-sm text-gray-500">
            查看任务执行历史记录
            {autoRefresh && (
              <span className="ml-2 text-green-600">
                • 自动刷新中 ({refreshInterval / 1000}秒)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn-sm ${autoRefresh ? "btn-success" : "btn-secondary"}`}
            title={autoRefresh ? "关闭自动刷新" : "开启自动刷新"}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {autoRefresh ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
              )}
            </svg>
          </button>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? (
              <span className="inline-flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                刷新中...
              </span>
            ) : (
              <span className="inline-flex items-center">
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                刷新
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 执行中提示 */}
      {logs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                💡 查看长时间运行的脚本
              </p>
              <div className="text-xs text-blue-800 space-y-1">
                <p>• 日志会自动刷新，无需手动刷新页面</p>
                <p>• 脚本执行完成后，点击日志可查看完整输出</p>
                <p>• 如果脚本长时间运行，请耐心等待或检查脚本是否正常</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            filter === "all"
              ? "bg-gray-900 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          全部{" "}
          <span
            className={filter === "all" ? "text-white/80" : "text-gray-500"}
          >
            ({logs.length})
          </span>
        </button>
        <button
          onClick={() => setFilter("success")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            filter === "success"
              ? "bg-emerald-500 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          成功{" "}
          <span
            className={filter === "success" ? "text-white/80" : "text-gray-500"}
          >
            ({logs.filter((l) => l.success).length})
          </span>
        </button>
        <button
          onClick={() => setFilter("failed")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            filter === "failed"
              ? "bg-red-500 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          失败{" "}
          <span
            className={filter === "failed" ? "text-white/80" : "text-gray-500"}
          >
            ({logs.filter((l) => !l.success).length})
          </span>
        </button>
      </div>

      {/* Logs List */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
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
            <p className="text-base font-medium text-gray-900 mb-1">
              暂无日志记录
            </p>
            <p className="text-sm text-gray-500">任务执行后将在此显示</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200/60">
            {filteredLogs.map((log) => (
              <LogItem
                key={log.id}
                log={log}
                onClick={() => setSelectedLog(log)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}

interface LogItemProps {
  log: TaskLog;
  onClick: () => void;
}

function LogItem({ log, onClick }: LogItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 hover:bg-gray-50/80 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-3">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-gray-700">
              {log.taskName}
            </h3>
            {log.success ? (
              <span className="badge-success">成功</span>
            ) : (
              <span className="badge-danger">失败</span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">开始时间</p>
              <p className="text-sm text-gray-900 font-mono">
                {new Date(log.startTime).toLocaleString("zh-CN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">结束时间</p>
              <p className="text-sm text-gray-900 font-mono">
                {new Date(log.endTime).toLocaleString("zh-CN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">执行时长</p>
              <p className="text-sm text-gray-900 font-mono font-semibold">
                {formatDuration(log.duration)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">状态</p>
              <p className="text-sm text-gray-900 font-medium">
                {log.success ? "✅ 成功" : "❌ 失败"}
              </p>
            </div>
          </div>

          {log.error && (
            <div className="mt-3 p-2 bg-red-50 rounded-md border border-red-100">
              <p className="text-xs text-red-700 truncate font-medium">
                错误: {log.error}
              </p>
            </div>
          )}
        </div>

        <div className="ml-4 flex-shrink-0">
          <svg
            className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}
