#!/bin/bash
################################################################################
# 磁盘空间监控脚本
#
# 功能：
# - 监控磁盘空间使用率
# - 检测超过阈值的分区
# - 列出大文件和目录
# - 发送告警通知
#
# 依赖：
# - df (磁盘使用情况)
# - du (目录大小)
# - find (查找大文件)
#
# 环境变量：
# DISK_THRESHOLD - 告警阈值百分比（默认：80）
# DISK_MOUNT_POINTS - 要监控的挂载点（逗号分隔，默认：全部）
# DISK_FIND_LARGE_FILES - 是否查找大文件（yes/no，默认：yes）
# DISK_LARGE_FILE_SIZE - 大文件阈值（MB，默认：100）
#
# 定时任务建议：
# 每小时检查 - Cron: 0 0 * * * *
################################################################################

set -e

# 配置
THRESHOLD="${DISK_THRESHOLD:-80}"
MOUNT_POINTS="${DISK_MOUNT_POINTS:-}"
FIND_LARGE_FILES="${DISK_FIND_LARGE_FILES:-yes}"
LARGE_FILE_SIZE="${DISK_LARGE_FILE_SIZE:-100}"  # MB
MAX_LARGE_FILES=10

# 颜色定义（用于日志）
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 结果统计
TOTAL_PARTITIONS=0
WARNING_PARTITIONS=0
CRITICAL_PARTITIONS=0
declare -a WARNING_LIST
declare -a CRITICAL_LIST

################################################################################
# 函数定义
################################################################################

# 日志函数
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# 错误日志
error_log() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# 警告日志
warn_log() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 成功日志
success_log() {
    echo -e "${GREEN}[OK]${NC} $1"
}

