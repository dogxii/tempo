#!/usr/bin/env node
/**
 * 天气通知 - 超简短示例
 * 依赖: npm install axios
 * 环境变量: WEATHER_CITY=北京
 * 定时: 每天早上 7:00 - Cron: 0 0 7 * * *
 */

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
