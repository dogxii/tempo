#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub 仓库统计脚本

功能：
- 获取 GitHub 仓库的统计信息
- 统计 Star、Fork、Issue 等数据
- 获取最新的 Commit 和 Release
- 发送仓库动态通知

依赖：
pip install requests

环境变量：
GITHUB_TOKEN - GitHub Personal Access Token (可选，提高API限制)
GITHUB_REPOS - 要监控的仓库列表（格式：owner/repo，逗号分隔）

定时任务建议：
每天早上 9:00 - Cron: 0 0 9 * * *
"""

import json
import os
from datetime import datetime, timedelta

import requests

# 配置
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
REPOS = os.getenv("GITHUB_REPOS", "facebook/react,vuejs/vue,sveltejs/svelte")
REPO_LIST = [repo.strip() for repo in REPOS.split(",")]

# GitHub API 基础URL
API_BASE = "https://api.github.com"


def get_headers():
    """获取请求头"""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Tempo-GitHub-Monitor/1.0",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers


def get_repo_info(owner, repo):
    """获取仓库基本信息"""
    try:
        url = f"{API_BASE}/repos/{owner}/{repo}"
        print(f"正在获取 {owner}/{repo} 的信息...")

        response = requests.get(url, headers=get_headers(), timeout=10)
        response.raise_for_status()

        data = response.json()
        print(f"✓ 成功获取仓库信息")

        return {
            "name": data["full_name"],
            "description": data.get("description", "无描述"),
            "stars": data["stargazers_count"],
            "forks": data["forks_count"],
            "watchers": data["watchers_count"],
            "open_issues": data["open_issues_count"],
            "language": data.get("language", "Unknown"),
            "updated_at": data["updated_at"],
            "created_at": data["created_at"],
        }
    except requests.exceptions.RequestException as e:
        print(f"✗ 获取仓库信息失败: {e}")
        return None


def get_latest_commits(owner, repo, count=5):
    """获取最新提交"""
    try:
        url = f"{API_BASE}/repos/{owner}/{repo}/commits"
        params = {"per_page": count}

        response = requests.get(url, headers=get_headers(), params=params, timeout=10)
        response.raise_for_status()

        commits = response.json()
        print(f"✓ 获取到 {len(commits)} 条提交记录")

        result = []
        for commit in commits:
            result.append(
                {
                    "sha": commit["sha"][:7],
                    "message": commit["commit"]["message"].split("\n")[0],
                    "author": commit["commit"]["author"]["name"],
                    "date": commit["commit"]["author"]["date"],
                }
            )
        return result
    except requests.exceptions.RequestException as e:
        print(f"✗ 获取提交记录失败: {e}")
        return []


def get_latest_release(owner, repo):
    """获取最新发布版本"""
    try:
        url = f"{API_BASE}/repos/{owner}/{repo}/releases/latest"

        response = requests.get(url, headers=get_headers(), timeout=10)
        if response.status_code == 404:
            print("  该仓库暂无发布版本")
            return None

        response.raise_for_status()
        data = response.json()
        print(f"✓ 获取到最新版本: {data['tag_name']}")

        return {
            "tag_name": data["tag_name"],
            "name": data.get("name", data["tag_name"]),
            "published_at": data["published_at"],
            "body": data.get("body", "")[:200],  # 只取前200字符
        }
    except requests.exceptions.RequestException as e:
        if "404" not in str(e):
            print(f"✗ 获取发布版本失败: {e}")
        return None


def format_datetime(dt_str):
    """格式化日期时间"""
    try:
        dt = datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%SZ")
        # 转换为相对时间
        now = datetime.utcnow()
        diff = now - dt

        if diff.days > 0:
            return f"{diff.days} 天前"
        elif diff.seconds >= 3600:
            return f"{diff.seconds // 3600} 小时前"
        elif diff.seconds >= 60:
            return f"{diff.seconds // 60} 分钟前"
        else:
            return "刚刚"
    except:
        return dt_str


def check_recent_activity(commits):
    """检查是否有最近的活动"""
    if not commits:
        return False

    latest_commit = commits[0]
    commit_date = datetime.strptime(latest_commit["date"], "%Y-%m-%dT%H:%M:%SZ")
    now = datetime.utcnow()

    # 如果最近24小时有提交
    return (now - commit_date) < timedelta(hours=24)


def analyze_repo(repo_full_name):
    """分析单个仓库"""
    owner, repo = repo_full_name.split("/")

    print(f"\n{'=' * 60}")
    print(f"分析仓库: {repo_full_name}")
    print("=" * 60)

    # 获取仓库信息
    info = get_repo_info(owner, repo)
    if not info:
        return None

    # 获取提交记录
    commits = get_latest_commits(owner, repo, 3)

    # 获取最新版本
    release = get_latest_release(owner, repo)

    # 检查活跃度
    is_active = check_recent_activity(commits)

    return {
        "repo": repo_full_name,
        "info": info,
        "commits": commits,
        "release": release,
        "is_active": is_active,
    }


def main():
    """主函数"""
    print("=" * 60)
    print("GitHub 仓库统计脚本")
    print("=" * 60)
    print(f"监控仓库数: {len(REPO_LIST)}")
    print(f"分析时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    if not GITHUB_TOKEN:
        print("\n⚠️  警告: 未设置 GITHUB_TOKEN，API 调用可能受限")

    # 分析所有仓库
    results = []
    active_repos = []

    for repo in REPO_LIST:
        result = analyze_repo(repo)
        if result:
            results.append(result)
            if result["is_active"]:
                active_repos.append(result)

    if not results:
        print("[NOTIFY] ❌ GitHub 统计失败")
        print("[NOTIFY] 未能获取任何仓库信息")
        return 1

    # 输出详细信息到日志
    print("\n" + "=" * 60)
    print("详细统计结果:")
    print("=" * 60)
    print(json.dumps(results, indent=2, ensure_ascii=False))

    # 构建通知
    print("\n" + "=" * 60)
    print("发送通知:")
    print("=" * 60)

    print("[NOTIFY] 📊 GitHub 仓库统计")
    print("[NOTIFY] ━━━━━━━━━━━━━━━━━━━━")
    print(f"[NOTIFY] 📅 {datetime.now().strftime('%Y年%m月%d日 %A')}")
    print("[NOTIFY] ")

    # 汇总统计
    total_stars = sum(r["info"]["stars"] for r in results)
    total_forks = sum(r["info"]["forks"] for r in results)

    print(f"[NOTIFY] 📈 总体统计 ({len(results)} 个仓库)")
    print(f"[NOTIFY] • Stars: {total_stars:,}")
    print(f"[NOTIFY] • Forks: {total_forks:,}")
    print(f"[NOTIFY] • 活跃仓库: {len(active_repos)} 个")
    print("[NOTIFY] ")

    # 仓库详情
    for result in results:
        info = result["info"]
        commits = result["commits"]
        release = result["release"]
        is_active = result["is_active"]

        # 活跃标记
        activity_mark = "🔥" if is_active else "  "

        print(f"[NOTIFY] {activity_mark} {result['repo']}")
        print(
            f"[NOTIFY] ⭐ {info['stars']:,} stars | "
            f"🔱 {info['forks']:,} forks | "
            f"👀 {info['watchers']:,} watchers"
        )

        # 最新提交
        if commits:
            latest = commits[0]
            print(f"[NOTIFY] 📝 最新提交: {latest['message'][:50]}")
            print(
                f"[NOTIFY]    ({latest['author']} · {format_datetime(latest['date'])})"
            )

        # 最新版本
        if release:
            print(f"[NOTIFY] 🏷️  最新版本: {release['tag_name']}")
            print(f"[NOTIFY]    发布于 {format_datetime(release['published_at'])}")

        print("[NOTIFY] ")

    # 活跃仓库提示
    if active_repos:
        print("[NOTIFY] 🔥 24小时内活跃的仓库:")
        for result in active_repos:
            print(f"[NOTIFY] • {result['repo']}")
        print("[NOTIFY] ")

    print(f"[NOTIFY] ⏰ 统计时间: {datetime.now().strftime('%H:%M:%S')}")
    print("[NOTIFY] ━━━━━━━━━━━━━━━━━━━━")

    print("\n✅ GitHub 统计完成")
    return 0


if __name__ == "__main__":
    exit(main())
