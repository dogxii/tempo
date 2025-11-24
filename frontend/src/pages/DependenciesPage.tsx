import { useEffect, useState } from "react";
import {
  GetDependencies,
  InstallDependency,
  UninstallDependency,
  GetScriptsDir,
} from "../../wailsjs/go/main/App";

interface Dependency {
  name: string;
  version: string;
  type: "npm" | "pip";
}

export default function DependenciesPage() {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [scriptsDir, setScriptsDir] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installType, setInstallType] = useState<"npm" | "pip">("npm");
  const [packageName, setPackageName] = useState("");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deps, dir] = await Promise.all([
        GetDependencies(),
        GetScriptsDir(),
      ]);
      setDependencies(deps as Dependency[]);
      setScriptsDir(dir as string);
    } catch (error) {
      console.error("Failed to load dependencies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    if (!packageName.trim()) return;

    setInstalling(true);
    try {
      await InstallDependency(installType, packageName.trim());
      await loadData();
      setShowInstallModal(false);
      setPackageName("");
    } catch (error) {
      alert("安装失败: " + error);
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstall = async (type: "npm" | "pip", name: string) => {
    if (!confirm(`确定要卸载 ${name} 吗？`)) return;

    try {
      await UninstallDependency(type, name);
      await loadData();
    } catch (error) {
      alert("卸载失败: " + error);
    }
  };

  const npmDeps = dependencies.filter((d) => d.type === "npm");
  const pipDeps = dependencies.filter((d) => d.type === "pip");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">依赖管理</h1>
          <p className="text-sm text-gray-500">
            管理脚本运行所需的 Node.js 和 Python 依赖包
          </p>
        </div>
        <button
          onClick={() => setShowInstallModal(true)}
          className="btn-primary"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          安装依赖
        </button>
      </div>

      {/* 脚本目录信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5"
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
              脚本存放目录
            </p>
            <p className="text-xs text-blue-700 font-mono bg-blue-100 px-2 py-1 rounded">
              {scriptsDir || "加载中..."}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              依赖包将安装到此目录下的 node_modules (Node.js) 和 site-packages
              (Python) 中
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Node.js 依赖 */}
          <DependencySection
            title="Node.js 依赖 (npm)"
            icon="📦"
            dependencies={npmDeps}
            emptyMessage="还没有安装 Node.js 依赖包"
            onUninstall={(name) => handleUninstall("npm", name)}
          />

          {/* Python 依赖 */}
          <DependencySection
            title="Python 依赖 (pip)"
            icon="🐍"
            dependencies={pipDeps}
            emptyMessage="还没有安装 Python 依赖包"
            onUninstall={(name) => handleUninstall("pip", name)}
          />
        </div>
      )}

      {/* 快速安装常用依赖 */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          常用依赖快速安装
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickInstallButton
            name="axios"
            type="npm"
            description="HTTP 请求"
            onInstall={async () => {
              await InstallDependency("npm", "axios");
              await loadData();
            }}
          />
          <QuickInstallButton
            name="moment"
            type="npm"
            description="时间处理"
            onInstall={async () => {
              await InstallDependency("npm", "moment");
              await loadData();
            }}
          />
          <QuickInstallButton
            name="lodash"
            type="npm"
            description="工具函数"
            onInstall={async () => {
              await InstallDependency("npm", "lodash");
              await loadData();
            }}
          />
          <QuickInstallButton
            name="cheerio"
            type="npm"
            description="HTML 解析"
            onInstall={async () => {
              await InstallDependency("npm", "cheerio");
              await loadData();
            }}
          />
          <QuickInstallButton
            name="requests"
            type="pip"
            description="HTTP 请求"
            onInstall={async () => {
              await InstallDependency("pip", "requests");
              await loadData();
            }}
          />
          <QuickInstallButton
            name="beautifulsoup4"
            type="pip"
            description="HTML 解析"
            onInstall={async () => {
              await InstallDependency("pip", "beautifulsoup4");
              await loadData();
            }}
          />
          <QuickInstallButton
            name="pandas"
            type="pip"
            description="数据分析"
            onInstall={async () => {
              await InstallDependency("pip", "pandas");
              await loadData();
            }}
          />
          <QuickInstallButton
            name="selenium"
            type="pip"
            description="浏览器自动化"
            onInstall={async () => {
              await InstallDependency("pip", "selenium");
              await loadData();
            }}
          />
        </div>
      </div>

      {/* 安装依赖弹窗 */}
      {showInstallModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content animate-slide-in max-w-md">
            <div className="modal-header">
              <h2 className="modal-title">安装依赖包</h2>
              <button
                onClick={() => setShowInstallModal(false)}
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleInstall();
                }}
                className="space-y-5"
                id="install-form"
              >
                <div>
                  <label className="label label-required">包管理器</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInstallType("npm")}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        installType === "npm"
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-2">📦</div>
                      <div className="text-sm font-semibold">npm</div>
                      <div className="text-xs text-gray-500">Node.js</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstallType("pip")}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        installType === "pip"
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-2">🐍</div>
                      <div className="text-sm font-semibold">pip</div>
                      <div className="text-xs text-gray-500">Python</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label label-required">包名称</label>
                  <input
                    type="text"
                    required
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="input"
                    placeholder={
                      installType === "npm"
                        ? "例如: axios moment lodash"
                        : "例如: requests beautifulsoup4 pandas"
                    }
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    💡 支持空格分隔安装多个包，例如:{" "}
                    <code className="px-1 py-0.5 bg-gray-100 rounded text-gray-700">
                      axios lodash
                    </code>
                  </p>
                  {packageName.trim() && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-medium text-blue-900 mb-2">
                        将要安装 {packageName.trim().split(/\s+/).length} 个包：
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {packageName
                          .trim()
                          .split(/\s+/)
                          .map((pkg, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                            >
                              {installType === "npm" ? "📦" : "🐍"} {pkg}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    {installType === "npm"
                      ? "将使用 npm install 安装"
                      : "将使用 pip install 安装"}
                  </p>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                form="install-form"
                disabled={installing}
                className="btn-primary disabled:opacity-50"
              >
                {installing ? "安装中..." : "安装"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DependencySectionProps {
  title: string;
  icon: string;
  dependencies: Dependency[];
  emptyMessage: string;
  onUninstall: (name: string) => void;
}

function DependencySection({
  title,
  icon,
  dependencies,
  emptyMessage,
  onUninstall,
}: DependencySectionProps) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">{icon}</span>
        {title}
        <span className="ml-auto text-xs font-normal text-gray-500">
          {dependencies.length} 个
        </span>
      </h3>

      {dependencies.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {dependencies.map((dep) => (
            <div
              key={dep.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {dep.name}
                </div>
                <div className="text-xs text-gray-500">{dep.version}</div>
              </div>
              <button
                onClick={() => onUninstall(dep.name)}
                className="btn-sm btn-danger opacity-0 group-hover:opacity-100 transition-opacity"
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
          ))}
        </div>
      )}
    </div>
  );
}

interface QuickInstallButtonProps {
  name: string;
  type: "npm" | "pip";
  description: string;
  onInstall: () => Promise<void>;
}

function QuickInstallButton({
  name,
  type,
  description,
  onInstall,
}: QuickInstallButtonProps) {
  const [installing, setInstalling] = useState(false);

  const handleClick = async () => {
    setInstalling(true);
    try {
      await onInstall();
    } catch (error) {
      alert("安装失败: " + error);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={installing}
      className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-medium text-gray-900">{name}</div>
        <div className="text-xs text-gray-500">{type}</div>
      </div>
      <div className="text-xs text-gray-500">{description}</div>
      {installing && (
        <div className="text-xs text-blue-600 mt-1">安装中...</div>
      )}
    </button>
  );
}
