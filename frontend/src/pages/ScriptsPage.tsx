import { useEffect, useState } from "react";
import {
  GetAllScripts,
  CreateScript,
  UpdateScript,
  DeleteScript,
  RunScript,
  SelectFile,
  GetAllLogs,
} from "../../wailsjs/go/main/App";
import { Script, ScriptType, TaskLog } from "../types";
import LogDetailModal from "../components/LogDetailModal";

interface ScriptsPageProps {
  onNavigate: (
    page:
      | "dashboard"
      | "scripts"
      | "tasks"
      | "logs"
      | "notifiers"
      | "dependencies"
      | "environment"
      | "settings",
  ) => void;
}

export default function ScriptsPage({ onNavigate }: ScriptsPageProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<ScriptType | "all">("all");
  const [sendNotify, setSendNotify] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TaskLog | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    try {
      setLoading(true);
      const data = await GetAllScripts();
      setScripts(data as Script[]);
    } catch (error) {
      console.error("Failed to load scripts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingScript(null);
    setShowModal(true);
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个脚本吗？")) return;

    try {
      await DeleteScript(id);
      await loadScripts();
    } catch (error) {
      alert("删除失败: " + error);
    }
  };

  const handleRun = async (id: string) => {
    try {
      setIsRunning(true);
      const beforeTime = new Date().getTime();

      await RunScript(id, sendNotify);

      // 轮询获取最新日志（最多等待10秒）
      let attempts = 0;
      const maxAttempts = 20; // 10秒 (500ms * 20)

      const pollForLog = async () => {
        attempts++;

        try {
          const logs = await GetAllLogs(50);
          const taskLogs = logs as TaskLog[];

          // 查找刚刚创建的日志（在执行后创建的）
          const newLog = taskLogs.find(
            (log) => new Date(log.startTime).getTime() >= beforeTime,
          );

          if (newLog) {
            setSelectedLog(newLog);
            setIsRunning(false);
          } else if (attempts < maxAttempts) {
            setTimeout(pollForLog, 500);
          } else {
            setIsRunning(false);
            alert("日志加载超时，请在日志页面查看结果");
          }
        } catch (error) {
          console.error("Failed to fetch logs:", error);
          if (attempts < maxAttempts) {
            setTimeout(pollForLog, 500);
          } else {
            setIsRunning(false);
            alert("日志加载失败，请在日志页面查看结果");
          }
        }
      };

      // 等待500ms后开始轮询
      setTimeout(pollForLog, 500);
    } catch (error) {
      setIsRunning(false);
      alert("运行失败: " + error);
    }
  };

  const handleSave = async () => {
    await loadScripts();
    setShowModal(false);
  };

  const filteredScripts = scripts.filter((script) => {
    if (filterType === "all") return true;
    return script.scriptType === filterType;
  });

  const scriptTypeCount = {
    all: scripts.length,
    python: scripts.filter((s) => s.scriptType === "python").length,
    nodejs: scripts.filter((s) => s.scriptType === "nodejs").length,
    shell: scripts.filter((s) => s.scriptType === "shell").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">脚本管理</h1>
          <p className="text-sm text-gray-500">管理所有可执行脚本文件</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
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
          添加脚本
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilterType("all")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            filterType === "all"
              ? "bg-gray-900 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          全部{" "}
          <span
            className={filterType === "all" ? "text-white/80" : "text-gray-500"}
          >
            ({scriptTypeCount.all})
          </span>
        </button>
        <button
          onClick={() => setFilterType("python")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            filterType === "python"
              ? "bg-blue-500 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          🐍 Python{" "}
          <span
            className={
              filterType === "python" ? "text-white/80" : "text-gray-500"
            }
          >
            ({scriptTypeCount.python})
          </span>
        </button>
        <button
          onClick={() => setFilterType("nodejs")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            filterType === "nodejs"
              ? "bg-green-500 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          📦 Node.js{" "}
          <span
            className={
              filterType === "nodejs" ? "text-white/80" : "text-gray-500"
            }
          >
            ({scriptTypeCount.nodejs})
          </span>
        </button>
        <button
          onClick={() => setFilterType("shell")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            filterType === "shell"
              ? "bg-purple-500 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          ⚡ Shell{" "}
          <span
            className={
              filterType === "shell" ? "text-white/80" : "text-gray-500"
            }
          >
            ({scriptTypeCount.shell})
          </span>
        </button>
      </div>

      {/* Send Notification Checkbox */}
      <div className="flex items-center space-x-2 bg-white border border-gray-200/80 rounded-lg px-4 py-3 shadow-sm">
        <input
          type="checkbox"
          id="sendNotify"
          checked={sendNotify}
          onChange={(e) => setSendNotify(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
        />
        <label
          htmlFor="sendNotify"
          className="text-sm font-medium text-gray-700 cursor-pointer select-none"
        >
          运行脚本时发送通知
        </label>
        <span className="text-xs text-gray-500 ml-2">
          {sendNotify ? "✅ 将发送通知" : "🔕 不发送通知"}
        </span>
      </div>

      {/* Scripts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScripts.length === 0 ? (
          <div className="col-span-full bg-white border border-gray-200/80 rounded-xl p-16 text-center shadow-sm">
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
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              还没有脚本
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              添加脚本后，可以在定时任务中使用它们
            </p>
            <button onClick={handleCreate} className="btn-primary">
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
              添加第一个脚本
            </button>
          </div>
        ) : (
          filteredScripts.map((script) => (
            <ScriptCard
              key={script.id}
              script={script}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRun={handleRun}
            />
          ))
        )}
      </div>

      {showModal && (
        <ScriptModal
          script={editingScript}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}

      {isRunning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <svg
                className="animate-spin h-6 w-6 text-blue-600"
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
              <span className="text-gray-900 font-medium">
                正在执行脚本，请稍候...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ScriptCardProps {
  script: Script;
  onEdit: (script: Script) => void;
  onDelete: (id: string) => void;
  onRun: (id: string) => void;
}

function ScriptCard({ script, onEdit, onDelete, onRun }: ScriptCardProps) {
  const scriptTypeInfo = {
    python: {
      icon: "🐍",
      name: "Python",
      color: "from-blue-100 to-blue-50 border-blue-200",
      badge: "bg-blue-100 text-blue-700 border-blue-200/50",
    },
    nodejs: {
      icon: "📦",
      name: "Node.js",
      color: "from-green-100 to-green-50 border-green-200",
      badge: "bg-green-100 text-green-700 border-green-200/50",
    },
    shell: {
      icon: "⚡",
      name: "Shell",
      color: "from-purple-100 to-purple-50 border-purple-200",
      badge: "bg-purple-100 text-purple-700 border-purple-200/50",
    },
  };

  const info = scriptTypeInfo[script.scriptType];

  return (
    <div className="group bg-white border border-gray-200/80 rounded-xl p-5 hover:border-gray-300 hover:shadow-lg transition-all duration-300 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
          >
            <span className="text-2xl">{info.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
              {script.name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${info.badge} mt-1`}
            >
              {info.name}
            </span>
          </div>
        </div>
      </div>

      {script.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {script.description}
        </p>
      )}

      <div className="space-y-2 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
            {script.scriptPath ? "脚本路径" : "内联代码"}
          </p>
          <p className="text-sm text-gray-900 font-mono truncate">
            {script.scriptPath || "代码已内联"}
          </p>
        </div>

        {script.tags && script.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {script.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {script.lastRunAt && (
          <div className="text-xs text-gray-500">
            最后运行:{" "}
            {new Date(script.lastRunAt).toLocaleString("zh-CN", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>

      <div className="flex justify-between space-x-2 pt-4 border-t border-gray-200/60">
        <button
          onClick={() => onRun(script.id)}
          className="btn-sm btn-success flex-1"
        >
          <svg
            className="w-3.5 h-3.5 mr-1"
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
          运行
        </button>
        <button onClick={() => onEdit(script)} className="btn-sm btn-secondary">
          <svg
            className="w-3.5 h-3.5"
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
        </button>
        <button
          onClick={() => onDelete(script.id)}
          className="btn-sm btn-danger"
        >
          <svg
            className="w-3.5 h-3.5"
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
        </button>
      </div>
    </div>
  );
}

interface ScriptModalProps {
  script: Script | null;
  onClose: () => void;
  onSave: () => void;
}

function ScriptModal({ script, onClose, onSave }: ScriptModalProps) {
  const [formData, setFormData] = useState({
    name: script?.name || "",
    description: script?.description || "",
    scriptType: script?.scriptType || ("python" as ScriptType),
    scriptPath: script?.scriptPath || "",
    scriptCode: script?.scriptCode || "",
    tags: script?.tags || [],
  });

  const [useCode, setUseCode] = useState(
    !script?.scriptPath && !!script?.scriptCode,
  );
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证：必须有脚本路径或代码
    if (useCode) {
      if (!formData.scriptCode.trim()) {
        alert("请输入脚本代码");
        return;
      }
    } else {
      if (!formData.scriptPath.trim()) {
        alert("请输入脚本路径或选择文件");
        return;
      }
    }

    setSaving(true);

    try {
      const scriptData: any = {
        ...formData,
        scriptPath: useCode ? "" : formData.scriptPath,
        scriptCode: useCode ? formData.scriptCode : "",
      };

      if (script) {
        scriptData.id = script.id;
        await UpdateScript(scriptData);
      } else {
        await CreateScript(scriptData);
      }

      onSave();
    } catch (error) {
      alert("保存失败: " + error);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectFile = async () => {
    try {
      const file = await SelectFile();
      if (file) {
        setFormData({ ...formData, scriptPath: file });
      }
    } catch (error) {
      console.error("File selection failed:", error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content animate-slide-in max-w-3xl">
        <div className="modal-header">
          <h2 className="modal-title">{script ? "编辑脚本" : "添加脚本"}</h2>
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
          <form onSubmit={handleSubmit} className="space-y-6" id="script-form">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label label-required">脚本名称</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input"
                  placeholder="输入脚本名称"
                />
              </div>

              <div>
                <label className="label label-required">脚本类型</label>
                <select
                  value={formData.scriptType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scriptType: e.target.value as ScriptType,
                    })
                  }
                  className="select"
                  required
                >
                  <option value="python">🐍 Python</option>
                  <option value="nodejs">📦 Node.js</option>
                  <option value="shell">⚡ Shell</option>
                </select>
              </div>
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
                placeholder="脚本功能描述（可选）"
              />
            </div>

            <div>
              <label className="label">标签</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="input flex-1"
                  placeholder="添加标签（按回车确认）"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="btn-sm btn-secondary"
                >
                  添加
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1.5 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label label-required">脚本来源</label>
              <div className="flex space-x-4 mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useCode}
                    onChange={() => setUseCode(false)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    文件路径
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={useCode}
                    onChange={() => setUseCode(true)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    内联代码
                  </span>
                </label>
              </div>

              {!useCode ? (
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.scriptPath}
                      onChange={(e) =>
                        setFormData({ ...formData, scriptPath: e.target.value })
                      }
                      className="input flex-1 font-mono text-xs"
                      placeholder="/path/to/script.py"
                    />
                    <button
                      type="button"
                      onClick={handleSelectFile}
                      className="btn-secondary"
                    >
                      浏览...
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    选择本地脚本文件或输入完整路径
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={formData.scriptCode}
                    onChange={(e) =>
                      setFormData({ ...formData, scriptCode: e.target.value })
                    }
                    className="textarea"
                    rows={10}
                    placeholder={`# 在此输入脚本代码\nprint("Hello, Tempo!")`}
                  />
                  <p className="text-xs text-gray-400">
                    直接在此输入脚本代码，执行时将自动创建临时文件
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
            form="script-form"
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
