package models

import (
	"time"
)

// Script 脚本
type Script struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	ScriptType  ScriptType `json:"scriptType"`
	ScriptPath  string     `json:"scriptPath"` // 脚本文件路径
	ScriptCode  string     `json:"scriptCode"` // 内联脚本代码
	Tags        []string   `json:"tags"`       // 标签
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	LastRunAt   *time.Time `json:"lastRunAt"`
}

// TaskStatus 任务状态
type TaskStatus string

const (
	TaskStatusActive   TaskStatus = "active"   // 启用
	TaskStatusInactive TaskStatus = "inactive" // 禁用
)

// ScriptType 脚本类型
type ScriptType string

const (
	ScriptTypePython ScriptType = "python"
	ScriptTypeNodeJS ScriptType = "nodejs"
	ScriptTypeShell  ScriptType = "shell"
)

// ScheduleType 调度类型
type ScheduleType string

const (
	ScheduleTypeDaily   ScheduleType = "daily"   // 每天
	ScheduleTypeWeekly  ScheduleType = "weekly"  // 每周
	ScheduleTypeMonthly ScheduleType = "monthly" // 每月
	ScheduleTypeCustom  ScheduleType = "custom"  // 自定义cron
)

// Task 定时任务
type Task struct {
	ID           string       `json:"id"`
	Name         string       `json:"name"`
	ScriptID     string       `json:"scriptId"`     // 关联的脚本ID
	ScheduleType ScheduleType `json:"scheduleType"` // 调度类型
	Cron         string       `json:"cron"`         // cron 表达式
	TimeConfig   TimeConfig   `json:"timeConfig"`   // 时间配置（用于daily/weekly/monthly）
	Status       TaskStatus   `json:"status"`
	Description  string       `json:"description"`
	CreatedAt    time.Time    `json:"createdAt"`
	UpdatedAt    time.Time    `json:"updatedAt"`
	LastRunAt    *time.Time   `json:"lastRunAt"`
	NextRunAt    *time.Time   `json:"nextRunAt"`
}

// TimeConfig 时间配置
type TimeConfig struct {
	Hour     int   `json:"hour"`     // 小时 (0-23)
	Minute   int   `json:"minute"`   // 分钟 (0-59)
	Weekday  int   `json:"weekday"`  // 星期几 (0-6, 0=周日) for weekly
	Monthday int   `json:"monthday"` // 每月第几天 (1-31) for monthly
	Weekdays []int `json:"weekdays"` // 星期几数组 for weekly multiple days
}

// TaskLog 任务执行日志
type TaskLog struct {
	ID        string    `json:"id"`
	TaskID    string    `json:"taskId"`
	TaskName  string    `json:"taskName"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
	Duration  int64     `json:"duration"` // 毫秒
	Output    string    `json:"output"`
	Error     string    `json:"error"`
	Success   bool      `json:"success"`
}

// NotifierConfig 通知配置
type NotifierConfig struct {
	ID        string         `json:"id"`
	Type      NotifierType   `json:"type"`
	Name      string         `json:"name"`
	Enabled   bool           `json:"enabled"`
	Config    map[string]any `json:"config"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
}

// NotifierType 通知类型
type NotifierType string

const (
	NotifierTypeEmail    NotifierType = "email"
	NotifierTypeDingTalk NotifierType = "dingtalk"
	NotifierTypeWeChat   NotifierType = "wechat"
	NotifierTypeLark     NotifierType = "lark"
	NotifierTypeWebhook  NotifierType = "webhook"
)
