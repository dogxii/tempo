package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"tempo/internal/models"
)

// Storage 存储接口
type Storage struct {
	dataDir string
	mu      sync.RWMutex
	scripts map[string]*models.Script
	tasks   map[string]*models.Task
	logs    map[string]*models.TaskLog
	configs map[string]*models.NotifierConfig
}

// New 创建存储实例
func New(dataDir string) (*Storage, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	s := &Storage{
		dataDir: dataDir,
		scripts: make(map[string]*models.Script),
		tasks:   make(map[string]*models.Task),
		logs:    make(map[string]*models.TaskLog),
		configs: make(map[string]*models.NotifierConfig),
	}

	if err := s.load(); err != nil {
		return nil, err
	}

	return s, nil
}

// load 加载数据
func (s *Storage) load() error {
	if err := s.loadScripts(); err != nil {
		return err
	}
	if err := s.loadTasks(); err != nil {
		return err
	}
	if err := s.loadLogs(); err != nil {
		return err
	}
	if err := s.loadConfigs(); err != nil {
		return err
	}
	return nil
}

// loadScripts 加载脚本
func (s *Storage) loadScripts() error {
	path := filepath.Join(s.dataDir, "scripts.json")
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	var scripts []*models.Script
	if err := json.Unmarshal(data, &scripts); err != nil {
		return err
	}

	for _, script := range scripts {
		s.scripts[script.ID] = script
	}
	return nil
}

// loadTasks 加载任务
func (s *Storage) loadTasks() error {
	path := filepath.Join(s.dataDir, "tasks.json")
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	var tasks []*models.Task
	if err := json.Unmarshal(data, &tasks); err != nil {
		return err
	}

	for _, task := range tasks {
		s.tasks[task.ID] = task
	}
	return nil
}

// loadLogs 加载日志
func (s *Storage) loadLogs() error {
	path := filepath.Join(s.dataDir, "logs.json")
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	var logs []*models.TaskLog
	if err := json.Unmarshal(data, &logs); err != nil {
		return err
	}

	for _, log := range logs {
		s.logs[log.ID] = log
	}
	return nil
}

// loadConfigs 加载配置
func (s *Storage) loadConfigs() error {
	path := filepath.Join(s.dataDir, "configs.json")
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	var configs []*models.NotifierConfig
	if err := json.Unmarshal(data, &configs); err != nil {
		return err
	}

	for _, config := range configs {
		s.configs[config.ID] = config
	}
	return nil
}

// SaveScript 保存脚本
func (s *Storage) SaveScript(script *models.Script) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.scripts[script.ID] = script
	return s.saveScripts()
}

// GetScript 获取脚本
func (s *Storage) GetScript(id string) (*models.Script, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	script, ok := s.scripts[id]
	if !ok {
		return nil, fmt.Errorf("script not found")
	}
	return script, nil
}

// GetAllScripts 获取所有脚本
func (s *Storage) GetAllScripts() []*models.Script {
	s.mu.RLock()
	defer s.mu.RUnlock()

	scripts := make([]*models.Script, 0, len(s.scripts))
	for _, script := range s.scripts {
		scripts = append(scripts, script)
	}
	return scripts
}

// DeleteScript 删除脚本
func (s *Storage) DeleteScript(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.scripts, id)
	return s.saveScripts()
}

// SaveTask 保存任务
func (s *Storage) SaveTask(task *models.Task) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.tasks[task.ID] = task
	return s.saveTasks()
}

// GetTask 获取任务
func (s *Storage) GetTask(id string) (*models.Task, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	task, ok := s.tasks[id]
	if !ok {
		return nil, fmt.Errorf("task not found")
	}
	return task, nil
}

// GetAllTasks 获取所有任务
func (s *Storage) GetAllTasks() []*models.Task {
	s.mu.RLock()
	defer s.mu.RUnlock()

	tasks := make([]*models.Task, 0, len(s.tasks))
	for _, task := range s.tasks {
		tasks = append(tasks, task)
	}
	return tasks
}

