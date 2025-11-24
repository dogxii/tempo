import { useEffect, useState } from "react";
import {
  GetAllNotifierConfigs,
  CreateNotifierConfig,
  UpdateNotifierConfig,
  DeleteNotifierConfig,
} from "../../wailsjs/go/main/App";
import { NotifierConfig, NotifierType } from "../types";

export default function NotifiersPage() {
  const [configs, setConfigs] = useState<NotifierConfig[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<NotifierConfig | null>(
    null,
  );

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await GetAllNotifierConfigs();
      setConfigs(data as NotifierConfig[]);
    } catch (error) {
      console.error("Failed to load configs:", error);
    }
  };

  const handleCreate = () => {
    setEditingConfig(null);
    setShowModal(true);
  };

  const handleEdit = (config: NotifierConfig) => {
    setEditingConfig(config);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个通知配置吗？")) return;

    try {
      await DeleteNotifierConfig(id);
      await loadConfigs();
    } catch (error) {
      alert("删除失败: " + error);
    }
  };

  const handleSave = async () => {
    await loadConfigs();
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">通知配置</h1>
          <p className="text-sm text-gray-500">管理任务执行通知方式</p>
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
          添加通知
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configs.length === 0 ? (
          <div className="col-span-2 bg-white border border-gray-200/80 rounded-xl p-16 text-center shadow-sm">
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              还没有配置通知
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              添加通知配置后，任务执行完成时将自动发送通知
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
              添加第一个通知配置
            </button>
          </div>
        ) : (
          configs.map((config) => (
            <NotifierCard
              key={config.id}
              config={config}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {showModal && (
        <NotifierModal
          config={editingConfig}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

interface NotifierCardProps {
  config: NotifierConfig;
  onEdit: (config: NotifierConfig) => void;
  onDelete: (id: string) => void;
}

function NotifierCard({ config, onEdit, onDelete }: NotifierCardProps) {
  const typeInfo = {
    dingtalk: {
      icon: "💬",
      name: "钉钉",
      color: "from-blue-100 to-blue-50 border-blue-200",
    },
    wechat: {
      icon: "💚",
      name: "企业微信",
      color: "from-emerald-100 to-emerald-50 border-emerald-200",
    },
    lark: {
      icon: "🕊️",
      name: "飞书",
      color: "from-sky-100 to-sky-50 border-sky-200",
    },
    webhook: {
      icon: "🔗",
      name: "Webhook",
      color: "from-purple-100 to-purple-50 border-purple-200",
    },
    email: {
      icon: "📧",
      name: "邮件",
      color: "from-red-100 to-red-50 border-red-200",
    },
  };

  const info = typeInfo[config.type] || typeInfo.webhook;

  return (
    <div className="group bg-white border border-gray-200/80 rounded-xl p-5 hover:border-gray-300 hover:shadow-lg transition-all duration-300 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
          >
            <span className="text-2xl">{info.icon}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
              {config.name}
            </h3>
            <p className="text-sm text-gray-500">{info.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {config.enabled ? (
            <span className="badge-success">启用</span>
          ) : (
            <span className="badge-gray">禁用</span>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {config.type === "webhook" && config.config.webhook && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
              Webhook URL
            </p>
            <p className="text-sm text-gray-900 font-mono truncate">
              {config.config.webhook}
            </p>
          </div>
        )}
        {config.type === "dingtalk" && config.config.webhook && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
              机器人 Webhook
            </p>
            <p className="text-sm text-gray-900 font-mono truncate">
              {config.config.webhook}
            </p>
          </div>
        )}
        {config.type === "wechat" && config.config.webhook && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
              机器人 Webhook
            </p>
            <p className="text-sm text-gray-900 font-mono truncate">
              {config.config.webhook}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200/60">
        <button onClick={() => onEdit(config)} className="btn-sm btn-secondary">
          <svg
            className="w-3.5 h-3.5 mr-1"
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
          编辑
        </button>
        <button
          onClick={() => onDelete(config.id)}
          className="btn-sm btn-danger"
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
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          删除
        </button>
      </div>
    </div>
  );
}

interface NotifierModalProps {
  config: NotifierConfig | null;
  onClose: () => void;
  onSave: () => void;
}

function NotifierModal({ config, onClose, onSave }: NotifierModalProps) {
  const [formData, setFormData] = useState({
    name: config?.name || "",
    type: config?.type || ("dingtalk" as NotifierType),
    enabled: config?.enabled ?? true,
    config: config?.config || {},
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const configData: any = {
        ...formData,
      };

      if (config) {
        configData.id = config.id;
        await UpdateNotifierConfig(configData);
      } else {
        await CreateNotifierConfig(configData);
      }

      onSave();
    } catch (error) {
      alert("保存失败: " + error);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setFormData({
      ...formData,
      config: { ...formData.config, [key]: value },
    });
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content animate-slide-in max-w-2xl">
        <div className="modal-header">
          <h2 className="modal-title">
            {config ? "编辑通知配置" : "创建通知配置"}
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
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            id="notifier-form"
          >
            <div>
              <label className="label label-required">配置名称</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input"
                placeholder="输入配置名称"
              />
            </div>

            <div>
              <label className="label label-required">通知类型</label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  ["dingtalk", "wechat", "lark", "webhook"] as NotifierType[]
                ).map((type) => {
                  const typeInfo = {
                    dingtalk: { icon: "💬", name: "钉钉" },
                    wechat: { icon: "💚", name: "企业微信" },
                    lark: { icon: "🕊️", name: "飞书" },
                    webhook: { icon: "🔗", name: "Webhook" },
                    email: { icon: "📧", name: "邮件" },
                  };
                  const info = typeInfo[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                        formData.type === type
                          ? "border-gray-900 bg-gray-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-3xl block mb-2">{info.icon}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {info.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dingtalk Config */}
            {formData.type === "dingtalk" && (
              <div className="space-y-4">
                <div>
                  <label className="label label-required">
                    钉钉机器人 Webhook URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.config.webhook || ""}
                    onChange={(e) => updateConfig("webhook", e.target.value)}
                    className="input font-mono text-xs"
                    placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    在钉钉群设置中添加自定义机器人，获取 Webhook 地址
                  </p>
                </div>

                <div>
                  <label className="label">自定义机器人密钥（可选）</label>
                  <input
                    type="text"
                    value={formData.config.secret || ""}
                    onChange={(e) => updateConfig("secret", e.target.value)}
                    className="input font-mono text-xs"
                    placeholder="加签密钥"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    如果机器人启用了加签验证，请填写密钥
                  </p>
                </div>
              </div>
            )}

            {/* Lark Config */}
            {formData.type === "lark" && (
              <div className="space-y-4">
                <div>
                  <label className="label label-required">
                    飞书机器人 Webhook URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.config.webhook || ""}
                    onChange={(e) => updateConfig("webhook", e.target.value)}
                    className="input font-mono text-xs"
                    placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    在飞书群设置中添加自定义机器人，获取 Webhook 地址
                  </p>
                </div>

                <div>
                  <label className="label">自定义机器人密钥（可选）</label>
                  <input
                    type="text"
                    value={formData.config.secret || ""}
                    onChange={(e) => updateConfig("secret", e.target.value)}
                    className="input font-mono text-xs"
                    placeholder="签名校验密钥"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    如果机器人启用了签名校验，请填写密钥
                  </p>
                </div>
              </div>
            )}

            {/* WeChat Config */}
            {formData.type === "wechat" && (
              <div>
                <label className="label label-required">
                  企业微信机器人 Webhook URL
                </label>
                <input
                  type="url"
                  required
                  value={formData.config.webhook || ""}
                  onChange={(e) => updateConfig("webhook", e.target.value)}
                  className="input font-mono text-xs"
                  placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                />
                <p className="mt-2 text-xs text-gray-400">
                  在企业微信群设置中添加机器人，获取 Webhook 地址
                </p>
              </div>
            )}

            {/* Webhook Config */}
            {formData.type === "webhook" && (
              <div>
                <label className="label label-required">Webhook URL</label>
                <input
                  type="url"
                  required
                  value={formData.config.webhook || ""}
                  onChange={(e) => updateConfig("webhook", e.target.value)}
                  className="input font-mono text-xs"
                  placeholder="https://your-webhook-url.com/api/notify"
                />
                <p className="mt-2 text-xs text-gray-400">
                  将发送 POST 请求，包含完整的任务日志 JSON 数据
                </p>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) =>
                  setFormData({ ...formData, enabled: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
                启用此通知配置
              </label>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            type="submit"
            form="notifier-form"
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