# 格式化字节为人类可读格式
format_bytes() {
    local bytes=$1
    local sizes=("B" "KB" "MB" "GB" "TB")
    local size_index=0
    local size=$bytes

    while (( $(echo "$size >= 1024" | bc -l) )) && (( size_index < ${#sizes[@]} - 1 )); do
        size=$(echo "scale=2; $size / 1024" | bc)
        ((size_index++))
    done

    echo "${size}${sizes[$size_index]}"
}

# 获取磁盘使用情况
get_disk_usage() {
    log "开始检查磁盘使用情况..."

    # 获取所有挂载点或指定挂载点
    if [ -n "$MOUNT_POINTS" ]; then
        IFS=',' read -ra MOUNT_ARRAY <<< "$MOUNT_POINTS"
        for mount in "${MOUNT_ARRAY[@]}"; do
            df -h "$mount" 2>/dev/null || warn_log "挂载点 $mount 不存在"
        done
    else
        df -h | grep -E '^/dev/'
    fi
}

# 检查单个分区
check_partition() {
    local device=$1
    local size=$2
    local used=$3
    local avail=$4
    local use_percent=$5
    local mount=$6

    # 移除百分号
    use_percent_num=${use_percent%?}

    TOTAL_PARTITIONS=$((TOTAL_PARTITIONS + 1))

    log "检查分区: $mount ($device)"
    log "  大小: $size | 已用: $used | 可用: $avail | 使用率: $use_percent"

    # 判断状态
    if [ "$use_percent_num" -ge 90 ]; then
        error_log "  ⚠️  CRITICAL: 使用率超过 90%"
        CRITICAL_PARTITIONS=$((CRITICAL_PARTITIONS + 1))
        CRITICAL_LIST+=("$mount|$use_percent|$avail")
    elif [ "$use_percent_num" -ge "$THRESHOLD" ]; then
        warn_log "  ⚠️  WARNING: 使用率超过 ${THRESHOLD}%"
        WARNING_PARTITIONS=$((WARNING_PARTITIONS + 1))
        WARNING_LIST+=("$mount|$use_percent|$avail")
    else
        success_log "  ✓ 正常"
    fi
}

# 查找大文件
find_large_files() {
    local mount_point=$1

    log "在 $mount_point 中查找大于 ${LARGE_FILE_SIZE}MB 的文件..."

    # 查找大文件（限制搜索深度避免太慢）
    find "$mount_point" -type f -size +${LARGE_FILE_SIZE}M \
        -not -path "*/\.*" \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -exec ls -lh {} \; 2>/dev/null | \
        awk '{print $5, $9}' | \
        head -n "$MAX_LARGE_FILES"
}

# 查找大目录
find_large_dirs() {
    local mount_point=$1

    log "在 $mount_point 中查找最大的目录..."

    # 只搜索一级目录，避免太慢
    du -h -d 1 "$mount_point" 2>/dev/null | \
        sort -hr | \
        head -n 10
}

################################################################################
# 主流程
################################################################################

main() {
    echo "========================================"
    echo "磁盘空间监控脚本"
    echo "========================================"
    log "监控开始"
    log "告警阈值: ${THRESHOLD}%"

    # 获取磁盘使用情况
    echo ""
    log "获取磁盘使用情况..."

    # 解析 df 输出
    while IFS= read -r line; do
        # 跳过标题行
        if [[ $line == Filesystem* ]]; then
            continue
        fi

        # 解析列
        read -r device size used avail use_percent mount <<< "$line"

        # 检查分区
        check_partition "$device" "$size" "$used" "$avail" "$use_percent" "$mount"

    done < <(get_disk_usage)

    # 输出统计
    echo ""
    echo "========================================"
    echo "检查结果统计"
    echo "========================================"
    log "总分区数: $TOTAL_PARTITIONS"
    log "正常分区: $((TOTAL_PARTITIONS - WARNING_PARTITIONS - CRITICAL_PARTITIONS))"
    log "警告分区: $WARNING_PARTITIONS"
    log "严重分区: $CRITICAL_PARTITIONS"

    # 如果有告警，查找大文件和目录
    if [ "$CRITICAL_PARTITIONS" -gt 0 ] || [ "$WARNING_PARTITIONS" -gt 0 ]; then
        if [ "$FIND_LARGE_FILES" = "yes" ]; then
            echo ""
            log "分析告警分区的大文件和目录..."

            # 分析严重分区
            for item in "${CRITICAL_LIST[@]}"; do
                IFS='|' read -r mount use_percent avail <<< "$item"
                echo ""
                echo "----------------------------------------"
                log "分析分区: $mount"
                echo "----------------------------------------"

                # 大目录
                echo "最大的目录:"
                find_large_dirs "$mount"

                echo ""
                # 大文件
                echo "大文件 (>${LARGE_FILE_SIZE}MB):"
                find_large_files "$mount"
            done

            # 分析警告分区
            for item in "${WARNING_LIST[@]}"; do
                IFS='|' read -r mount use_percent avail <<< "$item"
                echo ""
                echo "----------------------------------------"
                log "分析分区: $mount (警告)"
                echo "----------------------------------------"

                # 只查找大目录
                echo "最大的目录:"
                find_large_dirs "$mount" | head -n 5
            done
        fi
    fi

    # 发送通知
    echo ""
    echo "========================================"
    echo "发送通知:"
    echo "========================================"

    # 判断整体状态
    if [ "$CRITICAL_PARTITIONS" -gt 0 ]; then
        echo "[NOTIFY] 🚨 磁盘空间严重告警"
    elif [ "$WARNING_PARTITIONS" -gt 0 ]; then
        echo "[NOTIFY] ⚠️ 磁盘空间警告"
    else
        echo "[NOTIFY] ✅ 磁盘空间正常"
    fi

    echo "[NOTIFY] ━━━━━━━━━━━━━━━━━━━━"
    echo "[NOTIFY] 📊 监控统计"
    echo "[NOTIFY] • 总分区数: $TOTAL_PARTITIONS"
    echo "[NOTIFY] • 正常: $((TOTAL_PARTITIONS - WARNING_PARTITIONS - CRITICAL_PARTITIONS)) 个 ✅"
    echo "[NOTIFY] • 警告: $WARNING_PARTITIONS 个 ⚠️"
    echo "[NOTIFY] • 严重: $CRITICAL_PARTITIONS 个 🚨"
    echo "[NOTIFY] "

    # 严重告警详情
    if [ "$CRITICAL_PARTITIONS" -gt 0 ]; then
        echo "[NOTIFY] 🚨 严重告警分区:"
        for item in "${CRITICAL_LIST[@]}"; do
            IFS='|' read -r mount use_percent avail <<< "$item"
            echo "[NOTIFY] • $mount"
            echo "[NOTIFY]   使用率: $use_percent | 剩余: $avail"
        done
        echo "[NOTIFY] "
    fi

    # 警告详情
    if [ "$WARNING_PARTITIONS" -gt 0 ]; then
        echo "[NOTIFY] ⚠️ 警告分区:"
        for item in "${WARNING_LIST[@]}"; do
            IFS='|' read -r mount use_percent avail <<< "$item"
            echo "[NOTIFY] • $mount"
            echo "[NOTIFY]   使用率: $use_percent | 剩余: $avail"
        done
        echo "[NOTIFY] "
    fi

    # 如果一切正常
    if [ "$CRITICAL_PARTITIONS" -eq 0 ] && [ "$WARNING_PARTITIONS" -eq 0 ]; then
        echo "[NOTIFY] 🎉 所有分区空间充足"
        echo "[NOTIFY] 告警阈值: ${THRESHOLD}%"
        echo "[NOTIFY] "
    fi

    echo "[NOTIFY] ⏰ 检查时间: $(date +'%Y年%m月%d日 %H:%M:%S')"
    echo "[NOTIFY] ━━━━━━━━━━━━━━━━━━━━"

    # 返回状态码
    if [ "$CRITICAL_PARTITIONS" -gt 0 ]; then
        log "⚠️  存在严重告警，返回退出码 2"
        return 2
    elif [ "$WARNING_PARTITIONS" -gt 0 ]; then
        log "⚠️  存在警告，返回退出码 1"
        return 1
    else
        log "✓ 监控完成，所有分区正常"
        return 0
    fi
}

# 执行主函数
main
exit $?
