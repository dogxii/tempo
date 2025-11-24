package scheduler

import (
	"context"
	"fmt"
	"log"
	"sync"
	"tempo/internal/executor"
	"tempo/internal/models"
	"tempo/internal/storage"
	"time"

	"github.com/robfig/cron/v3"
)

// Scheduler 定时调度器
type Scheduler struct {
	cron     *cron.Cron
	storage  *storage.Storage
	executor *executor.Executor
	jobs     map[string]cron.EntryID
	mu       sync.RWMutex
	running  bool
}

// New 创建调度器
func New(storage *storage.Storage, executor *executor.Executor) *Scheduler {
	return &Scheduler{
		cron:     cron.New(cron.WithSeconds()),
		storage:  storage,
		executor: executor,
		jobs:     make(map[string]cron.EntryID),
		running:  false,
	}
}

// Start 启动调度器
func (s *Scheduler) Start() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.running {
		return fmt.Errorf("scheduler already running")
	}

	// 加载所有活动任务
	tasks := s.storage.GetAllTasks()
	for _, task := range tasks {
		if task.Status == models.TaskStatusActive {
			if err := s.addJob(task); err != nil {
				log.Printf("Failed to add job %s: %v", task.Name, err)
			}
		}
	}

	s.cron.Start()
	s.running = true
	log.Println("Scheduler started")

	return nil
}

// Stop 停止调度器
func (s *Scheduler) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.running {
		return
	}

	ctx := s.cron.Stop()
	<-ctx.Done()

	s.running = false
	log.Println("Scheduler stopped")
}

// AddTask 添加任务到调度器
func (s *Scheduler) AddTask(task *models.Task) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if task.Status == models.TaskStatusActive {
		return s.addJob(task)
	}

	return nil
}

// RemoveTask 从调度器移除任务
func (s *Scheduler) RemoveTask(taskID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	return s.removeJob(taskID)
}

// UpdateTask 更新调度器中的任务
func (s *Scheduler) UpdateTask(task *models.Task) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 先移除旧任务
	s.removeJob(task.ID)

	// 如果任务是活动状态，重新添加
	if task.Status == models.TaskStatusActive {
		return s.addJob(task)
	}

	return nil
}

// addJob 添加任务（内部方法，不加锁）
func (s *Scheduler) addJob(task *models.Task) error {
	// 创建任务执行函数
	job := func() {
		s.executeTask(task.ID)
	}

	// 添加到 cron
	entryID, err := s.cron.AddFunc(task.Cron, job)
	if err != nil {
		return fmt.Errorf("failed to add cron job: %w", err)
	}

	s.jobs[task.ID] = entryID

	// 更新下次运行时间
	entry := s.cron.Entry(entryID)
	nextRun := entry.Next
	task.NextRunAt = &nextRun

	if err := s.storage.SaveTask(task); err != nil {
		log.Printf("Failed to update task next run time: %v", err)
	}

	log.Printf("Added job: %s (cron: %s)", task.Name, task.Cron)

	return nil
}

// removeJob 移除任务（内部方法，不加锁）
func (s *Scheduler) removeJob(taskID string) error {
	if entryID, ok := s.jobs[taskID]; ok {
		s.cron.Remove(entryID)
		delete(s.jobs, taskID)
		log.Printf("Removed job: %s", taskID)
	}
	return nil
}

// executeTask 执行任务
func (s *Scheduler) executeTask(taskID string) {
	// 获取任务
	task, err := s.storage.GetTask(taskID)
	if err != nil {
		log.Printf("Failed to get task %s: %v", taskID, err)
		return
	}

	log.Printf("Executing task: %s", task.Name)

	// 更新最后运行时间
	now := time.Now()
	task.LastRunAt = &now
	if err := s.storage.SaveTask(task); err != nil {
		log.Printf("Failed to update task last run time: %v", err)
	}

	// 获取关联的脚本
	script, err := s.storage.GetScript(task.ScriptID)
	if err != nil {
		log.Printf("Failed to get script for task %s: %v", task.Name, err)
		return
	}

	// 执行任务
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	taskLog, err := s.executor.ExecuteTask(ctx, task, script)
	if err != nil {
		log.Printf("Task execution failed: %s - %v", task.Name, err)
	} else {
		log.Printf("Task executed successfully: %s", task.Name)
	}

	// 保存日志
	if err := s.storage.SaveLog(taskLog); err != nil {
		log.Printf("Failed to save task log: %v", err)
	}

	// 更新脚本最后运行时间
	scriptNow := time.Now()
	script.LastRunAt = &scriptNow
	if err := s.storage.SaveScript(script); err != nil {
		log.Printf("Failed to update script last run time: %v", err)
	}

	// 更新下次运行时间
	s.mu.RLock()
	if entryID, ok := s.jobs[taskID]; ok {
		entry := s.cron.Entry(entryID)
		nextRun := entry.Next
		task.NextRunAt = &nextRun
		if err := s.storage.SaveTask(task); err != nil {
			log.Printf("Failed to update task next run time: %v", err)
		}
	}
	s.mu.RUnlock()
}

// RunTaskNow 立即运行任务
func (s *Scheduler) RunTaskNow(taskID string) error {
	task, err := s.storage.GetTask(taskID)
	if err != nil {
		return err
	}

	go s.executeTask(task.ID)
	return nil
}

// IsRunning 检查调度器是否运行中
func (s *Scheduler) IsRunning() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.running
}
