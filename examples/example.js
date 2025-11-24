#!/usr/bin/env node
/**
 * Tempo 示例 Node.js 脚本
 * 演示如何编写一个可以被 Tempo 定时执行的 Node.js 脚本
 */

const os = require("os");
const path = require("path");
const fs = require("fs");

// 工具函数：延迟执行
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 工具函数：格式化时间
const formatDate = (date) => {
  return date.toISOString().replace("T", " ").substring(0, 19);
};

// 主函数
async function main() {
  console.log("=".repeat(60));
  console.log("📦 Node.js 脚本执行开始");
  console.log("=".repeat(60));

  // 获取当前时间
  const now = new Date();
  console.log(`\n📅 执行时间: ${formatDate(now)}`);

  // 显示 Node.js 版本
  console.log(`🔧 Node.js 版本: ${process.version}`);

  // 显示系统信息
  console.log(`💻 系统平台: ${os.platform()} ${os.arch()}`);
  console.log(`🖥️  主机名: ${os.hostname()}`);
  console.log(`👤 用户: ${os.userInfo().username}`);

  // 显示当前工作目录
  console.log(`📁 工作目录: ${process.cwd()}`);

  // 显示内存使用情况
  const memUsage = process.memoryUsage();
  console.log(
    `💾 内存使用: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
  );

  // 模拟一些异步任务
  console.log("\n🔄 开始执行任务...");
  const tasks = [
    "读取配置文件",
    "连接远程服务",
    "获取数据",
    "处理业务逻辑",
    "保存结果",
  ];

  for (let i = 0; i < tasks.length; i++) {
    process.stdout.write(`  [${i + 1}/${tasks.length}] ${tasks[i]}...`);
    await sleep(500); // 模拟异步操作
    console.log(" ✅ 完成");
  }

  // 生成随机数据
  const randomValue = Math.floor(Math.random() * 100) + 1;
  console.log(`\n📊 生成随机数据: ${randomValue}`);

  // 创建结果对象
  const result = {
    status: "success",
    timestamp: now.toISOString(),
    data: {
      randomValue: randomValue,
      tasksCompleted: tasks.length,
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
    },
  };

  console.log("\n📦 执行结果:");
  console.log(JSON.stringify(result, null, 2));

  // 读取文件示例（如果存在）
  const exampleFile = path.join(process.cwd(), "package.json");
  if (fs.existsSync(exampleFile)) {
    console.log(`\n📄 发现 package.json 文件`);
    try {
      const pkg = JSON.parse(fs.readFileSync(exampleFile, "utf8"));
      console.log(`   项目名称: ${pkg.name || "N/A"}`);
      console.log(`   版本号: ${pkg.version || "N/A"}`);
    } catch (err) {
      console.log(`   读取失败: ${err.message}`);
    }
  }

  // 环境变量示例
  console.log("\n🌍 环境变量示例:");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || "未设置"}`);
  console.log(`   PATH: ${process.env.PATH?.substring(0, 50)}...`);

  console.log("\n" + "=".repeat(60));
  console.log("✨ Node.js 脚本执行完成");
  console.log("=".repeat(60));

  return 0;
}

// 错误处理
process.on("uncaughtException", (err) => {
  console.error("\n❌ 未捕获的异常:", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("\n❌ 未处理的 Promise 拒绝:", reason);
  process.exit(1);
});

// 执行主函数
main()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((err) => {
    console.error("\n❌ 执行错误:", err.message);
    console.error(err.stack);
    process.exit(1);
  });
