#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tempo 示例 Python 脚本
演示如何编写一个可以被 Tempo 定时执行的 Python 脚本
"""

import datetime
import json
import os
import random
import sys
import time


def main():
    """主函数"""
    print("=" * 60)
    print("🐍 Python 脚本执行开始")
    print("=" * 60)

    # 获取当前时间
    now = datetime.datetime.now()
    print(f"\n📅 执行时间: {now.strftime('%Y-%m-%d %H:%M:%S')}")

    # 显示 Python 版本
    print(f"🔧 Python 版本: {sys.version}")

    # 显示当前工作目录
    print(f"📁 工作目录: {os.getcwd()}")

    # 显示环境变量示例
    print(f"👤 用户: {os.getenv('USER', 'Unknown')}")
    print(f"🏠 主目录: {os.getenv('HOME', 'Unknown')}")

    # 模拟一些工作
    print("\n🔄 开始执行任务...")
    tasks = ["初始化配置", "连接数据库", "处理数据", "生成报告", "发送通知"]

    for i, task in enumerate(tasks, 1):
        print(f"  [{i}/{len(tasks)}] {task}...", end="", flush=True)
        time.sleep(0.5)  # 模拟耗时操作
        print(" ✅ 完成")

    # 生成随机数据
    random_value = random.randint(1, 100)
    print(f"\n📊 生成随机数据: {random_value}")

    # 创建 JSON 输出
    result = {
        "status": "success",
        "timestamp": now.isoformat(),
        "data": {
            "random_value": random_value,
            "tasks_completed": len(tasks),
            "execution_time": f"{time.time():.2f}s",
        },
    }

    print("\n📦 执行结果:")
    print(json.dumps(result, indent=2, ensure_ascii=False))

    print("\n" + "=" * 60)
    print("✨ Python 脚本执行完成")
    print("=" * 60)

    return 0


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except Exception as e:
        print(f"\n❌ 错误: {str(e)}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        sys.exit(1)
