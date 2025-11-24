#!/usr/bin/env node
/**
 * 网站监控脚本
 *
 * 功能：
 * - 监控多个网站的可用性
 * - 检测响应时间
 * - 检查HTTP状态码
 * - 发送异常告警
 *
 * 依赖：
 * npm install axios
 *
 * 环境变量：
 * MONITOR_URLS - 要监控的URL列表（逗号分隔）
 * MONITOR_TIMEOUT - 超时时间（秒，默认10）
 *
 * 定时任务建议：
 * 每5分钟 - Cron: 0 */5 * * * *
 */

const axios = require('axios');

// 配置
const URLS = process.env.MONITOR_URLS
  ? process.env.MONITOR_URLS.split(',').map(url => url.trim())
  : [
      'https://www.google.com',
      'https://www.github.com',
      'https://www.baidu.com'
    ];

const TIMEOUT = parseInt(process.env.MONITOR_TIMEOUT || '10') * 1000;

// 结果统计
const results = {
  total: 0,
  success: 0,
  failed: 0,
  slow: 0,
  errors: []
};

/**
 * 检查单个网站
 */
async function checkWebsite(url) {
  const startTime = Date.now();

  console.log(`\n检查网站: ${url}`);

  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT,
      validateStatus: null, // 接受所有状态码
      headers: {
        'User-Agent': 'Tempo-Monitor/1.0'
      }
    });

    const duration = Date.now() - startTime;
    const status = response.status;

    // 判断状态
    const isSuccess = status >= 200 && status < 300;
    const isSlow = duration > 3000;

    console.log(`  状态码: ${status}`);
    console.log(`  响应时间: ${duration}ms`);

    return {
      url,
      status,
      duration,
      success: isSuccess,
      slow: isSlow,
      error: null
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    console.log(`  ✗ 错误: ${error.message}`);

    return {
      url,
      status: 0,
      duration,
      success: false,
      slow: false,
      error: error.message
    };
  }
}

/**
 * 格式化持续时间
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * 获取状态emoji
 */
function getStatusEmoji(result) {
  if (!result.success) return '❌';
  if (result.slow) return '⚠️';
  return '✅';
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('网站监控脚本');
  console.log('='.repeat(60));
  console.log(`监控时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`监控站点数: ${URLS.length}`);
  console.log(`超时设置: ${TIMEOUT / 1000}秒`);

  // 检查所有网站
  const checkResults = [];

  for (const url of URLS) {
    results.total++;
    const result = await checkWebsite(url);
    checkResults.push(result);

    if (result.success) {
      results.success++;
      if (result.slow) {
        results.slow++;
      }
    } else {
      results.failed++;
      results.errors.push({
        url: result.url,
        error: result.error || `HTTP ${result.status}`
      });
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 输出详细结果到日志
  console.log('\n' + '='.repeat(60));
  console.log('详细检查结果:');
  console.log('='.repeat(60));

  checkResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.url}`);
    console.log(`   状态: ${getStatusEmoji(result)}`);
    console.log(`   HTTP: ${result.status || 'N/A'}`);
    console.log(`   耗时: ${formatDuration(result.duration)}`);
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });

  // 构建通知内容
  console.log('\n' + '='.repeat(60));
  console.log('发送通知:');
  console.log('='.repeat(60));

  // 标题
  const title = results.failed > 0
    ? '🚨 网站监控告警'
    : '✅ 网站监控正常';

  console.log(`[NOTIFY] ${title}`);
  console.log('[NOTIFY] ━━━━━━━━━━━━━━━━━━━━');

  // 统计信息
  console.log(`[NOTIFY] 📊 监控统计`);
  console.log(`[NOTIFY] • 总计: ${results.total} 个站点`);
  console.log(`[NOTIFY] • 正常: ${results.success} 个 ✅`);
  console.log(`[NOTIFY] • 异常: ${results.failed} 个 ❌`);
  console.log(`[NOTIFY] • 响应慢: ${results.slow} 个 ⚠️`);

  // 如果有异常，列出详情
  if (results.failed > 0) {
    console.log('[NOTIFY] ');
    console.log('[NOTIFY] 🚨 异常站点:');
    results.errors.forEach(err => {
      console.log(`[NOTIFY] • ${err.url}`);
      console.log(`[NOTIFY]   错误: ${err.error}`);
    });
  }

  // 如果有响应慢的站点
  if (results.slow > 0 && results.failed === 0) {
    console.log('[NOTIFY] ');
    console.log('[NOTIFY] ⚠️ 响应慢的站点:');
    checkResults
      .filter(r => r.slow)
      .forEach(r => {
        console.log(`[NOTIFY] • ${r.url}`);
        console.log(`[NOTIFY]   耗时: ${formatDuration(r.duration)}`);
      });
  }

  // 正常情况下的简要信息
  if (results.failed === 0 && results.slow === 0) {
    console.log('[NOTIFY] ');
    console.log('[NOTIFY] 🎉 所有站点运行正常');

    // 显示平均响应时间
    const avgDuration = checkResults.reduce((sum, r) => sum + r.duration, 0) / checkResults.length;
    console.log(`[NOTIFY] 📈 平均响应时间: ${formatDuration(avgDuration)}`);
  }

  console.log(`[NOTIFY] ⏰ 检查时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('[NOTIFY] ━━━━━━━━━━━━━━━━━━━━');

  // 返回状态码
  return results.failed > 0 ? 1 : 0;
}

// 执行
main()
  .then(code => {
    console.log(`\n✓ 监控完成，退出码: ${code}`);
    process.exit(code);
  })
  .catch(error => {
    console.error('\n✗ 脚本执行失败:', error);
    console.log('[NOTIFY] ❌ 监控脚本执行失败');
    console.log(`[NOTIFY] 错误: ${error.message}`);
    process.exit(1);
  });
