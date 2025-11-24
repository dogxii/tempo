import { TaskLog } from "../types";

interface LogDetailModalProps {
  log: TaskLog;
  onClose: () => void;
}

export default function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content animate-slide-in">
        <div className="modal-header">
          <div className="flex items-center space-x-3">
            <h2 className="modal-title">{log.taskName}</h2>
            {log.success ? (
              <span className="badge-success">成功</span>
            ) : (
              <span className="badge-danger">失败</span>
            )}
          </div>
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

        <div className="modal-body space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                开始时间
              </p>
              <p className="font-semibold text-gray-900 text-sm font-mono">
                {new Date(log.startTime).toLocaleString("zh-CN")}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                结束时间
              </p>
              <p className="font-semibold text-gray-900 text-sm font-mono">
                {new Date(log.endTime).toLocaleString("zh-CN")}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                执行时长
              </p>
              <p className="font-bold text-gray-900 text-sm font-mono">
                {formatDuration(log.duration)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                执行状态
              </p>
              <p className="font-semibold text-gray-900 text-sm">
                {log.success ? "✅ 成功" : "❌ 失败"}
              </p>
            </div>
          </div>

          {/* Error */}
          {log.error && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                错误信息
              </h3>
              <div
                className="bg-red-50 border border-red-200/80 rounded-lg p-4 select-text"
                style={{ userSelect: "text", WebkitUserSelect: "text" }}
              >
                <pre
                  className="text-sm text-red-800 whitespace-pre-wrap font-mono leading-relaxed select-text"
                  style={{ userSelect: "text", WebkitUserSelect: "text" }}
                >
                  {log.error}
                </pre>
              </div>
            </div>
          )}

          {/* Output */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              输出日志
            </h3>
            <div
              className="code-block max-h-96 overflow-y-auto select-text cursor-text"
              style={{ userSelect: "text", WebkitUserSelect: "text" }}
            >
              <pre
                className="code-text select-text"
                style={{ userSelect: "text", WebkitUserSelect: "text" }}
              >
                {log.output || "无输出"}
              </pre>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}