// DeleteTask 删除任务
func (s *Storage) DeleteTask(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.tasks, id)
	return s.saveTasks()
}

// SaveLog 保存日志
func (s *Storage) SaveLog(log *models.TaskLog) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.logs[log.ID] = log
	return s.saveLogs()
}

// GetTaskLogs 获取任务日志
func (s *Storage) GetTaskLogs(taskID string, limit int) []*models.TaskLog {
	s.mu.RLock()
	defer s.mu.RUnlock()

	logs := make([]*models.TaskLog, 0)
	for _, log := range s.logs {
		if log.TaskID == taskID {
			logs = append(logs, log)
		}
	}

	// 简单排序，按开始时间倒序
	if len(logs) > limit && limit > 0 {
		logs = logs[:limit]
	}

	return logs
}

// GetAllLogs 获取所有日志
func (s *Storage) GetAllLogs(limit int) []*models.TaskLog {
	s.mu.RLock()
	defer s.mu.RUnlock()

	logs := make([]*models.TaskLog, 0, len(s.logs))
	for _, log := range s.logs {
		logs = append(logs, log)
	}

	if len(logs) > limit && limit > 0 {
		logs = logs[:limit]
	}

	return logs
}

// SaveNotifierConfig 保存通知配置
func (s *Storage) SaveNotifierConfig(config *models.NotifierConfig) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.configs[config.ID] = config
	return s.saveConfigs()
}

// GetNotifierConfig 获取通知配置
func (s *Storage) GetNotifierConfig(id string) (*models.NotifierConfig, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	config, ok := s.configs[id]
	if !ok {
		return nil, fmt.Errorf("config not found")
	}
	return config, nil
}

// GetAllNotifierConfigs 获取所有通知配置
func (s *Storage) GetAllNotifierConfigs() []*models.NotifierConfig {
	s.mu.RLock()
	defer s.mu.RUnlock()

	configs := make([]*models.NotifierConfig, 0, len(s.configs))
	for _, config := range s.configs {
		configs = append(configs, config)
	}
	return configs
}

// DeleteNotifierConfig 删除通知配置
func (s *Storage) DeleteNotifierConfig(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.configs, id)
	return s.saveConfigs()
}

// saveScripts 保存脚本到文件
func (s *Storage) saveScripts() error {
	scripts := make([]*models.Script, 0, len(s.scripts))
	for _, script := range s.scripts {
		scripts = append(scripts, script)
	}

	data, err := json.MarshalIndent(scripts, "", "  ")
	if err != nil {
		return err
	}

	path := filepath.Join(s.dataDir, "scripts.json")
	return os.WriteFile(path, data, 0644)
}

// saveTasks 保存任务到文件
func (s *Storage) saveTasks() error {
	tasks := make([]*models.Task, 0, len(s.tasks))
	for _, task := range s.tasks {
		tasks = append(tasks, task)
	}

	data, err := json.MarshalIndent(tasks, "", "  ")
	if err != nil {
		return err
	}

	path := filepath.Join(s.dataDir, "tasks.json")
	return os.WriteFile(path, data, 0644)
}

// saveLogs 保存日志到文件
func (s *Storage) saveLogs() error {
	logs := make([]*models.TaskLog, 0, len(s.logs))
	for _, log := range s.logs {
		logs = append(logs, log)
	}

	data, err := json.MarshalIndent(logs, "", "  ")
	if err != nil {
		return err
	}

	path := filepath.Join(s.dataDir, "logs.json")
	return os.WriteFile(path, data, 0644)
}

// saveConfigs 保存配置到文件
func (s *Storage) saveConfigs() error {
	configs := make([]*models.NotifierConfig, 0, len(s.configs))
	for _, config := range s.configs {
		configs = append(configs, config)
	}

	data, err := json.MarshalIndent(configs, "", "  ")
	if err != nil {
		return err
	}

	path := filepath.Join(s.dataDir, "configs.json")
	return os.WriteFile(path, data, 0644)
}
