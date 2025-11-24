export type TaskStatus = "active" | "inactive";

export type ScriptType = "python" | "nodejs" | "shell";

export type NotifierType = "email" | "dingtalk" | "wechat" | "lark" | "webhook";

export type ScheduleType = "daily" | "weekly" | "monthly" | "custom";

export interface Script {
  id: string;
  name: string;
  description: string;
  scriptType: ScriptType;
  scriptPath: string;
  scriptCode: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

export interface TimeConfig {
  hour: number;
  minute: number;
  weekday?: number; // 0-6, 0=周日
  monthday?: number; // 1-31
  weekdays?: number[]; // 多个星期几
}

export interface Task {
  id: string;
  name: string;
  scriptId: string; // 关联的脚本ID
  scheduleType: ScheduleType;
  cron: string;
  timeConfig: TimeConfig;
  status: TaskStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface TaskLog {
  id: string;
  taskId: string;
  taskName: string;
  startTime: string;
  endTime: string;
  duration: number;
  output: string;
  error: string;
  success: boolean;
}

export interface NotifierConfig {
  id: string;
  type: NotifierType;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalTasks: number;
  activeTasks: number;
  totalLogs: number;
  successLogs: number;
  failedLogs: number;
  schedulerRunning: boolean;
}
