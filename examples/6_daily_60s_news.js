#!/usr/bin/env node
/**
 * 60秒早报 - 超简短示例
 * 依赖: npm install axios
 * 定时: 每天早上 8:00 - Cron: 0 0 8 * * *
 */

const axios = require("axios");

(async () => {
  try {
    // 获取数据
    const { data } = await axios.get("https://60s-api.viki.moe/v2/60s");

    if (data.code !== 200) throw new Error(data.message);

    const { date, news, tip, lunar_date, day_of_week } = data.data;

    // 发送通知
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
