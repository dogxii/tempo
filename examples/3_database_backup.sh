#!/bin/bash
################################################################################
# 数据库备份脚本
#
# 功能：
# - 备份 MySQL/PostgreSQL 数据库
# - 自动压缩备份文件
# - 清理旧备份（保留最近N天）
# - 发送备份结果通知
#
# 依赖：
# - mysqldump (MySQL)
# - pg_dump (PostgreSQL)
# - gzip
#
# 环境变量：
# DB_TYPE - 数据库类型 (mysql/postgres)
# DB_HOST - 数据库主机（默认：localhost）
# DB_PORT - 数据库端口（默认：3306/5432）
# DB_NAME - 数据库名称
# DB_USER - 数据库用户
# DB_PASSWORD - 数据库密码
# BACKUP_DIR - 备份目录（默认：~/backups）
# BACKUP_KEEP_DAYS - 保留天数（默认：7）
#
# 定时任务建议：
# 每天凌晨 2:00 - Cron: 0 0 2 * * *
################################################################################

set -e  # 遇到错误立即退出

# 配置
DB_TYPE="${DB_TYPE:-mysql}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT}"
DB_NAME="${DB_NAME:-mydb}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-7}"

# 设置默认端口
if [ -z "$DB_PORT" ]; then
    if [ "$DB_TYPE" = "postgres" ]; then
        DB_PORT=5432
    else
        DB_PORT=3306
    fi
fi

# 时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_STR=$(date +"%Y年%m月%d日 %H:%M:%S")

# 备份文件名
BACKUP_FILE="${DB_NAME}_${TIMESTAMP}.sql"
BACKUP_ARCHIVE="${BACKUP_FILE}.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_ARCHIVE}"

# 统计信息
START_TIME=$(date +%s)
BACKUP_SIZE=0
DELETED_COUNT=0

################################################################################
# 函数定义
################################################################################

# 日志函数
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# 错误处理
error_exit() {
    log "错误: $1"
    echo "[NOTIFY] ❌ 数据库备份失败"
    echo "[NOTIFY] 数据库: ${DB_NAME}"
    echo "[NOTIFY] 错误: $1"
    echo "[NOTIFY] 时间: ${DATE_STR}"
    exit 1
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        error_exit "命令 '$1' 未找到，请先安装"
    fi
}

# 创建备份目录
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log "创建备份目录: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR" || error_exit "无法创建备份目录"
    fi
}

# 备份 MySQL 数据库
backup_mysql() {
    log "开始备份 MySQL 数据库: ${DB_NAME}"
    check_command mysqldump

    # 构建 mysqldump 命令
    MYSQL_OPTS="--host=${DB_HOST} --port=${DB_PORT} --user=${DB_USER}"

    if [ -n "$DB_PASSWORD" ]; then
        export MYSQL_PWD="$DB_PASSWORD"
    fi

    # 执行备份并压缩
    mysqldump $MYSQL_OPTS \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        "$DB_NAME" | gzip > "$BACKUP_PATH" || error_exit "MySQL 备份失败"

    unset MYSQL_PWD
}

# 备份 PostgreSQL 数据库
backup_postgres() {
    log "开始备份 PostgreSQL 数据库: ${DB_NAME}"
    check_command pg_dump

    # 设置密码环境变量
    if [ -n "$DB_PASSWORD" ]; then
        export PGPASSWORD="$DB_PASSWORD"
    fi

    # 执行备份并压缩
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --no-password \
        --format=plain \
        --clean \
        --if-exists \
        "$DB_NAME" | gzip > "$BACKUP_PATH" || error_exit "PostgreSQL 备份失败"

    unset PGPASSWORD
}

# 清理旧备份
cleanup_old_backups() {
    log "清理 ${BACKUP_KEEP_DAYS} 天前的旧备份..."

    # 查找并删除旧文件
    if [ -d "$BACKUP_DIR" ]; then
        DELETED_COUNT=$(find "$BACKUP_DIR" \
            -name "${DB_NAME}_*.sql.gz" \
            -type f \
            -mtime +${BACKUP_KEEP_DAYS} \
            -delete -print | wc -l)

        log "已删除 ${DELETED_COUNT} 个旧备份文件"
    fi
}

# 获取文件大小（人类可读格式）
get_file_size() {
    if [ -f "$1" ]; then
        if command -v numfmt &> /dev/null; then
            # Linux
            numfmt --to=iec-i --suffix=B "$(stat -f%z "$1" 2>/dev/null || stat -c%s "$1")"
        else
            # macOS
            du -h "$1" | awk '{print $1}'
        fi
    else
        echo "0B"
    fi
}

################################################################################
# 主流程
################################################################################

main() {
    echo "========================================"
    echo "数据库备份脚本"
    echo "========================================"
    log "备份开始"
    log "数据库类型: ${DB_TYPE}"
    log "数据库名称: ${DB_NAME}"
    log "数据库主机: ${DB_HOST}:${DB_PORT}"
    log "备份目录: ${BACKUP_DIR}"

    # 创建备份目录
    create_backup_dir

    # 根据数据库类型执行备份
    case "$DB_TYPE" in
        mysql)
            backup_mysql
            ;;
        postgres|postgresql)
            backup_postgres
            ;;
        *)
            error_exit "不支持的数据库类型: ${DB_TYPE}"
            ;;
    esac

    # 检查备份文件
    if [ ! -f "$BACKUP_PATH" ]; then
        error_exit "备份文件未创建"
    fi

    # 获取备份文件大小
    BACKUP_SIZE=$(get_file_size "$BACKUP_PATH")
    log "备份文件大小: ${BACKUP_SIZE}"

    # 清理旧备份
    cleanup_old_backups

    # 计算耗时
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    log "备份完成，耗时: ${DURATION}秒"

    # 列出当前所有备份
    TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f | wc -l)

    # 发送成功通知
    echo ""
    echo "========================================"
    echo "发送通知:"
    echo "========================================"
    echo "[NOTIFY] ✅ 数据库备份成功"
    echo "[NOTIFY] ━━━━━━━━━━━━━━━━━━━━"
    echo "[NOTIFY] 📊 备份信息"
    echo "[NOTIFY] • 数据库: ${DB_NAME} (${DB_TYPE})"
    echo "[NOTIFY] • 文件大小: ${BACKUP_SIZE}"
    echo "[NOTIFY] • 耗时: ${DURATION}秒"
    echo "[NOTIFY] "
    echo "[NOTIFY] 📁 备份管理"
    echo "[NOTIFY] • 当前备份数: ${TOTAL_BACKUPS} 个"
    echo "[NOTIFY] • 保留策略: ${BACKUP_KEEP_DAYS} 天"
    echo "[NOTIFY] • 已清理: ${DELETED_COUNT} 个旧备份"
    echo "[NOTIFY] "
    echo "[NOTIFY] 📂 备份位置"
    echo "[NOTIFY] ${BACKUP_PATH}"
    echo "[NOTIFY] "
    echo "[NOTIFY] ⏰ 备份时间: ${DATE_STR}"
    echo "[NOTIFY] ━━━━━━━━━━━━━━━━━━━━"

    log "✓ 所有操作完成"
    return 0
}

# 执行主函数
main
exit $?
