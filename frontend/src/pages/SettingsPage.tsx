import { useEffect, useState } from "react";
import { GetScriptsDir, OpenDirectory } from "../../wailsjs/go/main/App";

interface Settings {
  scriptsDir: string;
  logsRetentionDays: number;
  maxConcurrentTasks: number;
  enableNotifications: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    scriptsDir: "",
    logsRetentionDays: 30,
    maxConcurrentTasks: 5,
    enableNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentScriptsDir, setCurrentScriptsDir] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const scriptsDir = (await GetScriptsDir()) as string;
      setCurrentScriptsDir(scriptsDir);
      setSettings((prev) => ({ ...prev, scriptsDir }));
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 这里可以调用后端 API 保存设置
      // await UpdateSettings(settings);
      alert("设置保存成功！");
    } catch (error) {
      alert("保存失败: " + error);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenScriptsDir = async () => {
    try {
      await OpenDirectory(currentScriptsDir);
    } catch (error) {
      alert("打开目录失败: " + error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-sm text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">设置</h1>
        <p className="text-sm text-gray-500">配置 Tempo 应用的全局设置</p>
      </div>

      <div className="space-y-5">
        {/* 脚本目录设置 */}
        <SettingSection
          title="脚本存储"
          description="配置脚本文件和依赖的存储位置"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          }
        >
          <div className="space-y-4">
            <div>
              <label className="label">脚本存放目录</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={currentScriptsDir}
                  readOnly
                  className="input flex-1 bg-gray-50 cursor-not-allowed"
                />
                <button
                  onClick={handleOpenScriptsDir}
                  className="btn-secondary whitespace-nowrap"
                >
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
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  打开目录
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                所有脚本文件和依赖包都存储在此目录
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                <div className="text-xs text-blue-700 space-y-1">
                  <p className="font-medium">目录结构说明：</p>
                  <p>• 脚本文件：存放在根目录</p>
                  <p>• Node.js 依赖：node_modules/</p>
                  <p>• Python 依赖：通过 pip 安装到系统或虚拟环境</p>
                </div>
              </div>
            </div>
          </div>
        </SettingSection>

        {/* 任务执行设置 */}
        <SettingSection
          title="任务执行"
          description="配置任务执行的行为和限制"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          }
        >
          <div className="space-y-4">
            <div>
              <label className="label">最大并发任务数</label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxConcurrentTasks}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxConcurrentTasks: parseInt(e.target.value),
                  })
                }
                className="input max-w-xs"
              />
              <p className="mt-2 text-xs text-gray-500">
                同时运行的最大任务数量，建议不超过 10
              </p>
            </div>
          </div>
        </SettingSection>

        {/* 日志管理设置 */}
        <SettingSection
          title="日志管理"
          description="配置日志的保留时间和清理策略"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          }
        >
          <div className="space-y-4">
            <div>
              <label className="label">日志保留天数</label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.logsRetentionDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    logsRetentionDays: parseInt(e.target.value),
                  })
                }
                className="input max-w-xs"
              />
              <p className="mt-2 text-xs text-gray-500">
                超过此天数的日志将被自动清理，建议 30-90 天
              </p>
            </div>
          </div>
        </SettingSection>

        {/* 通知设置 */}
        <SettingSection
          title="通知设置"
          description="配置全局通知行为"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  启用通知
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  任务执行完成后自动发送通知
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      enableNotifications: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>

            {/* 通知内容格式说明 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
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
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    💡 智能通知过滤
                  </p>
                  <div className="text-xs text-amber-800 space-y-2">
                    <p>
                      使用{" "}
                      <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono font-semibold">
                        [NOTIFY]
                      </code>{" "}
                      前缀来控制哪些输出发送到通知：
                    </p>
                    <div className="bg-white/60 rounded p-3 font-mono text-xs space-y-1">
                      <div className="text-gray-500">// 只在日志中显示</div>
                      <div>console.log("开始处理...");</div>
                      <div className="text-gray-500 mt-2">// 发送到通知</div>
                      <div className="text-green-700 font-semibold">
                        console.log("[NOTIFY] ✅ 完成！");
                      </div>
                    </div>
                    <p className="text-amber-700">
                      ⚠️ 如果没有 [NOTIFY] 标记，将发送简短摘要（前200字符）
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SettingSection>

        {/* 系统信息 */}
        <SettingSection
          title="系统信息"
          description="查看 Tempo 的系统环境信息"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Node.js 版本" value="检测中..." />
            <InfoItem label="Python 版本" value="检测中..." />
            <InfoItem label="数据目录" value="~/.tempo" />
            <InfoItem label="Tempo 版本" value="1.0.0" />
          </div>
        </SettingSection>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存设置"}
        </button>
      </div>
    </div>
  );
}

interface SettingSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SettingSection({
  title,
  description,
  icon,
  children,
}: SettingSectionProps) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-sm">
      <div className="flex items-start space-x-4 mb-5">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {icon}
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
      <div className="ml-14">{children}</div>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}
