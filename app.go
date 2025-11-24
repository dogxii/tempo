package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	goruntime "runtime"
	"strings"
	"tempo/internal/executor"
	"tempo/internal/models"
	"tempo/internal/notifier"
	"tempo/internal/scheduler"
	"tempo/internal/storage"
	"time"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx       context.Context
	storage   *storage.Storage
	scheduler *scheduler.Scheduler
	executor  *executor.Executor
	notifier  *notifier.Notifier
	dataDir   string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// 获取用户主目录
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("Failed to get home directory:", err)
	}

	// 设置数据目录
	a.dataDir = filepath.Join(homeDir, ".tempo")
	scriptsDir := filepath.Join(a.dataDir, "scripts")

	// 初始化存储
	a.storage, err = storage.New(a.dataDir)
	if err != nil {
		log.Fatal("Failed to initialize storage:", err)
	}

	// 初始化执行器
	a.executor, err = executor.New(scriptsDir)
	if err != nil {
		log.Fatal("Failed to initialize executor:", err)
	}

	// 初始化调度器
	a.scheduler = scheduler.New(a.storage, a.executor)

	// 初始化通知器
	a.notifier = notifier.New()
	a.notifier.SetConfigs(a.storage.GetAllNotifierConfigs())

	// 启动调度器
	if err := a.scheduler.Start(); err != nil {
		log.Printf("Failed to start scheduler: %v", err)
	}

	log.Println("Tempo started successfully")
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	if a.scheduler != nil {
		a.scheduler.Stop()
	}
	log.Println("Tempo shutdown")
}

// GetAllTasks 获取所有任务
func (a *App) GetAllTasks() []*models.Task {
	return a.storage.GetAllTasks()
}

// GetTask 获取任务
func (a *App) GetTask(id string) (*models.Task, error) {
	return a.storage.GetTask(id)
}

// CreateTask 创建任务
func (a *App) CreateTask(task *models.Task) error {
	now := time.Now()
	task.ID = uuid.New().String()
	task.CreatedAt = now
	task.UpdatedAt = now
	task.Status = models.TaskStatusInactive

	if err := a.storage.SaveTask(task); err != nil {
		return err
	}

	return nil
}

// UpdateTask 更新任务
func (a *App) UpdateTask(task *models.Task) error {
	// 获取原任务
	oldTask, err := a.storage.GetTask(task.ID)
	if err != nil {
		return err
	}

	// 保留创建时间
	task.CreatedAt = oldTask.CreatedAt
	task.UpdatedAt = time.Now()

	// 保存任务
	if err := a.storage.SaveTask(task); err != nil {
		return err
	}

	// 更新调度器
	if err := a.scheduler.UpdateTask(task); err != nil {
		log.Printf("Failed to update scheduler: %v", err)
	}

	return nil
}

// DeleteTask 删除任务
func (a *App) DeleteTask(id string) error {
	if err := a.scheduler.RemoveTask(id); err != nil {
		log.Printf("Failed to remove task from scheduler: %v", err)
	}

	return a.storage.DeleteTask(id)
}

// ToggleTaskStatus 切换任务状态
func (a *App) ToggleTaskStatus(id string) error {
	task, err := a.storage.GetTask(id)
	if err != nil {
		return err
	}

	if task.Status == models.TaskStatusActive {
		task.Status = models.TaskStatusInactive
		if err := a.scheduler.RemoveTask(id); err != nil {
			log.Printf("Failed to remove task from scheduler: %v", err)
		}
	} else {
		task.Status = models.TaskStatusActive
		if err := a.scheduler.AddTask(task); err != nil {
			return fmt.Errorf("failed to add task to scheduler: %w", err)
		}
	}

	task.UpdatedAt = time.Now()
	return a.storage.SaveTask(task)
}

// RunTaskNow 立即运行任务
func (a *App) RunTaskNow(id string) error {
	return a.scheduler.RunTaskNow(id)
}

// GetTaskLogs 获取任务日志
func (a *App) GetTaskLogs(taskID string, limit int) []*models.TaskLog {
	if limit <= 0 {
		limit = 50
	}
	return a.storage.GetTaskLogs(taskID, limit)
}

// GetAllLogs 获取所有日志
func (a *App) GetAllLogs(limit int) []*models.TaskLog {
	if limit <= 0 {
		limit = 100
	}
	return a.storage.GetAllLogs(limit)
}

// GetAllNotifierConfigs 获取所有通知配置
func (a *App) GetAllNotifierConfigs() []*models.NotifierConfig {
	return a.storage.GetAllNotifierConfigs()
}

// CreateNotifierConfig 创建通知配置
func (a *App) CreateNotifierConfig(config *models.NotifierConfig) error {
	now := time.Now()
	config.ID = uuid.New().String()
	config.CreatedAt = now
	config.UpdatedAt = now

	if err := a.storage.SaveNotifierConfig(config); err != nil {
		return err
	}

	// 更新通知器
	a.notifier.SetConfigs(a.storage.GetAllNotifierConfigs())

	return nil
}

