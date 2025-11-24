import { useEffect, useState } from "react";
import {
  GetEnvironmentVariables,
  SetEnvironmentVariable,
  DeleteEnvironmentVariable,
} from "../../wailsjs/go/main/App";

interface EnvVar {
  key: string;
  value: string;
}

export default function EnvironmentPage() {
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVar, setEditingVar] = useState<EnvVar | null>(null);
  const [formData, setFormData] = useState({ key: "", value: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEnvVars();
  }, []);

  const loadEnvVars = async () => {
    try {
      setLoading(true);
      const data = await GetEnvironmentVariables();
      const vars = Object.entries(data as Record<string, string>).map(
        ([key, value]) => ({ key, value })
      );
      setEnvVars(vars);
    } catch (error) {
      console.error("Failed to load environment variables:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingVar(null);
    setFormData({ key: "", value: "" });
    setShowModal(true);
  };

  const handleEdit = (envVar: EnvVar) => {
    setEditingVar(envVar);
    setFormData({ key: envVar.key, value: envVar.value });
    setShowModal(true);
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`确定要删除环境变量 ${key} 吗？`)) return;

    try {
      await DeleteEnvironmentVariable(key);
      await loadEnvVars();
    } catch (error) {
      alert("删除失败: " + error);
    }
  };

  const handleSave = async () => {
    if (!formData.key.trim()) {
      alert("请输入变量名");
      return;
    }

    setSaving(true);
    try {
      await SetEnvironmentVariable(formData.key.trim(), formData.value);
      await loadEnvVars();
      setShowModal(false);
      setFormData({ key: "", value: "" });
    } catch (error) {
      alert("保存失败: " + error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">环境变量</h1>
          <p className="text-sm text-gray-500">
            管理脚本运行时可以访问的环境变量
          </p>
        </div>
        <button onClick={handleAdd} className="btn-primary">
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
          添加变量
        </button>
      </div>

      {/* 使用说明 */}
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
          <div className="flex-1 text-sm text-blue-700">
            <p className="font-medium mb-2">如何在脚本中使用环境变量：</p>
            <div className="space-y-1 text-xs">
              <p>
                <strong>Node.js:</strong>{" "}
                <code className="bg-blue-100 px-1 py-0.5 rounded">
                  process.env.YOUR_VAR
                </code>
              </p>
              <p>
                <strong>Python:</strong>{" "}
                <code className="bg-blue-100 px-1 py-0.5 rounded">
                  os.getenv('YOUR_VAR')
                </code>
              </p>
              <p>
                <strong>Shell:</strong>{" "}
                <code className="bg-blue-100 px-1 py-0.5 rounded">
                  $YOUR_VAR
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      ) : envVars.length === 0 ? (
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            还没有配置环境变量
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            添加环境变量后，所有脚本都可以访问这些变量
          </p>
          <button onClick={handleAdd} className="btn-primary">
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
            添加第一个环境变量
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    变量名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    值
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {envVars.map((envVar) => (
                  <tr
                    key={envVar.key}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <code className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {envVar.key}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-mono max-w-md truncate">
                        {envVar.value.length > 50
                          ? envVar.value.substring(0, 50) + "..."
                          : envVar.value || "(空值)"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(envVar)}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="编辑"
                        >
                          <svg
                            className="w-4 h-4"
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
                          onClick={() => handleDelete(envVar.key)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="删除"
                        >
                          <svg
                            className="w-4 h-4"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 常用环境变量示例 */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          常用环境变量示例
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ExampleVar name="API_KEY" description="API 密钥" />
          <ExampleVar name="API_SECRET" description="API 密钥" />
          <ExampleVar name="DATABASE_URL" description="数据库连接字符串" />
          <ExampleVar name="WEBHOOK_URL" description="Webhook 地址" />
          <ExampleVar name="MS_COOKIES" description="微软 Cookies" />
          <ExampleVar name="MS_REFRESH_TOKEN" description="微软刷新令牌" />
        </div>
      </div>

      {/* 添加/编辑模态框 */}
      {showModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content animate-slide-in max-w-2xl">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingVar ? "编辑环境变量" : "添加环境变量"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
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
                  handleSave();
                }}
                className="space-y-5"
                id="env-form"
              >
                <div>
                  <label className="label label-required">变量名</label>
                  <input
                    type="text"
                    required
                    value={formData.key}
                    onChange={(e) =>
                      setFormData({ ...formData, key: e.target.value })
                    }
                    disabled={!!editingVar}
                    className="input font-mono"
                    placeholder="例如: API_KEY"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    建议使用大写字母和下划线，例如：API_KEY, DATABASE_URL
                  </p>
                </div>

                <div>
                  <label className="label">变量值</label>
                  <textarea
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    className="input font-mono min-h-[100px]"
                    placeholder="输入变量值"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    敏感信息将加密存储
                  </p>
                </div>

                {!editingVar && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div className="text-xs text-yellow-700">
                        <p className="font-medium">注意：</p>
                        <p>环境变量一旦设置，将对所有脚本生效</p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                form="env-form"
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ExampleVarProps {
  name: string;
  description: string;
}

function ExampleVar({ name, description }: ExampleVarProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
      <div className="flex-1">
        <code className="font-mono text-gray-900">{name}</code>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
