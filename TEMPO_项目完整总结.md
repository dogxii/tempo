# Tempo - 脚本任务调度系统完整总结

> 最后更新时间：2025-11-24
>
> 这是一个基于 Wails v2 (Go + React + TypeScript) 构建的跨平台脚本任务调度管理系统

---

## 📚 目录

- [项目概述](#项目概述)
- [技术架构](#技术架构)
- [核心功能](#核心功能)
- [目录结构](#目录结构)
- [数据模型](#数据模型)
- [后端实现](#后端实现)
- [前端实现](#前端实现)
- [关键特性详解](#关键特性详解)
- [通知系统](#通知系统)
- [依赖管理](#依赖管理)
- [环境变量](#环境变量)
- [UI/UX 优化](#uiux-优化)
- [开发指南](#开发指南)
- [部署说明](#部署说明)
- [常见问题](#常见问题)

---

## 项目概述

### 简介

Tempo 是一个现代化的脚本任务调度管理系统，支持 Python、Node.js、Shell 脚本的定时执行和手动运行。

### 主要特点

- ✅ **跨平台** - macOS、Windows、Linux
- ✅ **多语言支持** - Python、Node.js、Shell
- ✅ **定时任务** - Cron 表达式调度（秒级精度）
- ✅ **通知集成** - 钉钉、企业微信、飞书、Webhook
- ✅ **依赖管理** - npm/pip 包管理
- ✅ **环境变量** - 统一配置管理
- ✅ **实时日志** - 自动刷新、可复制
- ✅ **智能通知** - `[NOTIFY]` 前缀过滤

### 核心价值

1. **统一管理** - 一个平台管理所有自动化脚本
2. **可视化操作** - 无需命令行，图形化界面
3. **灵活调度** - 支持秒级 Cron 表达式
4. **通知可控** - 脚本自主控制通知内容

---

## 技术架构

### 技术栈

#### 后端

- **语言**: Go 1.21+
- **框架**: Wails v2
- **调度器**: robfig/cron v3
- **存储**: BoltDB (嵌入式 KV 数据库)
- **HTTP**: Go 标准库

#### 前端

- **语言**: TypeScript 4.9+
- **框架**: React 18
- **构建**: Vite 3
- **样式**: Tailwind CSS 3
- **图标**: Heroicons

### 架构图

```
┌─────────────────────────────────────────────┐
│              Wails Application               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │   Frontend   │◄────►│     Backend     │ │
│  │ React + TS   │      │    Go + Wails   │ │
│  └──────────────┘      └─────────────────┘ │
│         │                      │            │
│         │                      ▼            │
│         │              ┌─────────────────┐ │
│         │              │    Storage      │ │
│         │              │    (BoltDB)     │ │
│         │              └─────────────────┘ │
│         │                      │            │
│         ▼                      ▼            │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │   UI Pages   │      │   Scheduler     │ │
│  │  Components  │      │   (Cron Jobs)   │ │
│  └──────────────┘      └─────────────────┘ │
│                                │            │
│                                ▼            │
│                        ┌─────────────────┐ │
│                        │    Executor     │ │
│                        │  (Run Scripts)  │ │
│                        └─────────────────┘ │
│                                │            │
│                                ▼            │
│                        ┌─────────────────┐ │
│                        │    Notifier     │ │
│                        │ (Send Messages) │ │
│                        └─────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 核心功能

### 1. 脚本管理

#### 功能列表

- ✅ 创建/编辑/删除脚本
- ✅ 支持文件路径或内联代码
- ✅ 脚本分类（Python/Node.js/Shell）
- ✅ 标签管理
- ✅ 手动运行（可选通知）
- ✅ 执行日志查看

#### 支持的脚本类型

| 类型        | 解释器    | 文件扩展名 | 特点               |
| ----------- | --------- | ---------- | ------------------ |
| **Python**  | `python3` | `.py`      | 科学计算、数据处理 |
| **Node.js** | `node`    | `.js`      | 异步 IO、Web 请求  |
| **Shell**   | `bash/sh` | `.sh`      | 系统操作、命令组合 |

#### 运行机制

```
点击运行按钮
    ↓
检查"发送通知"复选框状态
    ↓
调用 RunScript(id, sendNotify)
    ↓
后台 goroutine 执行脚本
    ↓
├─ 设置工作目录 = ~/.tempo/scripts
├─ 设置 NODE_PATH / PYTHONPATH
├─ 注入环境变量 (env.json)
└─ 执行脚本并捕获输出
    ↓
保存执行日志到 BoltDB
    ↓
如果 sendNotify = true
    ↓
提取 [NOTIFY] 内容发送通知
    ↓
跳转到日志页面（自动刷新）
```

### 2. 定时任务

#### 功能特性

- ✅ Cron 表达式调度（秒级精度）
- ✅ 快捷预设（每分钟、每小时、每天等）
- ✅ 启用/禁用任务
- ✅ 立即运行
- ✅ 执行历史查看

#### Cron 表达式格式

```
秒 分 时 日 月 周
│  │  │  │  │  │
│  │  │  │  │  └─ 0-6 (0=周日)
│  │  │  │  └──── 1-12
│  │  │  └─────── 1-31
│  │  └────────── 0-23
│  └───────────── 0-59
└──────────────── 0-59
```

#### 预设示例

| 预设        | Cron 表达式     | 说明           |
| ----------- | --------------- | -------------- |
| 每分钟      | `0 * * * * *`   | 每分钟的第0秒  |
| 每小时      | `0 0 * * * *`   | 每小时的0分0秒 |
| 每天 0:00   | `0 0 0 * * *`   | 每天午夜       |
| 每周一 9:00 | `0 0 9 * * 1`   | 周一早上9点    |
| 工作日 9:00 | `0 0 9 * * 1-5` | 周一至周五9点  |

### 3. 执行日志

#### 日志信息

- 📝 任务名称
- ⏰ 开始/结束时间
- ⏱️ 执行时长
- ✅/❌ 执行状态
- 📄 完整输出
- 🚨 错误信息

#### 自动刷新

- 🔄 默认每 5 秒自动刷新
- ⏸️ 可手动暂停/恢复
- 🔍 过滤器（全部/成功/失败）
- 📊 点击查看详情

#### 日志存储

- 位置：`~/.tempo/logs.db`
- 格式：BoltDB 键值对
- 限制：默认保留最近 100 条

---

## 目录结构

```
tempo/
├── app/                          # 主应用目录
│   ├── app.go                   # 主应用逻辑
│   ├── main.go                  # 入口文件
│   ├── internal/                # 内部模块
│   │   ├── executor/           # 脚本执行器
│   │   │   └── executor.go
│   │   ├── models/             # 数据模型
│   │   │   └── models.go
│   │   ├── notifier/           # 通知发送器
│   │   │   ├── notifier.go
│   │   │   ├── dingtalk.go
│   │   │   ├── wechat.go
│   │   │   ├── lark.go
│   │   │   └── webhook.go
│   │   ├── scheduler/          # 任务调度器
│   │   │   └── scheduler.go
│   │   └── storage/            # 数据存储
│   │       └── storage.go
│   ├── frontend/               # 前端代码
│   │   ├── src/
│   │   │   ├── App.tsx        # 主应用组件
│   │   │   ├── style.css      # 全局样式
│   │   │   ├── types.ts       # TypeScript 类型
│   │   │   ├── components/    # 公共组件
│   │   │   │   └── LogDetailModal.tsx
│   │   │   └── pages/         # 页面组件
│   │   │       ├── DashboardPage.tsx
│   │   │       ├── ScriptsPage.tsx
│   │   │       ├── TasksPage.tsx
│   │   │       ├── LogsPage.tsx
│   │   │       ├── NotifiersPage.tsx
│   │   │       ├── DependenciesPage.tsx
│   │   │       ├── EnvironmentPage.tsx
│   │   │       └── SettingsPage.tsx
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── wailsjs/           # Wails 生成的绑定
│   └── wails.json              # Wails 配置
├── build/                       # 构建产物
├── docs/                        # 文档
├── examples/                    # 示例脚本
└── README.md                    # 项目说明
```

### 数据目录结构

```
~/.tempo/                        # 用户数据目录
├── scripts/                     # 脚本存放目录
│   ├── node_modules/           # npm 依赖
│   ├── package.json            # npm 配置
│   └── *.py, *.js, *.sh       # 脚本文件
├── scripts.db                   # 脚本数据
├── tasks.db                     # 任务数据
├── logs.db                      # 日志数据
├── notifiers.db                 # 通知配置
├── env.json                     # 环境变量
└── fallback_mac.json           # MAC 地址缓存
```

---

## 数据模型

### Script（脚本）

```go
type Script struct {
    ID          string     `json:"id"`
    Name        string     `json:"name"`
    Description string     `json:"description"`
    ScriptType  ScriptType `json:"scriptType"` // python/nodejs/shell
    ScriptPath  string     `json:"scriptPath"` // 文件路径
    ScriptCode  string     `json:"scriptCode"` // 内联代码
    Tags        []string   `json:"tags"`
    CreatedAt   time.Time  `json:"createdAt"`
    UpdatedAt   time.Time  `json:"updatedAt"`
    LastRunAt   *time.Time `json:"lastRunAt"`
}
```

### Task（定时任务）

```go
type Task struct {
    ID          string     `json:"id"`
    Name        string     `json:"name"`
    Description string     `json:"description"`
    ScriptID    string     `json:"scriptId"`
    CronExpr    string     `json:"cronExpr"`    // Cron 表达式
    Status      TaskStatus `json:"status"`      // active/inactive
    CreatedAt   time.Time  `json:"createdAt"`
    UpdatedAt   time.Time  `json:"updatedAt"`
    LastRunAt   *time.Time `json:"lastRunAt"`
    NextRunAt   *time.Time `json:"nextRunAt"`
}
```

### TaskLog（执行日志）

```go
type TaskLog struct {
    ID        string    `json:"id"`
    TaskID    string    `json:"taskId"`
    TaskName  string    `json:"taskName"`
    StartTime time.Time `json:"startTime"`
    EndTime   time.Time `json:"endTime"`
    Duration  int64     `json:"duration"`  // 毫秒
    Output    string    `json:"output"`    // 标准输出
    Error     string    `json:"error"`     // 错误信息
    Success   bool      `json:"success"`   // 执行状态
}
```

### NotifierConfig（通知配置）

```go
type NotifierConfig struct {
    ID        string                 `json:"id"`
    Name      string                 `json:"name"`
    Type      NotifierType           `json:"type"` // dingtalk/wechat/lark/webhook
    Config    map[string]interface{} `json:"config"`
    Enabled   bool                   `json:"enabled"`
    CreatedAt time.Time              `json:"createdAt"`
    UpdatedAt time.Time              `json:"updatedAt"`
}
```

---

## 后端实现

### 1. Executor（脚本执行器）

#### 核心功能

```go
type Executor struct {
    scriptsDir string
}

func (e *Executor) Execute(scriptType, path, code string) ExecuteResult {
    // 1. 确定执行命令
    var cmd *exec.Cmd
    switch scriptType {
    case "python":
        cmd = exec.Command("python3", tempFile)
    case "nodejs":
        cmd = exec.Command("node", tempFile)
    case "shell":
        cmd = exec.Command("bash", tempFile)
    }

    // 2. 设置工作目录
    cmd.Dir = e.scriptsDir

    // 3. 设置环境变量
    cmd.Env = append(os.Environ(),
        "NODE_PATH="+nodePath,
        "PYTHONPATH="+pythonPath,
        // 加载 env.json 中的变量
    )

    // 4. 执行并捕获输出
    output, err := cmd.CombinedOutput()

    return ExecuteResult{
        Output:  string(output),
        Error:   errMsg,
        Success: err == nil,
    }
}
```

#### 环境变量注入

```go
// 加载 ~/.tempo/env.json
envVars := loadEnvVars()

// 注入到脚本环境
for key, value := range envVars {
    cmd.Env = append(cmd.Env, key+"="+value)
}
```

### 2. Scheduler（任务调度器）

#### 核心功能

```go
type Scheduler struct {
    cron     *cron.Cron
    storage  *storage.Storage
    executor *executor.Executor
    tasks    map[string]*models.Task
}

func (s *Scheduler) Start() error {
    // 加载所有激活任务
    tasks := s.storage.GetAllTasks()

    for _, task := range tasks {
        if task.Status == models.TaskStatusActive {
            s.AddTask(task)
        }
    }

    s.cron.Start()
    return nil
}

func (s *Scheduler) AddTask(task *models.Task) error {
    entryID, err := s.cron.AddFunc(task.CronExpr, func() {
        s.executeTask(task)
    })

    task.NextRunAt = s.cron.Entry(entryID).Next
    return nil
}
```

#### 执行流程

```go
func (s *Scheduler) executeTask(task *models.Task) {
    // 1. 获取脚本
    script := s.storage.GetScript(task.ScriptID)

    // 2. 执行脚本
    startTime := time.Now()
    result := s.executor.Execute(
        script.ScriptType,
        script.ScriptPath,
        script.ScriptCode,
    )

    // 3. 保存日志
    log := &models.TaskLog{
        TaskID:    task.ID,
        TaskName:  task.Name,
        StartTime: startTime,
        EndTime:   time.Now(),
        Duration:  time.Since(startTime).Milliseconds(),
        Output:    result.Output,
        Error:     result.Error,
        Success:   result.Success,
    }
    s.storage.SaveLog(log)

    // 4. 发送通知
    if s.notifier != nil {
        s.notifier.Notify(log)
    }

    // 5. 更新下次运行时间
    task.LastRunAt = &startTime
    s.storage.SaveTask(task)
}
```

### 3. Notifier（通知发送器）

#### 智能通知过滤

```go
// extractNotifyContent 提取带 [NOTIFY] 前缀的内容
func extractNotifyContent(taskLog *models.TaskLog) string {
    var notifyLines []string

    // 处理输出内容
    if taskLog.Output != "" {
        lines := strings.Split(taskLog.Output, "\n")
        for _, line := range lines {
            // 查找 [NOTIFY] 前缀（不区分大小写）
            if strings.Contains(strings.ToUpper(line), "[NOTIFY]") {
                // 移除 [NOTIFY] 前缀并添加到结果
                cleaned := strings.TrimSpace(
                    strings.Replace(line, "[NOTIFY]", "", 1)
                )
                if cleaned != "" {
                    notifyLines = append(notifyLines, cleaned)
                }
            }
        }
    }

    // 如果有错误，总是包含错误信息
    if taskLog.Error != "" {
        if len(notifyLines) > 0 {
            notifyLines = append(notifyLines, "")
        }
        notifyLines = append(notifyLines, "❌ 错误: "+taskLog.Error)
    }

    return strings.Join(notifyLines, "\n")
}

// buildDefaultSummary 构建默认摘要（当没有 [NOTIFY] 内容时）
func buildDefaultSummary(taskLog *models.TaskLog) string {
    status := "✅ 成功"
    if !taskLog.Success {
        status = "❌ 失败"
    }

    summary := fmt.Sprintf("%s %s\n", status, taskLog.TaskName)
    summary += fmt.Sprintf("执行时长: %dms\n", taskLog.Duration)

    if taskLog.Error != "" {
        summary += fmt.Sprintf("\n错误: %s", taskLog.Error)
    } else {
        // 只显示前 200 个字符的输出
        output := taskLog.Output
        if len(output) > 200 {
            output = output[:200] + "..."
        }
        if output != "" {
            summary += fmt.Sprintf("\n输出:\n%s", output)
        }
    }

    return summary
}
```

#### 飞书通知实现

```go
func (n *Notifier) sendLark(config *models.NotifierConfig, taskLog *models.TaskLog) error {
    webhook := config.Config["webhook"].(string)

    // 提取 [NOTIFY] 内容
    content := extractNotifyContent(taskLog)

    // 如果没有 [NOTIFY] 内容，使用默认摘要
    if content == "" {
        content = buildDefaultSummary(taskLog)
    }

    message := map[string]interface{}{
        "msg_type": "text",
        "content": map[string]string{
            "text": content,
        },
    }

    return n.sendHTTPRequest(webhook, message)
}
```

### 4. Storage（数据存储）

#### BoltDB 使用

```go
type Storage struct {
    db *bolt.DB
}

func (s *Storage) SaveScript(script *models.Script) error {
    return s.db.Update(func(tx *bolt.Tx) error {
        bucket := tx.Bucket([]byte("scripts"))
        data, err := json.Marshal(script)
        if err != nil {
            return err
        }
        return bucket.Put([]byte(script.ID), data)
    })
}

func (s *Storage) GetScript(id string) (*models.Script, error) {
    var script models.Script
    err := s.db.View(func(tx *bolt.Tx) error {
        bucket := tx.Bucket([]byte("scripts"))
        data := bucket.Get([]byte(id))
        if data == nil {
            return errors.New("script not found")
        }
        return json.Unmarshal(data, &script)
    })
    return &script, err
}
```

---

## 前端实现

### 1. 组件结构

#### App.tsx（主应用）

```tsx
function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(224);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage stats={stats} onNavigate={setCurrentPage} />;
      case "scripts":
        return <ScriptsPage onNavigate={setCurrentPage} />;
      case "tasks":
        return <TasksPage onStatsUpdate={loadStats} />;
      case "logs":
        return <LogsPage />;
      // ... 其他页面
    }
  };

  return (
    <div className="flex h-screen">
      {/* 侧边栏 */}
      <aside
        className="select-none cursor-default"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* 导航菜单 */}
      </aside>

      {/* 主内容区 */}
      <main className="flex-1">{renderPage()}</main>
    </div>
  );
}
```

#### ScriptsPage.tsx（脚本管理）

```tsx
function ScriptsPage({ onNavigate }: ScriptsPageProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [sendNotify, setSendNotify] = useState(false);

  const handleRun = async (id: string) => {
    await RunScript(id, sendNotify);
    alert("脚本已开始执行");
    onNavigate("logs");
  };

  return (
    <div>
      {/* 是否发送通知复选框 */}
      <div>
        <input
          type="checkbox"
          checked={sendNotify}
          onChange={(e) => setSendNotify(e.target.checked)}
        />
        <label>运行脚本时发送通知</label>
      </div>

      {/* 脚本列表 */}
      {scripts.map((script) => (
        <ScriptCard key={script.id} script={script} onRun={handleRun} />
      ))}
    </div>
  );
}
```

#### LogsPage.tsx（执行日志）

```tsx
function LogsPage() {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  useEffect(() => {
    loadLogs();
    if (autoRefresh) {
      const interval = setInterval(loadLogs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return (
    <div>
      {/* 自动刷新控制 */}
      <button onClick={() => setAutoRefresh(!autoRefresh)}>
        {autoRefresh ? "暂停" : "播放"}
      </button>

      {/* 日志列表 */}
      {logs.map((log) => (
        <LogItem key={log.id} log={log} onClick={() => setSelectedLog(log)} />
      ))}

      {/* 日志详情弹窗 */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
```

### 2. 样式系统

#### Tailwind CSS 配置

```css
/* 按钮系统 */
.btn {
  @apply px-3 py-1.5 text-sm font-medium rounded-md border 
         transition-all duration-150 select-none;
}

.btn-primary {
  @apply btn bg-gray-900 text-white border-transparent 
         hover:bg-gray-800 active:scale-[0.98];
}

/* 代码块 */
.code-block {
  @apply bg-gray-900 rounded-lg p-4 overflow-x-auto select-text cursor-text;
  user-select: text !important;
  -webkit-user-select: text !important;
}

/* 文字选中高亮 */
::selection {
  background-color: rgba(59, 130, 246, 0.3); /* 蓝色 */
  color: inherit;
}

.code-block ::selection,
pre ::selection {
  background-color: rgba(34, 197, 94, 0.4); /* 绿色 */
  color: inherit;
}

/* 可拖动区域 */
[style*="--wails-draggable: drag"] {
  cursor: default !important;
  user-select: none !important;
  -webkit-app-region: drag;
}

/* 可拖动区域内的按钮 */
[style*="--wails-draggable: drag"] button {
  cursor: pointer !important;
  -webkit-app-region: no-drag;
}
```

---

## 关键特性详解

### 1. 智能通知过滤

#### 脚本编写规范

```javascript
// ❌ 错误做法 - 所有输出都会发送到通知
console.log("开始处理数据...");
console.log("API 响应:", response);
console.log("任务完成！处理了 100 条数据");
// 结果：收到一条包含所有输出的长通知

// ✅ 正确做法 - 只发送重要结果
console.log("开始处理数据..."); // 只在日志中
console.log("API 响应:", response); // 只在日志中
console.log("[NOTIFY] ✅ 任务完成！"); // 发送到通知
console.log("[NOTIFY] 📊 处理数据: 100条"); // 发送到通知
console.log("[NOTIFY] 成功: 95 | 失败: 5"); // 发送到通知
// 结果：收到一条简洁的汇总通知
```

#### Python 示例

```python
import requests

# 调试信息 - 不发送通知
print("开始爬取数据...")
response = requests.get(url)
print(f"状态码: {response.status_code}")

# 处理数据
data = process_data(response.json())

# 重要结果 - 发送通知
print("[NOTIFY] 🎯 数据爬取完成")
print(f"[NOTIFY] 📊 获取 {len(data)} 条数据")
print(f"[NOTIFY] ✅ 成功保存到数据库")
```

#### Node.js 示例

```javascript
const axios = require("axios");

// 调试日志
console.log("开始执行任务...");
console.log("请求 API:", apiUrl);

// 执行任务
const result = await doTask();

// 通知汇总
console.log("[NOTIFY] 🎉 微软积分任务完成");
console.log(`[NOTIFY] 成功:${result.success} 失败:${result.failed}`);
console.log(`[NOTIFY] 总获积分: ${result.totalEarned}分`);
```

### 2. 长时间脚本处理

#### 问题场景

```
脚本执行时间：10 分钟
如果每个步骤都用 [NOTIFY]：
  → 收到 10+ 条零散通知 ❌
```

#### 解决方案

```javascript
// ✅ 正确：边执行边输出调试日志
console.log("步骤 1: 开始处理账号A...");
console.log("步骤 2: PC搜索完成");
console.log("步骤 3: 移动搜索完成");
console.log("步骤 4: 账号A完成");
console.log("步骤 5: 开始处理账号B...");
// ... 所有步骤

// ✅ 正确：最后发送一次完整汇总
console.log("[NOTIFY] 🎯 微软积分 - 2024-01-24");
console.log("[NOTIFY] ━━━━━━━━━━━━━━━━━━━━");
console.log("[NOTIFY] 📊 执行概况");
console.log("[NOTIFY] • 总账号: 3");
console.log("[NOTIFY] • 成功: 2 ✅");
console.log("[NOTIFY] • 失败: 1 ❌");
console.log("[NOTIFY] • 总获积分: 250 💰");
// 结果：只收到一条完整通知 ✅
```

### 3. 依赖管理

#### npm 依赖

```bash
# 单个安装
npm install axios

# 批量安装（空格分隔）
npm install axios lodash moment cheerio

# 查看已安装
npm list --depth=0
```

#### pip 依赖

```bash
# 单个安装
pip3 install requests

# 批量安装
pip3 install requests beautifulsoup4 pandas selenium

# 查看已安装
pip3 freeze
```

#### 前端操作

```
1. 打开"依赖管理"页面
2. 点击"安装依赖"
3. 选择包管理器（npm/pip）
4. 输入包名（支持空格分隔多个）
   例如: axios lodash moment
5. 点击"安装"
6. 等待安装完成
```

#### 实时预览

```
┌──────────────────────────────────────┐
│ 包名称 *                              │
│ ┌──────────────────────────────────┐ │
│ │ axios lodash moment              │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 💡 支持空格分隔安装多个包             │
│                                      │
│ 将要安装 3 个包：                     │
│ 📦 axios  📦 lodash  📦 moment       │
└──────────────────────────────────────┘
```

### 4. 环境变量

#### 配置方式

```
1. 打开"环境变量"页面
2. 点击"添加变量"
3. 输入变量名和值
4. 保存
```

#### 使用示例

**添加变量：**

```
API_KEY = sk-abc123xyz
DATABASE_URL = postgres://localhost/mydb
WEBHOOK_URL = https://hooks.example.com/xxx
```

**在脚本中使用：**

```python
# Python
import os
api_key = os.getenv('API_KEY')
db_url = os.getenv('DATABASE_URL')
```

```javascript
// Node.js
const apiKey = process.env.API_KEY;
const dbUrl = process.env.DATABASE_URL;
```

```bash
# Shell
echo $API_KEY
curl -H "Authorization: Bearer $API_KEY" $WEBHOOK_URL
```

#### 存储位置

```
~/.tempo/env.json

{
  "API_KEY": "sk-abc123xyz",
  "DATABASE_URL": "postgres://localhost/mydb",
  "WEBHOOK_URL": "https://hooks.example.com/xxx"
}
```

⚠️ **注意**：env.json 是明文存储，敏感信息请小心处理！

### 5. 实时日志

#### 自动刷新机制

```typescript
const [autoRefresh, setAutoRefresh] = useState(true);
const [refreshInterval, setRefreshInterval] = useState(5000);

useEffect(() => {
  loadLogs();
  if (autoRefresh) {
    const interval = setInterval(loadLogs, refreshInterval);
    return () => clearInterval(interval);
  }
}, [autoRefresh, refreshInterval]);
```

#### 用户控制

```
┌──────────────────────────────────────┐
│ 执行日志        [⏸暂停] [🔄刷新]     │
│ 查看任务执行历史 • 自动刷新中 (5秒)   │
└──────────────────────────────────────┘

点击 [⏸暂停] → 停止自动刷新
点击 [▶播放] → 恢复自动刷新
点击 [🔄刷新] → 立即手动刷新
```

#### 日志查看流程

```
运行脚本
  ↓
跳转到日志页面
  ↓
每 5 秒自动刷新
  ↓
看到新日志出现
  ↓
点击日志查看详情
  ↓
弹窗显示完整输出
  ↓
可以选中复制文字
```

---

## 通知系统

### 支持的通知类型

| 类型         | 名称     | 配置项                     |
| ------------ | -------- | -------------------------- |
| **dingtalk** | 钉钉     | Webhook URL, Secret (可选) |
| **wechat**   | 企业微信 | Webhook URL                |
| **lark**     | 飞书     | Webhook URL, Secret (可选) |
| **webhook**  | 自定义   | Webhook URL                |

### 配置示例

#### 钉钉机器人

```
1. 创建钉钉群
2. 添加自定义机器人
3. 获取 Webhook URL
4. 如启用签名，复制 Secret
5. 在 Tempo 中添加通知配置
```

#### 飞书机器人

```
1. 创建飞书群
2. 添加自定义机器人
3. 获取 Webhook URL
4. 如启用签名，复制 Secret
5. 在 Tempo 中添加通知配置
```

### 通知内容格式

#### 带 [NOTIFY] 的输出

```
脚本输出：
开始执行任务...
处理第 1 个账号...
[NOTIFY] ✅ 账号1 完成
处理第 2 个账号...
[NOTIFY] ✅ 账号2 完成
[NOTIFY] 🎉 所有任务完成
[NOTIFY] 总获积分: 250分

通知内容：
✅ 账号1 完成
✅ 账号2 完成
🎉 所有任务完成
总获积分: 250分
```

#### 没有 [NOTIFY] 的输出

```
脚本输出：
开始执行任务...
处理数据中...
任务完成！

通知内容：
✅ 成功 任务名称
执行时长: 1234ms

输出:
开始执行任务...
处理数据中...
任务完成！
```

---

## UI/UX 优化

### 文字选择

#### 可选中区域

- ✅ 日志输出（code-block, pre）
- ✅ 脚本描述（p, span）
- ✅ 文件路径（font-mono）
- ✅ 错误信息
- ✅ 表格数据
- ✅ 输入框内容
- ✅ 弹窗正文

#### 不可选中区域

- ❌ 标题（h1-h6）
- ❌ 按钮（button）
- ❌ 徽章（badge）
- ❌ 导航（nav）
- ❌ 侧边栏
- ❌ 标签（label）
- ❌ 表头（table-th）

#### 选中高亮

```css
/* 普通文本 - 蓝色高亮 */
::selection {
  background-color: rgba(59, 130, 246, 0.3);
}

/* 代码块 - 绿色高亮 */
.code-block ::selection,
pre ::selection {
  background-color: rgba(34, 197, 94, 0.4);
}
```

### 光标样式

| 区域     | 光标          | 说明       |
| -------- | ------------- | ---------- |
| 侧边栏   | `→` 默认箭头  | 可拖动窗口 |
| 导航按钮 | `👆` 手型     | 可点击     |
| 内容区域 | `I` 文本光标  | 可选中     |
| 调整边框 | `↔` 调整光标 | 可调整宽度 |
| 顶部区域 | `→` 默认箭头  | 可拖动窗口 |

### 可拖动区域

```css
/* 可拖动区域 */
[style*="--wails-draggable: drag"] {
  cursor: default !important;
  user-select: none !important;
  -webkit-app-region: drag;
}

/* 可拖动区域内的按钮保持手型光标 */
[style*="--wails-draggable: drag"] button {
  cursor: pointer !important;
  -webkit-app-region: no-drag;
}
```

---

## 开发指南

### 环境准备

#### 必需软件

- Go 1.21+
- Node.js 18+
- Wails CLI
- Python 3.8+（运行 Python 脚本）

#### 安装 Wails

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### 项目初始化

```bash
# 克隆项目
git clone <repo-url>
cd tempo

# 安装前端依赖
cd app/frontend
npm install

# 返回根目录
cd ../..
```

### 开发命令

```bash
# 开发模式（热重载）
wails dev

# 构建应用
wails build

# 只构建前端
cd app/frontend
npm run build

# 只构建后端
cd app
go build
```

### 生成 Wails 绑定

```bash
# 修改 app.go 后需要重新生成绑定
wails generate module
```

### 目录说明

```
app/
├── app.go              # 后端 API 入口
├── main.go             # 应用入口
├── internal/           # 内部模块
│   ├── executor/      # ← 修改脚本执行逻辑
│   ├── models/        # ← 修改数据模型
│   ├── notifier/      # ← 修改通知逻辑
│   ├── scheduler/     # ← 修改调度逻辑
│   └── storage/       # ← 修改存储逻辑
└── frontend/
    └── src/
        ├── pages/     # ← 修改页面 UI
        ├── components/ # ← 修改公共组件
        └── style.css  # ← 修改全局样式
```

### 添加新功能

#### 1. 添加后端 API

```go
// app/app.go

// 添加新方法
func (a *App) MyNewFunction(param string) (string, error) {
    // 实现逻辑
    return result, nil
}
```

#### 2. 重新生成绑定

```bash
wails generate module
```

#### 3. 前端调用

```typescript
// app/frontend/src/pages/MyPage.tsx
import { MyNewFunction } from "../../wailsjs/go/main/App";

const result = await MyNewFunction("test");
```

### 调试技巧

#### 后端调试

```go
// 使用 log 打印
log.Printf("Debug: %+v", someVariable)

// 使用 runtime.EventsEmit 发送事件到前端
runtime.EventsEmit(a.ctx, "debug", debugInfo)
```

#### 前端调试

```typescript
// 控制台输出
console.log("Debug:", data);

// 使用 React DevTools
// Chrome 扩展：React Developer Tools
```

---

## 部署说明

### 构建发布版本

```bash
# macOS
wails build -platform darwin/universal

# Windows
wails build -platform windows/amd64

# Linux
wails build -platform linux/amd64
```

### 产物位置

```
build/bin/
├── tempo.app          # macOS
├── tempo.exe          # Windows
└── tempo              # Linux
```

### 数据迁移

#### 备份数据

```bash
# 备份整个数据目录
cp -r ~/.tempo ~/.tempo.backup

# 或只备份数据库
cp ~/.tempo/*.db ~/backup/
```

#### 恢复数据

```bash
# 恢复整个目录
cp -r ~/.tempo.backup ~/.tempo

# 或只恢复数据库
cp ~/backup/*.db ~/.tempo/
```

### 升级注意事项

1. **备份数据** - 升级前务必备份 `~/.tempo` 目录
2. **清理缓存** - 删除旧版本的应用缓存
3. **重新安装依赖** - 如有 breaking changes
4. **检查日志** - 启动后检查是否有错误

---

## 常见问题

### 1. 脚本执行失败

#### 问题：Python/Node 命令找不到

```bash
# 检查 Python
which python3

# 检查 Node
which node

# 确保在 PATH 中
export PATH=$PATH:/usr/local/bin
```

#### 问题：依赖包找不到

```bash
# 检查 npm 依赖
cd ~/.tempo/scripts
npm list

# 检查 pip 依赖
pip3 freeze
```

### 2. 通知发送失败

#### 问题：Webhook URL 无效

```
检查：
1. URL 是否正确
2. 网络是否可达
3. Secret 是否正确（如果启用）
```

#### 问题：没有收到通知

```
检查：
1. 通知配置是否启用
2. 脚本是否有 [NOTIFY] 输出
3. 查看应用日志是否有错误
```

### 3. 定时任务不执行

#### 问题：Cron 表达式错误

```
验证 Cron 表达式：
秒 分 时 日 月 周

示例：
0 0 9 * * *     # 每天 9:00
0 */30 * * * *  # 每 30 分钟
0 0 0 * * 1     # 每周一 0:00
```

#### 问题：任务状态未激活

```
检查：
1. 任务是否启用（绿色开关）
2. 调度器是否运行（状态栏显示"运行中"）
```

### 4. 日志无法选中复制

#### 已修复

```
修复方式：
1. 为 code-block 添加 select-text
2. 添加内联样式强制可选中
3. 设置 cursor: text

现在可以正常选中复制了 ✅
```

### 5. 环境变量不生效

#### 问题：变量未注入

```
检查：
1. env.json 格式是否正确
2. 变量名是否拼写正确
3. 脚本是否正确读取环境变量

测试脚本：
# Python
import os
print(os.environ.get('MY_VAR'))

# Node.js
console.log(process.env.MY_VAR)
```

### 6. 窗口拖动问题

#### 已修复

```
修复内容：
1. 侧边栏可拖动
2. 顶部栏可拖动
3. 按钮区域不可拖动
4. 光标样式正确显示

使用体验：
- 拖动区域：默认箭头光标 →
- 按钮：手型光标 👆
- 文本：文本光标 I
```

---

## 最佳实践

### 脚本编写

#### 1. 使用 [NOTIFY] 控制通知

```javascript
// ✅ 推荐
console.log("调试信息: 开始处理...");
console.log("[NOTIFY] 📊 处理完成: 100条数据");

// ❌ 避免
console.log("处理完成: 100条数据"); // 所有输出都发通知
```

#### 2. 错误处理

```javascript
try {
  // 执行任务
  const result = await doTask();
  console.log("[NOTIFY] ✅ 任务成功");
} catch (error) {
  console.error("[NOTIFY] ❌ 任务失败:", error.message);
  throw error; // 确保脚本退出码非 0
}
```

#### 3. 输出格式化

```javascript
// ✅ 清晰的格式
console.log("[NOTIFY] 🎯 任务汇总");
console.log("[NOTIFY] ━━━━━━━━━━━━");
console.log("[NOTIFY] • 成功: 95");
console.log("[NOTIFY] • 失败: 5");
console.log("[NOTIFY] • 总计: 100");

// ❌ 混乱的格式
console.log("[NOTIFY] 成功95失败5总计100");
```

### 定时任务设置

#### 1. 合理的执行频率

```
❌ 避免：每秒执行 (0 * * * * *)
✅ 推荐：至少每分钟 (0 * * * * *)

原因：
- 避免系统负载过高
- 减少日志数据量
- 降低通知频率
```

#### 2. 错峰执行

```
❌ 避免：所有任务都在 0:00 执行
✅ 推荐：分散到不同时间

示例：
任务 A: 0 0 0 * * *   (0:00)
任务 B: 0 0 1 * * *   (1:00)
任务 C: 0 30 8 * * *  (8:30)
```

### 通知配置

#### 1. 分组管理

```
开发环境：
- 使用测试群
- 启用详细日志

生产环境：
- 使用正式群
- 只发送关键信息
```

#### 2. 通知去重

```javascript
// 避免重复通知
let lastNotifyTime = 0;
const now = Date.now();

if (now - lastNotifyTime > 60000) {
  // 1分钟内不重复
  console.log("[NOTIFY] 通知内容");
  lastNotifyTime = now;
}
```

---

## 版本历史

### v1.0.0 (2025-01-24)

**核心功能**

- ✅ 脚本管理（Python/Node.js/Shell）
- ✅ 定时任务（Cron 调度）
- ✅ 执行日志（实时刷新）
- ✅ 通知集成（钉钉/企微/飞书/Webhook）
- ✅ 依赖管理（npm/pip）
- ✅ 环境变量管理

**UI/UX**

- ✅ 文字选中优化（蓝/绿高亮）
- ✅ 光标样式优化
- ✅ 可拖动窗口
- ✅ 侧边栏宽度调整
- ✅ 深色代码主题

**智能特性**

- ✅ `[NOTIFY]` 前缀过滤
- ✅ 自动刷新日志（5秒）
- ✅ 批量安装依赖（空格分隔）
- ✅ 运行前通知开关

**优化改进**

- ✅ 长时间脚本支持
- ✅ 日志可选中复制
- ✅ 选中高亮显示
- ✅ 通知智能过滤

---

## 未来规划

### 短期（v1.1）

- [ ] 脚本版本控制
- [ ] 任务依赖关系
- [ ] 失败自动重试
- [ ] 邮件通知支持
- [ ] 日志导出功能

### 中期（v1.2）

- [ ] 脚本模板市场
- [ ] 多用户权限管理
- [ ] Web 远程管理
- [ ] Docker 镜像支持
- [ ] API 接口开放

### 长期（v2.0）

- [ ] 分布式调度
- [ ] 集群部署
- [ ] 可视化流程编排
- [ ] AI 辅助编写脚本
- [ ] 性能监控告警

---

## 贡献指南

### 提交 Issue

```markdown
## 问题描述

简要描述问题

## 复现步骤

1. 步骤一
2. 步骤二
3. 步骤三

## 期望行为

应该怎样

## 实际行为

实际怎样

## 环境信息

- OS: macOS 14.1
- Tempo 版本: v1.0.0
- Go 版本: 1.21
- Node 版本: 18.17
```

### 提交 PR

```bash
# Fork 项目
git clone <your-fork>

# 创建分支
git checkout -b feature/my-feature

# 提交修改
git commit -m "feat: add new feature"

# 推送分支
git push origin feature/my-feature

# 创建 Pull Request
```

### 代码规范

- Go: `gofmt`
- TypeScript: `prettier`
- Commit: Conventional Commits

---

## 许可证

MIT License

---

## 联系方式

- 项目地址: [GitHub]()
- 问题反馈: [Issues]()
- 文档: [Wiki]()

---

**感谢使用 Tempo！** 🎉

如有问题或建议，欢迎提交 Issue 或 PR。
