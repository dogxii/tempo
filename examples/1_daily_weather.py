#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
每日天气通知脚本

功能：
- 获取指定城市的天气信息
- 格式化输出天气数据
- 通过 [NOTIFY] 发送简洁的天气通知

依赖：
pip install requests

环境变量：
WEATHER_API_KEY - 天气API密钥（可选，使用公开API）
WEATHER_CITY - 城市名称（默认：北京）

定时任务建议：
每天早上 7:00 - Cron: 0 0 7 * * *
"""

import json
import os
from datetime import datetime

import requests

# 配置
CITY = os.getenv("WEATHER_CITY", "北京")
API_KEY = os.getenv("WEATHER_API_KEY", "")

# API 端点（使用免费天气API）
# 示例使用 wttr.in (无需API Key)
WTTR_URL = f"https://wttr.in/{CITY}?format=j1&lang=zh"


def get_weather():
    """获取天气信息"""
    try:
        print(f"正在获取 {CITY} 的天气信息...")

        response = requests.get(WTTR_URL, timeout=10)
        response.raise_for_status()

        data = response.json()
        print("✓ 天气数据获取成功")
        return data
    except requests.exceptions.RequestException as e:
        print(f"✗ 获取天气失败: {e}")
        return None


def parse_weather(data):
    """解析天气数据"""
    if not data:
        return None

    try:
        # 当前天气
        current = data["current_condition"][0]

        # 今天的天气预报
        today = data["weather"][0]

        weather_info = {
            "temp_c": current["temp_C"],
            "feels_like": current["FeelsLikeC"],
            "humidity": current["humidity"],
            "weather_desc": current["lang_zh"][0]["value"],
            "wind_speed": current["windspeedKmph"],
            "wind_dir": current["winddir16Point"],
            "max_temp": today["maxtempC"],
            "min_temp": today["mintempC"],
            "uv_index": today["uvIndex"],
            "sunrise": today["astronomy"][0]["sunrise"],
            "sunset": today["astronomy"][0]["sunset"],
        }

        print("✓ 天气数据解析成功")
        return weather_info
    except (KeyError, IndexError) as e:
        print(f"✗ 解析天气数据失败: {e}")
        return None


def format_weather_notification(city, info):
    """格式化天气通知"""
    if not info:
        return None

    # 温度提示
    temp = int(info["temp_c"])
    if temp < 0:
        temp_tip = "🧊 注意保暖"
    elif temp < 10:
        temp_tip = "🧥 建议多穿衣服"
    elif temp < 20:
        temp_tip = "👔 温度适中"
    elif temp < 30:
        temp_tip = "👕 天气舒适"
    else:
        temp_tip = "🌡️ 注意防暑"

    # 紫外线提示
    uv = int(info["uv_index"])
    if uv <= 2:
        uv_tip = "无需防护"
    elif uv <= 5:
        uv_tip = "需要防护"
    elif uv <= 7:
        uv_tip = "加强防护"
    else:
        uv_tip = "必须防护"

    notification = f"""☀️ {city}天气预报

📅 {datetime.now().strftime("%Y年%m月%d日 %A")}

🌡️ 温度
  当前: {info["temp_c"]}°C (体感 {info["feels_like"]}°C)
  范围: {info["min_temp"]}°C ~ {info["max_temp"]}°C
  {temp_tip}

🌤️ 天气: {info["weather_desc"]}
💧 湿度: {info["humidity"]}%
💨 风速: {info["wind_speed"]} km/h ({info["wind_dir"]})
☀️ 紫外线: {uv} ({uv_tip})

🌅 日出: {info["sunrise"]}
🌇 日落: {info["sunset"]}"""

    return notification


def main():
    """主函数"""
    print("=" * 50)
    print("每日天气通知脚本")
    print("=" * 50)

    # 获取天气
    data = get_weather()
    if not data:
        print("[NOTIFY] ❌ 天气获取失败")
        return 1

    # 解析数据
    info = parse_weather(data)
    if not info:
        print("[NOTIFY] ❌ 天气解析失败")
        return 1

    # 格式化通知
    notification = format_weather_notification(CITY, info)

    # 输出详细信息到日志
    print("\n详细天气信息:")
    print(json.dumps(info, indent=2, ensure_ascii=False))

    # 发送通知
    print("\n" + "=" * 50)
    print("发送通知内容:")
    print("=" * 50)
    for line in notification.split("\n"):
        print(f"[NOTIFY] {line}")

    print("\n✅ 天气通知发送成功")
    return 0


if __name__ == "__main__":
    exit(main())
