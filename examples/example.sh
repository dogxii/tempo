#!/bin/bash
# Tempo 示例 Shell 脚本
# 演示如何编写一个可以被 Tempo 定时执行的 Shell 脚本

set -e  # 遇到错误立即退出
# set -x  # 取消注释以显示调试信息

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 打印分隔线
print_separator() {
    echo "============================================================"
}

# 主函数
main() {
    print_separator
    echo "💻 Shell 脚本执行开始"
    print_separator
    echo ""

    # 显示执行时间
    print_info "执行时间: $(date '+%Y-%m-%d %H:%M:%S')"

    # 显示 Shell 版本
    print_info "Shell 版本: $BASH_VERSION"

    # 显示系统信息
    print_info "系统信息: $(uname -s) $(uname -m)"
    print_info "主机名: $(hostname)"
    print_info "用户: $(whoami)"

    # 显示当前工作目录
    print_info "工作目录: $(pwd)"

    # 显示系统负载
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        load=$(sysctl -n vm.loadavg | awk '{print $2, $3, $4}')
        print_info "系统负载: $load"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        load=$(cat /proc/loadavg | awk '{print $1, $2, $3}')
        print_info "系统负载: $load"
    fi

    # 显示磁盘使用情况
    print_info "磁盘使用:"
    df -h / | tail -n 1 | awk '{print "   ", $1, $2, $3, $5, $6}'

    echo ""

    # 模拟一些任务
    print_info "开始执行任务..."

    tasks=(
        "检查系统环境"
        "下载数据文件"
        "处理数据"
        "生成报告"
        "清理临时文件"
    )

    for i in "${!tasks[@]}"; do
        task="${tasks[$i]}"
        printf "  [%d/%d] %s..." "$((i+1))" "${#tasks[@]}" "$task"
        sleep 0.5  # 模拟耗时操作
        echo " ✅ 完成"
    done

    echo ""

    # 生成随机数据
    random_number=$((RANDOM % 100 + 1))
    print_info "生成随机数据: $random_number"

    # 检查某些常用命令是否存在
    echo ""
    print_info "检查环境依赖:"

    commands=("git" "curl" "wget" "python3" "node")
    for cmd in "${commands[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            version=$(command -v "$cmd" && $cmd --version 2>&1 | head -n 1 || echo "未知版本")
            print_success "$cmd: 已安装"
        else
            print_warning "$cmd: 未安装"
        fi
    done

    # 环境变量示例
    echo ""
    print_info "环境变量示例:"
    echo "   HOME: ${HOME:-未设置}"
    echo "   USER: ${USER:-未设置}"
    echo "   SHELL: ${SHELL:-未设置}"
    echo "   PATH: ${PATH:0:50}..."

    # 创建 JSON 格式输出
    echo ""
    print_info "执行结果:"
    cat <<EOF
{
  "status": "success",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "data": {
    "random_value": $random_number,
    "tasks_completed": ${#tasks[@]},
    "shell": "$BASH_VERSION",
    "user": "$(whoami)",
    "hostname": "$(hostname)"
  }
}
EOF

    echo ""
    print_separator
    echo "✨ Shell 脚本执行完成"
    print_separator

    return 0
}

# 错误处理
trap 'echo -e "\n${RED}❌ 脚本执行失败 (行号: $LINENO)${NC}"; exit 1' ERR

# 清理函数（脚本退出时调用）
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        print_error "脚本异常退出，退出码: $exit_code"
    fi
}

trap cleanup EXIT

# 执行主函数
main "$@"
exit $?