// UpdateNotifierConfig 更新通知配置
func (a *App) UpdateNotifierConfig(config *models.NotifierConfig) error {
	oldConfig, err := a.storage.GetNotifierConfig(config.ID)
	if err != nil {
		return err
	}

	config.CreatedAt = oldConfig.CreatedAt
	config.UpdatedAt = time.Now()

	if err := a.storage.SaveNotifierConfig(config); err != nil {
		return err
	}

	// 更新通知器
	a.notifier.SetConfigs(a.storage.GetAllNotifierConfigs())

	return nil
}

// DeleteNotifierConfig 删除通知配置
func (a *App) DeleteNotifierConfig(id string) error {
	if err := a.storage.DeleteNotifierConfig(id); err != nil {
		return err
	}

	// 更新通知器
	a.notifier.SetConfigs(a.storage.GetAllNotifierConfigs())

	return nil
}

// GetStats 获取统计信息
func (a *App) GetStats() map[string]interface{} {
	tasks := a.storage.GetAllTasks()
	logs := a.storage.GetAllLogs(1000)

	activeTasks := 0
	for _, task := range tasks {
		if task.Status == models.TaskStatusActive {
			activeTasks++
		}
	}

	successLogs := 0
	for _, log := range logs {
		if log.Success {
			successLogs++
		}
	}

	return map[string]interface{}{
		"totalTasks":       len(tasks),
		"activeTasks":      activeTasks,
		"totalLogs":        len(logs),
		"successLogs":      successLogs,
		"failedLogs":       len(logs) - successLogs,
		"schedulerRunning": a.scheduler.IsRunning(),
	}
}

// ValidateCron 验证 cron 表达式
func (a *App) ValidateCron(cronExpr string) bool {
	// 简单验证
	return len(cronExpr) > 0
}

// GetAllScripts 获取所有脚本
func (a *App) GetAllScripts() []*models.Script {
	return a.storage.GetAllScripts()
}

// GetScript 获取脚本
func (a *App) GetScript(id string) (*models.Script, error) {
	return a.storage.GetScript(id)
}

// CreateScript 创建脚本
func (a *App) CreateScript(script *models.Script) error {
	now := time.Now()
	script.ID = uuid.New().String()
	script.CreatedAt = now
	script.UpdatedAt = now

	if err := a.storage.SaveScript(script); err != nil {
		return err
	}

	return nil
}

// UpdateScript 更新脚本
func (a *App) UpdateScript(script *models.Script) error {
	oldScript, err := a.storage.GetScript(script.ID)
	if err != nil {
		return err
	}

	script.CreatedAt = oldScript.CreatedAt
	script.UpdatedAt = time.Now()

	return a.storage.SaveScript(script)
}

// DeleteScript 删除脚本
func (a *App) DeleteScript(id string) error {
	return a.storage.DeleteScript(id)
}

// RunScript 立即运行脚本（不关联任务）
func (a *App) RunScript(id string, sendNotify bool) error {
	script, err := a.storage.GetScript(id)
	if err != nil {
		return err
	}

	go func() {
		startTime := time.Now()
		result := a.executor.Execute(script.ScriptType, script.ScriptPath, script.ScriptCode)
		duration := time.Since(startTime).Milliseconds()

		// 保存日志
		log := &models.TaskLog{
			ID:        uuid.New().String(),
			TaskID:    "",
			TaskName:  script.Name + " (手动执行)",
			StartTime: startTime,
			EndTime:   time.Now(),
			Duration:  duration,
			Output:    result.Output,
			Error:     result.Error,
			Success:   result.Success,
		}

		if err := a.storage.SaveLog(log); err != nil {
			fmt.Printf("Failed to save log: %v\n", err)
		}

		// 发送通知（根据用户选择）
		if sendNotify && a.notifier != nil {
			a.notifier.Notify(log)
		}

		// 更新脚本最后运行时间
		now := time.Now()
		script.LastRunAt = &now
		a.storage.SaveScript(script)
	}()

	return nil
}

// SelectFile 打开文件选择对话框
func (a *App) SelectFile() (string, error) {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择脚本文件",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "脚本文件 (*.py, *.js, *.sh)",
				Pattern:     "*.py;*.js;*.sh;*.bash",
			},
			{
				DisplayName: "Python 文件 (*.py)",
				Pattern:     "*.py",
			},
			{
				DisplayName: "JavaScript 文件 (*.js)",
				Pattern:     "*.js",
			},
			{
				DisplayName: "Shell 文件 (*.sh)",
				Pattern:     "*.sh;*.bash",
			},
			{
				DisplayName: "所有文件 (*.*)",
				Pattern:     "*.*",
			},
		},
	})

	if err != nil {
		return "", err
	}

	return file, nil
}

// GetScriptsDir 获取脚本目录路径
func (a *App) GetScriptsDir() string {
	return filepath.Join(a.dataDir, "scripts")
}

// Dependency 依赖信息
type Dependency struct {
	Name    string `json:"name"`
	Version string `json:"version"`
	Type    string `json:"type"` // "npm" or "pip"
}

