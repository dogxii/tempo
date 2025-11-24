# Tempo 示例脚本集合

这个目录包含了一系列最佳实践示例脚本，展示如何使用 Tempo 构建实用的自动化任务。

---

## 📚 目录

1. [每日天气通知 (Python)](#1-每日天气通知-python)
2. [网站监控 (Node.js)](#2-网站监控-nodejs)
3. [数据库备份 (Shell)](#3-数据库备份-shell)
4. [GitHub 仓库统计 (Python)](#4-github-仓库统计-python)
5. [磁盘空间监控 (Shell)](#5-磁盘空间监控-shell)
6. [60秒早报 - 超简短示例 (Node.js)](#6-60秒早报---超简短示例-nodejs)
7. [天气通知 - 超简短示例 (Node.js)](#7-天气通知---超简短示例-nodejs)

---

## 1. 每日天气通知 (Python)

**文件**: `1_daily_weather.py`

### 功能

- 获取指定城市的天气信息
- 格式化输出温度、湿度、紫外线等数据
- 提供穿衣和防晒建议
- 发送简洁的天气通知

### 依赖安装

```bash
pip install requests
```

### 环境变量

```bash
WEATHER_CITY=北京        # 城市名称（可选，默认：北京）
WEATHER_API_KEY=xxx      # API密钥（可选，使用免费API）
```

### 定时任务设置

- **建议**: 每天早上 7:00
- **Cron**: `0 0 7 * * *`

### 通知示例

```
☀️ 北京天气预报

📅 2025年01月24日 星期五

🌡️ 温度
  当前: 8°C (体感 5°C)
  范围: 2°C ~ 12°C
  🧥 建议多穿衣服

🌤️ 天气: 晴
💧 湿度: 45%
💨 风速: 12 km/h (N)
☀️ 紫外线: 3 (需要防护)

🌅 日出: 07:32
🌇 日落: 17:48
```

### 使用步骤

1. 在 Tempo 中创建新脚本
2. 选择类型：Python
3. 选择代码方式：文件路径
4. 路径：`/path/to/examples/1_daily_weather.py`
5. 创建定时任务，设置 Cron 为 `0 0 7 * * *`
6. 启用任务

---

## 2. 网站监控 (Node.js)

**文件**: `2_website_monitor.js`

### 功能

- 监控多个网站的可用性
- 检测 HTTP 状态码
- 测量响应时间
- 识别慢响应网站
- 发送异常告警

### 依赖安装

```bash
npm install axios
```

### 环境变量

```bash
# 要监控的URL列表（逗号分隔）
MONITOR_URLS=https://example.com,https://api.example.com

# 超时时间（秒）
MONITOR_TIMEOUT=10
```

### 定时任务设置

- **建议**: 每 5 分钟
- **Cron**: `0 */5 * * * *`

### 通知示例

**正常情况**:

```
✅ 网站监控正常
━━━━━━━━━━━━━━━━━━━━
📊 监控统计
• 总计: 3 个站点
• 正常: 3 个 ✅
• 异常: 0 个 ❌
• 响应慢: 0 个 ⚠️

🎉 所有站点运行正常
📈 平均响应时间: 245ms
⏰ 检查时间: 2025-01-24 14:30:00
```

**异常情况**:

```
🚨 网站监控告警
━━━━━━━━━━━━━━━━━━━━
📊 监控统计
• 总计: 3 个站点
• 正常: 2 个 ✅
• 异常: 1 个 ❌
• 响应慢: 0 个 ⚠️

🚨 异常站点:
• https://api.example.com
  错误: connect ETIMEDOUT
```

### 使用步骤

1. 创建新脚本，选择 Node.js
2. 设置环境变量 `MONITOR_URLS`
3. 创建定时任务，每 5 分钟执行
4. 配置通知（钉钉/飞书）

---

## 3. 数据库备份 (Shell)

**文件**: `3_database_backup.sh`

### 功能

- 自动备份 MySQL 或 PostgreSQL 数据库
- 自动压缩备份文件（gzip）
- 清理旧备份（保留最近 N 天）
- 统计备份大小和耗时
- 发送备份结果通知

### 依赖

- `mysqldump` (MySQL)
- `pg_dump` (PostgreSQL)
- `gzip`

### 环境变量

```bash
# 数据库配置
DB_TYPE=mysql                    # 数据库类型 (mysql/postgres)
DB_HOST=localhost                # 主机
DB_PORT=3306                     # 端口
DB_NAME=mydb                     # 数据库名
DB_USER=root                     # 用户名
DB_PASSWORD=secret               # 密码

# 备份配置
BACKUP_DIR=$HOME/backups         # 备份目录
BACKUP_KEEP_DAYS=7               # 保留天数
```

### 定时任务设置

- **建议**: 每天凌晨 2:00
- **Cron**: `0 0 2 * * *`

### 通知示例

```
✅ 数据库备份成功
━━━━━━━━━━━━━━━━━━━━
📊 备份信息
• 数据库: mydb (mysql)
• 文件大小: 45.3MB
• 耗时: 8秒

📁 备份管理
• 当前备份数: 7 个
• 保留策略: 7 天
• 已清理: 3 个旧备份

📂 备份位置
/Users/you/backups/mydb_20250124_020001.sql.gz

⏰ 备份时间: 2025年01月24日 02:00:08
```

### 使用步骤

1. 给脚本添加执行权限: `chmod +x 3_database_backup.sh`
2. 在 Tempo 中创建脚本（Shell 类型）
3. 配置环境变量（数据库连接信息）
4. 创建定时任务，凌晨 2:00 执行
5. 测试运行，确保备份成功

⚠️ **安全提示**: 数据库密码存储在 `env.json` 中，请妥善保管！

---

## 4. GitHub 仓库统计 (Python)

**文件**: `4_github_stats.py`

### 功能

- 获取 GitHub 仓库统计数据
- 统计 Star、Fork、Watcher 数量
- 获取最新提交记录
- 获取最新发布版本
- 检测 24 小时内的活跃仓库
- 发送仓库动态通知

### 依赖安装

```bash
pip install requests
```

### 环境变量

```bash
# GitHub Personal Access Token（可选，提高 API 限制）
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# 要监控的仓库列表（owner/repo 格式，逗号分隔）
GITHUB_REPOS=facebook/react,vuejs/vue,sveltejs/svelte
```

### 定时任务设置

- **建议**: 每天早上 9:00
- **Cron**: `0 0 9 * * *`

### 通知示例

```
📊 GitHub 仓库统计
━━━━━━━━━━━━━━━━━━━━
📅 2025年01月24日 星期五

📈 总体统计 (3 个仓库)
• Stars: 428,356
• Forks: 88,234
• 活跃仓库: 2 个

🔥 facebook/react
⭐ 218,000 stars | 🔱 45,000 forks | 👀 6,800 watchers
📝 最新提交: Fix bug in useEffect cleanup
   (Dan Abramov · 2 小时前)
🏷️  最新版本: v18.2.0
   发布于 3 天前

  vuejs/vue
⭐ 207,000 stars | 🔱 33,800 forks | 👀 6,200 watchers
📝 最新提交: docs: update migration guide
   (Evan You · 1 天前)
🏷️  最新版本: v3.4.15
   发布于 5 天前

🔥 24小时内活跃的仓库:
• facebook/react
• vuejs/vue

⏰ 统计时间: 09:00:15
```

### GitHub Token 获取

1. 登录 GitHub
2. 进入 Settings > Developer settings > Personal access tokens
3. Generate new token (classic)
4. 勾选 `public_repo` 权限
5. 生成并复制 Token
6. 在 Tempo 环境变量中设置 `GITHUB_TOKEN`

### 使用步骤

1. 创建 Python 脚本
2. 设置环境变量（GITHUB_REPOS 和可选的 GITHUB_TOKEN）
3. 测试运行
4. 创建定时任务

---

## 5. 磁盘空间监控 (Shell)

**文件**: `5_disk_monitor.sh`

### 功能

- 监控磁盘空间使用率
- 检测超过阈值的分区
- 列出大文件和目录
- 分级告警（警告/严重）
- 发送告警通知

### 环境变量

```bash
# 告警阈值百分比（默认：80）
DISK_THRESHOLD=80

# 要监控的挂载点（逗号分隔，为空则监控全部）
DISK_MOUNT_POINTS=/,/home,/data

# 是否查找大文件（yes/no）
DISK_FIND_LARGE_FILES=yes

# 大文件阈值（MB）
DISK_LARGE_FILE_SIZE=100
```

### 定时任务设置

- **建议**: 每小时检查
- **Cron**: `0 0 * * * *`

### 通知示例

**正常情况**:

```
✅ 磁盘空间正常
━━━━━━━━━━━━━━━━━━━━
📊 监控统计
• 总分区数: 3
• 正常: 3 个 ✅
• 警告: 0 个 ⚠️
• 严重: 0 个 🚨

🎉 所有分区空间充足
告警阈值: 80%

⏰ 检查时间: 2025年01月24日 14:00:00
```

**告警情况**:

```
🚨 磁盘空间严重告警
━━━━━━━━━━━━━━━━━━━━
📊 监控统计
• 总分区数: 3
• 正常: 1 个 ✅
• 警告: 1 个 ⚠️
• 严重: 1 个 🚨

🚨 严重告警分区:
• /data
  使用率: 92% | 剩余: 15GB

⚠️ 警告分区:
• /home
  使用率: 85% | 剩余: 48GB

⏰ 检查时间: 2025年01月24日 14:00:00
```

### 使用步骤

1. 给脚本添加执行权限
2. 创建 Shell 脚本
3. 设置告警阈值（可选）
4. 创建定时任务，每小时执行
5. 配置通知接收

---

## 6. 60秒早报 - 超简短示例 (Node.js)

**文件**: `6_daily_60s_news.js`

### 功能

- 获取每日 60 秒早报新闻
- 显示农历日期和星期
- 展示当日金句
- **代码极简，仅 35 行！**

### 依赖安装

```bash
npm install axios
```

### 环境变量

无需配置，开箱即用！

### 定时任务设置

- **建议**: 每天早上 8:00
- **Cron**: `0 0 8 * * *`

### 完整代码

```javascript
const axios = require("axios");

(async () => {
  try {
    const { data } = await axios.get("https://60s-api.viki.moe/v2/60s");
    if (data.code !== 200) throw new Error(data.message);

    const { date, news, tip, lunar_date, day_of_week } = data.data;

    console.log(`[NOTIFY] 📰 60秒早报 - ${date} ${day_of_week}`);
    console.log(`[NOTIFY] 📅 农历: ${lunar_date}`);
    console.log("[NOTIFY] ━━━━━━━━━━━━━━━━━━━━");

    news.forEach((item, i) => {
      console.log(`[NOTIFY] ${i + 1}. ${item}`);
    });

    console.log("[NOTIFY] ");
    console.log(`[NOTIFY] 💡 ${tip}`);
    console.log("[NOTIFY] ━━━━━━━━━━━━━━━━━━━━");
  } catch (err) {
    console.log(`[NOTIFY] ❌ 早报获取失败: ${err.message}`);
    process.exit(1);
  }
})();
```

### 通知示例

```
📰 60秒早报 - 2025-01-24 星期五
📅 农历: 乙巳年十月初五
━━━━━━━━━━━━━━━━━━━━
1. 民政部：前三季度结婚登记数量为 515.2 万对，同比增加 40.5 万对
2. 全国多地流感患者增多，奥司他韦近 7 天销量上涨 237%
3. 全固态电池开发有新进展：电车续航有望突破 1000 公里
4. 网传上海、广州试点 "老头乐" C7 驾照？多地交管部门均已否认
5. 山东博兴一火锅店误将燃料加入汤锅致 11 人入院
... (共 15 条新闻)

💡 当有人试图将你推下高处时，那往往正是你振翅高飞的最佳时机
━━━━━━━━━━━━━━━━━━━━
```

### 特点

- ✅ **代码超短** - 仅 35 行
- ✅ **零配置** - 无需环境变量
- ✅ **纯通知** - 所有输出都用 `[NOTIFY]`
- ✅ **开箱即用** - 复制即可运行

---

## 7. 天气通知 - 超简短示例 (Node.js)

**文件**: `7_simple_weather.js`

### 功能

- 获取指定城市天气
- 显示温度、湿度、风速等
- 显示日出日落时间
- **代码极简，仅 39 行！**

### 依赖安装

```bash
npm install axios
```

### 环境变量

```bash
WEATHER_CITY=北京  # 可选，默认北京
```

### 定时任务设置

- **建议**: 每天早上 7:00
- **Cron**: `0 0 7 * * *`

### 完整代码

```javascript
const axios = require("axios");

(async () => {
  const city = process.env.WEATHER_CITY || "北京";

  try {
    const { data } = await axios.get(
      `https://wttr.in/${city}?format=j1&lang=zh`,
    );

    const curr = data.current_condition[0];
    const today = data.weather[0];

    console.log(`[NOTIFY] ☀️ ${city}天气 - ${new Date().toLocaleDateString()}`);
    console.log("[NOTIFY] ━━━━━━━━━━━━━━━━━━━━");
    console.log(
      `[NOTIFY] 🌡️ 当前: ${curr.temp_C}°C (体感 ${curr.FeelsLikeC}°C)`,
    );
    console.log(`[NOTIFY] 📊 范围: ${today.mintempC}°C ~ ${today.maxtempC}°C`);
    console.log(`[NOTIFY] 🌤️ 天气: ${curr.lang_zh[0].value}`);
    console.log(`[NOTIFY] 💧 湿度: ${curr.humidity}%`);
    console.log(`[NOTIFY] 💨 风速: ${curr.windspeedKmph} km/h`);
    console.log(`[NOTIFY] ☀️ 紫外线: ${today.uvIndex}`);
    console.log(`[NOTIFY] 🌅 日出: ${today.astronomy[0].sunrise}`);
    console.log(`[NOTIFY] 🌇 日落: ${today.astronomy[0].sunset}`);
    console.log("[NOTIFY] ━━━━━━━━━━━━━━━━━━━━");
  } catch (err) {
    console.log(`[NOTIFY] ❌ 天气获取失败: ${err.message}`);
    process.exit(1);
  }
})();
```

### 通知示例

```
☀️ 北京天气 - 2025/1/24
━━━━━━━━━━━━━━━━━━━━
🌡️ 当前: 8°C (体感 5°C)
📊 范围: 2°C ~ 12°C
🌤️ 天气: 晴
💧 湿度: 45%
💨 风速: 12 km/h
☀️ 紫外线: 3
🌅 日出: 07:32
🌇 日落: 17:48
━━━━━━━━━━━━━━━━━━━━
```

### 特点

- ✅ **代码超短** - 仅 39 行
- ✅ **简单配置** - 只需一个城市名
- ✅ **纯通知** - 所有输出都用 `[NOTIFY]`
- ✅ **免费 API** - 无需申请密钥

---

## 📋 最佳实践

### 1. 使用 [NOTIFY] 前缀

所有示例脚本都遵循 `[NOTIFY]` 前缀规范：

```python
# ✅ 正确 - 调试信息只在日志中
print("正在处理数据...")
print(f"API 返回: {response.status_code}")

# ✅ 正确 - 重要结果发送通知
print("[NOTIFY] ✅ 任务完成")
print("[NOTIFY] 处理数据: 100 条")
```

### 2. 错误处理

```python
try:
    result = do_task()
    print("[NOTIFY] ✅ 任务成功")
except Exception as e:
    print(f"[NOTIFY] ❌ 任务失败: {e}")
    sys.exit(1)  # 非零退出码表示失败
```

### 3. 环境变量使用

```python
import os

# 提供默认值
API_KEY = os.getenv("API_KEY", "default_value")

# 必需的环境变量
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    print("[NOTIFY] ❌ 缺少环境变量 API_KEY")
    sys.exit(1)
```

### 4. 通知格式化

```python
# 清晰的层级结构
print("[NOTIFY] 📊 任务汇总")
print("[NOTIFY] ━━━━━━━━━━━━━━━━━━━━")
print("[NOTIFY] 📈 统计信息")
print("[NOTIFY] • 成功: 95")
print("[NOTIFY] • 失败: 5")
print("[NOTIFY] ")
print("[NOTIFY] ⏰ 执行时间: 2025-01-24 14:00:00")
print("[NOTIFY] ━━━━━━━━━━━━━━━━━━━━")
```

### 5. 依赖管理

在 Tempo 的"依赖管理"页面中安装：

```bash
# Python 依赖（一次性安装多个）
requests beautifulsoup4 pandas

# Node.js 依赖
axios lodash moment cheerio
```

### 6. 定时任务建议

| 任务类型               | 建议频率          | Cron 表达式       |
| ---------------------- | ----------------- | ----------------- |
| 天气通知               | 每天早上 7:00     | `0 0 7 * * *`     |
| 网站监控               | 每 5 分钟         | `0 */5 * * * *`   |
| 数据库备份             | 每天凌晨 2:00     | `0 0 2 * * *`     |
| GitHub 统计            | 每天早上 9:00     | `0 0 9 * * *`     |
| 磁盘监控               | 每小时            | `0 0 * * * *`     |
| **60秒早报**           | **每天早上 8:00** | **`0 0 8 * * *`** |
| **天气通知（简短版）** | **每天早上 7:00** | **`0 0 7 * * *`** |

---

## 🔧 脚本对比

### 完整版 vs 简短版

| 对比项         | 完整版 (Python)    | 简短版 (Node.js)   |
| -------------- | ------------------ | ------------------ |
| **代码行数**   | ~170 行            | ~35 行             |
| **功能完整度** | ⭐⭐⭐⭐⭐         | ⭐⭐⭐⭐           |
| **易读性**     | ⭐⭐⭐⭐           | ⭐⭐⭐⭐⭐         |
| **适用场景**   | 生产环境、复杂需求 | 快速上手、简单需求 |
| **优点**       | 功能全面、注释详细 | 代码简洁、易理解   |

### 选择建议

**使用完整版**（示例 1-5）如果你需要：

- ✅ 详细的错误处理
- ✅ 丰富的日志输出
- ✅ 复杂的业务逻辑
- ✅ 生产环境部署

**使用简短版**（示例 6-7）如果你需要：

- ✅ 快速入门学习
- ✅ 简单的定时通知
- ✅ 最小化代码
- ✅ 容易修改和理解

---

## 🔧 自定义脚本

### 超简短模板（推荐新手）

```javascript
#!/usr/bin/env node
const axios = require("axios");

(async () => {
  try {
    // 1. 获取数据
    const { data } = await axios.get("https://api.example.com");

    // 2. 发送通知
    console.log("[NOTIFY] ✅ 任务完成");
    console.log(`[NOTIFY] 结果: ${data.result}`);
  } catch (err) {
    console.log(`[NOTIFY] ❌ 失败: ${err.message}`);
    process.exit(1);
  }
})();
```

### 完整版模板

```python
#!/usr/bin/env python3
"""
脚本说明
"""

import os
import sys

# 配置
CONFIG_VAR = os.getenv("CONFIG_VAR", "default")

def main():
    print("=" * 50)
    print("脚本名称")
    print("=" * 50)

    try:
        # 执行任务
        print("执行任务...")
        result = do_something()

        # 输出详细日志
        print(f"详细结果: {result}")

        # 发送通知
        print("\n" + "=" * 50)
        print("发送通知:")
        print("=" * 50)
        print("[NOTIFY] ✅ 任务成功")
        print("[NOTIFY] 结果: XXX")

        return 0

    except Exception as e:
        print(f"[NOTIFY] ❌ 任务失败: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
```

---

## 📚 相关文档

- [Tempo 项目完整总结](../TEMPO_项目完整总结.md)
- [Wails 文档](https://wails.io)
- [Cron 表达式参考](https://crontab.guru)

---

## 🆘 常见问题

### Q: 脚本执行失败怎么办？

1. 查看执行日志（点击日志查看详情）
2. 检查依赖是否安装（依赖管理页面）
3. 检查环境变量是否配置（环境变量页面）
4. 检查脚本权限（Shell 脚本需要执行权限）

### Q: 没有收到通知？

1. 检查通知配置是否启用
2. 检查脚本是否有 `[NOTIFY]` 输出
3. 测试通知配置（发送测试消息）
4. 查看应用日志是否有错误

### Q: 如何测试脚本？

1. 在脚本管理页面，**不勾选**"运行脚本时发送通知"
2. 点击"运行"按钮
3. 查看日志输出
4. 确认无误后，勾选通知选项正式运行

### Q: 环境变量如何使用？

1. 进入"环境变量"页面
2. 添加变量（如：`API_KEY = xxx`）
3. 在脚本中使用 `os.getenv("API_KEY")` 或 `process.env.API_KEY`
4. 环境变量会自动注入到所有脚本的执行环境中

---

## 💡 贡献示例

欢迎提交新的示例脚本！请确保：

1. ✅ 遵循 `[NOTIFY]` 前缀规范
2. ✅ 包含完整的文档说明
3. ✅ 提供环境变量说明
4. ✅ 建议合适的定时任务配置
5. ✅ 代码注释清晰
6. ✅ 错误处理完善

---

**祝你使用愉快！** 🎉
