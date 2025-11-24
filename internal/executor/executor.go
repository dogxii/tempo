package executor

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"tempo/internal/models"
	"time"
)

// Executor 脚本执行器
type Executor struct {
	scriptsDir string
	dataDir    string
}

// New 创建执行器
func New(scriptsDir string) (*Executor, error) {
	if err := os.MkdirAll(scriptsDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create scripts directory: %w", err)
	}

	// 获取 dataDir (scriptsDir 的父目录)
	dataDir := filepath.Dir(scriptsDir)

	return &Executor{
		scriptsDir: scriptsDir,
		dataDir:    dataDir,
	}, nil
}

// ExecuteResult 执行结果
type ExecuteResult struct {
	Output  string
	Error   string
	Success bool
}

// Execute 执行脚本（通用方法）
func (e *Executor) Execute(scriptType models.ScriptType, scriptPath, scriptCode string) *ExecuteResult {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	// 准备脚本文件
	path, err := e.prepareScript(scriptType, scriptPath, scriptCode)
	if err != nil {
		return &ExecuteResult{
			Error:   err.Error(),
			Success: false,
		}
	}

	// 执行脚本
	output, err := e.executeScript(ctx, scriptType, path)

	if err != nil {
		return &ExecuteResult{
			Output:  output,
			Error:   err.Error(),
			Success: false,
		}
	}

	return &ExecuteResult{
		Output:  output,
		Success: true,
	}
}

// ExecuteTask 执行任务（通过脚本ID）
func (e *Executor) ExecuteTask(ctx context.Context, task *models.Task, script *models.Script) (*models.TaskLog, error) {
	startTime := time.Now()

	log := &models.TaskLog{
		ID:        fmt.Sprintf("log_%d", time.Now().UnixNano()),
		TaskID:    task.ID,
		TaskName:  task.Name,
		StartTime: startTime,
	}

	// 执行脚本
	result := e.Execute(script.ScriptType, script.ScriptPath, script.ScriptCode)

	endTime := time.Now()
	log.EndTime = endTime
	log.Duration = endTime.Sub(startTime).Milliseconds()
	log.Output = result.Output
	log.Error = result.Error
	log.Success = result.Success

	return log, nil
}

// prepareScript 准备脚本文件
func (e *Executor) prepareScript(scriptType models.ScriptType, scriptPath, scriptCode string) (string, error) {
	// 如果提供了脚本路径，直接使用
	if scriptPath != "" {
		if _, err := os.Stat(scriptPath); err == nil {
			return scriptPath, nil
		}
	}

	// 否则使用脚本内容创建临时文件
	if scriptCode == "" {
		return "", fmt.Errorf("no script path or code provided")
	}

	var ext string
	switch scriptType {
	case models.ScriptTypePython:
		ext = ".py"
	case models.ScriptTypeNodeJS:
		ext = ".js"
	case models.ScriptTypeShell:
		ext = ".sh"
	default:
		return "", fmt.Errorf("unsupported script type: %s", scriptType)
	}

	filename := fmt.Sprintf("temp_%d%s", time.Now().UnixNano(), ext)
	path := filepath.Join(e.scriptsDir, filename)

	if err := os.WriteFile(path, []byte(scriptCode), 0755); err != nil {
		return "", fmt.Errorf("failed to write script file: %w", err)
	}

	return path, nil
}

// executeScript 执行脚本
func (e *Executor) executeScript(ctx context.Context, scriptType models.ScriptType, scriptPath string) (string, error) {
	var cmd *exec.Cmd

	switch scriptType {
	case models.ScriptTypePython:
		cmd = exec.CommandContext(ctx, "python3", scriptPath)
	case models.ScriptTypeNodeJS:
		// Try to locate a node executable in PATH or common install locations.
		nodePath, lookErr := exec.LookPath("node")
		if lookErr != nil {
			// Fallback: try "nodejs"
			nodePath, lookErr = exec.LookPath("nodejs")
		}
		if lookErr != nil {
			// Fallback: check some common absolute installation paths (macOS/Homebrew, Linux common paths)
			tryPaths := []string{
				"/opt/homebrew/bin/node",
				"/usr/local/bin/node",
				"/usr/bin/node",
				"/bin/node",
			}
			for _, p := range tryPaths {
				if _, statErr := os.Stat(p); statErr == nil {
					nodePath = p
					lookErr = nil
					break
				}
			}
		}
		if lookErr != nil || nodePath == "" {
			// Provide a clearer error to help diagnose environment issues (e.g. PATH differences when launched from GUI)
			return "", fmt.Errorf("node executable not found in PATH; please ensure Node.js is installed and available in the environment PATH (tried: node, nodejs, common install locations)")
		}
		cmd = exec.CommandContext(ctx, nodePath, scriptPath)
	case models.ScriptTypeShell:
		cmd = exec.CommandContext(ctx, "bash", scriptPath)
	default:
		return "", fmt.Errorf("unsupported script type: %s", scriptType)
	}

	// 设置工作目录为脚本目录，使脚本能访问本地依赖（如 node_modules）
	cmd.Dir = e.scriptsDir

	// 加载并应用自定义环境变量
	customEnv := e.loadEnvironmentVariables()
	env := os.Environ()
	for key, value := range customEnv {
		env = append(env, fmt.Sprintf("%s=%s", key, value))
	}

	// 设置环境变量，确保能找到本地依赖
	env = append(env,
		fmt.Sprintf("NODE_PATH=%s/node_modules", e.scriptsDir),
		fmt.Sprintf("PYTHONPATH=%s", e.scriptsDir),
	)
	cmd.Env = env

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()

	output := stdout.String()
	if stderr.Len() > 0 {
		output += "\n[STDERR]\n" + stderr.String()
	}

	if err != nil {
		return output, fmt.Errorf("script execution failed: %w", err)
	}

	return output, nil
}

// GetScriptsDir 获取脚本目录
func (e *Executor) GetScriptsDir() string {
	return e.scriptsDir
}

// loadEnvironmentVariables 加载自定义环境变量
func (e *Executor) loadEnvironmentVariables() map[string]string {
	envFile := filepath.Join(e.dataDir, "env.json")
	envVars := make(map[string]string)

	if data, err := os.ReadFile(envFile); err == nil {
		json.Unmarshal(data, &envVars)
	}

	return envVars
}