// GetDependencies 获取已安装的依赖列表
func (a *App) GetDependencies() []Dependency {
	dependencies := []Dependency{}
	scriptsDir := a.GetScriptsDir()

	// 获取 npm 依赖
	packageJsonPath := filepath.Join(scriptsDir, "package.json")
	if _, err := os.Stat(packageJsonPath); err == nil {
		data, err := os.ReadFile(packageJsonPath)
		if err == nil {
			var pkg struct {
				Dependencies map[string]string `json:"dependencies"`
			}
			if json.Unmarshal(data, &pkg) == nil {
				for name, version := range pkg.Dependencies {
					dependencies = append(dependencies, Dependency{
						Name:    name,
						Version: version,
						Type:    "npm",
					})
				}
			}
		}
	}

	// 获取 pip 依赖 (通过 pip freeze)
	cmd := exec.Command("pip3", "freeze")
	cmd.Dir = scriptsDir
	output, err := cmd.Output()
	if err == nil {
		lines := strings.Split(string(output), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}
			parts := strings.Split(line, "==")
			if len(parts) == 2 {
				dependencies = append(dependencies, Dependency{
					Name:    parts[0],
					Version: parts[1],
					Type:    "pip",
				})
			}
		}
	}

	return dependencies
}

// InstallDependency 安装依赖（支持空格分隔的多个包名）
func (a *App) InstallDependency(depType, packageName string) error {
	scriptsDir := a.GetScriptsDir()

	// 按空格分隔包名
	packages := strings.Fields(packageName)
	if len(packages) == 0 {
		return fmt.Errorf("package name cannot be empty")
	}

	if depType == "npm" {
		// 确保 package.json 存在
		packageJsonPath := filepath.Join(scriptsDir, "package.json")
		if _, err := os.Stat(packageJsonPath); os.IsNotExist(err) {
			// 创建基础 package.json
			initialPkg := map[string]interface{}{
				"name":         "tempo-scripts",
				"version":      "1.0.0",
				"description":  "Tempo scripts dependencies",
				"dependencies": map[string]string{},
			}
			data, _ := json.MarshalIndent(initialPkg, "", "  ")
			os.WriteFile(packageJsonPath, data, 0644)
		}

		// 安装 npm 包（支持多个包）
		args := append([]string{"install"}, packages...)
		cmd := exec.Command("npm", args...)
		cmd.Dir = scriptsDir
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("npm install failed: %s", string(output))
		}
		log.Printf("Installed npm packages: %s\n%s", strings.Join(packages, " "), string(output))
		return nil
	} else if depType == "pip" {
		// 安装 pip 包（支持多个包）
		args := append([]string{"install"}, packages...)
		cmd := exec.Command("pip3", args...)
		cmd.Dir = scriptsDir
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("pip install failed: %s", string(output))
		}
		log.Printf("Installed pip packages: %s\n%s", strings.Join(packages, " "), string(output))
		return nil
	}

	return fmt.Errorf("unsupported dependency type: %s", depType)
}

// UninstallDependency 卸载依赖
func (a *App) UninstallDependency(depType, packageName string) error {
	scriptsDir := a.GetScriptsDir()

	if depType == "npm" {
		cmd := exec.Command("npm", "uninstall", packageName)
		cmd.Dir = scriptsDir
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("npm uninstall failed: %s", string(output))
		}
		log.Printf("Uninstalled npm package: %s\n%s", packageName, string(output))
		return nil
	} else if depType == "pip" {
		cmd := exec.Command("pip3", "uninstall", "-y", packageName)
		cmd.Dir = scriptsDir
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("pip uninstall failed: %s", string(output))
		}
		log.Printf("Uninstalled pip package: %s\n%s", packageName, string(output))
		return nil
	}

	return fmt.Errorf("unsupported dependency type: %s", depType)
}

// OpenDirectory 打开目录
func (a *App) OpenDirectory(path string) error {
	var cmd *exec.Cmd

	switch goruntime.GOOS {
	case "darwin":
		cmd = exec.Command("open", path)
	case "windows":
		cmd = exec.Command("explorer", path)
	case "linux":
		cmd = exec.Command("xdg-open", path)
	default:
		return fmt.Errorf("unsupported operating system: %s", goruntime.GOOS)
	}

	return cmd.Start()
}

// GetEnvironmentVariables 获取所有环境变量
func (a *App) GetEnvironmentVariables() map[string]string {
	envFile := filepath.Join(a.dataDir, "env.json")
	envVars := make(map[string]string)

	if data, err := os.ReadFile(envFile); err == nil {
		json.Unmarshal(data, &envVars)
	}

	return envVars
}

// SetEnvironmentVariable 设置环境变量
func (a *App) SetEnvironmentVariable(key, value string) error {
	envFile := filepath.Join(a.dataDir, "env.json")
	envVars := a.GetEnvironmentVariables()

	envVars[key] = value

	data, err := json.MarshalIndent(envVars, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(envFile, data, 0644)
}

// DeleteEnvironmentVariable 删除环境变量
func (a *App) DeleteEnvironmentVariable(key string) error {
	envFile := filepath.Join(a.dataDir, "env.json")
	envVars := a.GetEnvironmentVariables()

	delete(envVars, key)

	data, err := json.MarshalIndent(envVars, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(envFile, data, 0644)
}
