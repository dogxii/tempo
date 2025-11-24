package notifier

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"tempo/internal/models"
	"time"
)

// Notifier 通知器
type Notifier struct {
	configs map[string]*models.NotifierConfig
}

// New 创建通知器
func New() *Notifier {
	return &Notifier{
		configs: make(map[string]*models.NotifierConfig),
	}
}

// SetConfigs 设置通知配置
func (n *Notifier) SetConfigs(configs []*models.NotifierConfig) {
	n.configs = make(map[string]*models.NotifierConfig)
	for _, config := range configs {
		if config.Enabled {
			n.configs[config.ID] = config
		}
	}
}

// Notify 发送通知
func (n *Notifier) Notify(taskLog *models.TaskLog) {
	for _, config := range n.configs {
		if !config.Enabled {
			continue
		}

		go func(cfg *models.NotifierConfig) {
			if err := n.send(cfg, taskLog); err != nil {
				log.Printf("Failed to send notification via %s: %v", cfg.Type, err)
			}
		}(config)
	}
}

// send 发送通知
func (n *Notifier) send(config *models.NotifierConfig, taskLog *models.TaskLog) error {
	switch config.Type {
	case models.NotifierTypeDingTalk:
		return n.sendDingTalk(config, taskLog)
	case models.NotifierTypeWeChat:
		return n.sendWeChat(config, taskLog)
	case models.NotifierTypeLark:
		return n.sendLark(config, taskLog)
	case models.NotifierTypeWebhook:
		return n.sendWebhook(config, taskLog)
	default:
		return fmt.Errorf("unsupported notifier type: %s", config.Type)
	}
}

// sendDingTalk 发送钉钉通知
func (n *Notifier) sendDingTalk(config *models.NotifierConfig, taskLog *models.TaskLog) error {
	webhook, ok := config.Config["webhook"].(string)
	if !ok || webhook == "" {
		return fmt.Errorf("webhook URL not configured")
	}

	// 提取带 [NOTIFY] 前缀的内容
	content := extractNotifyContent(taskLog)

	// 如果没有 [NOTIFY] 内容，使用默认摘要
	if content == "" {
		content = buildDefaultSummary(taskLog)
	}

	message := map[string]interface{}{
		"msgtype": "text",
		"text": map[string]string{
			"content": content,
		},
	}

	return n.sendHTTPRequest(webhook, message)
}

// sendWeChat 发送企业微信通知
func (n *Notifier) sendWeChat(config *models.NotifierConfig, taskLog *models.TaskLog) error {
	webhook, ok := config.Config["webhook"].(string)
	if !ok || webhook == "" {
		return fmt.Errorf("webhook URL not configured")
	}

	// 提取带 [NOTIFY] 前缀的内容
	content := extractNotifyContent(taskLog)

	// 如果没有 [NOTIFY] 内容，使用默认摘要
	if content == "" {
		content = buildDefaultSummary(taskLog)
	}

	message := map[string]interface{}{
		"msgtype": "text",
		"text": map[string]string{
			"content": content,
		},
	}

	return n.sendHTTPRequest(webhook, message)
}

// sendLark 发送飞书通知（支持可选签名校验）
// 如果通知配置里包含 "secret"，则会按照飞书签名方式计算 sign，并将 timestamp 和 sign 作为 query 参数附加到 webhook URL 上。
// 签名算法：将 timestamp + "\n" + secret 作为签名密钥（key），对空消息计算 HMAC-SHA256，然后对结果进行 Base64 编码。
func (n *Notifier) sendLark(config *models.NotifierConfig, taskLog *models.TaskLog) error {
	webhook, ok := config.Config["webhook"].(string)
	if !ok || webhook == "" {
		return fmt.Errorf("webhook URL not configured")
	}

	// 提取带 [NOTIFY] 前缀的内容
	content := extractNotifyContent(taskLog)

	// 如果没有 [NOTIFY] 内容，使用默认摘要
	if content == "" {
		content = buildDefaultSummary(taskLog)
	}

	message := map[string]interface{}{
		"msg_type": "text",
		"content": map[string]string{
			"text": content,
		},
	}

	// 检查是否配置了 secret（用于启用飞书签名校验）
	secret, _ := config.Config["secret"].(string)
	webhookToUse := webhook

	if secret != "" {
		// 生成 timestamp 和 sign
		timestamp := time.Now().Unix()
		// 按照示例，将 timestamp + "\n" + secret 作为签名密钥
		stringToSign := fmt.Sprintf("%d\n%s", timestamp, secret)

		// 使用 stringToSign 作为 key，对空消息计算 HMAC-SHA256
		h := hmac.New(sha256.New, []byte(stringToSign))
		_, _ = h.Write([]byte{})
		signature := base64.StdEncoding.EncodeToString(h.Sum(nil))

		// 将 timestamp 和 sign 以 query 参数形式附加到 webhook URL
		u, err := url.Parse(webhook)
		if err != nil {
			return fmt.Errorf("invalid webhook URL: %w", err)
		}
		q := u.Query()
		q.Set("timestamp", strconv.FormatInt(timestamp, 10))
		q.Set("sign", signature)
		u.RawQuery = q.Encode()
		webhookToUse = u.String()
	}

	return n.sendHTTPRequest(webhookToUse, message)
}

// sendWebhook 发送自定义 Webhook 通知
func (n *Notifier) sendWebhook(config *models.NotifierConfig, taskLog *models.TaskLog) error {
	webhook, ok := config.Config["webhook"].(string)
	if !ok || webhook == "" {
		return fmt.Errorf("webhook URL not configured")
	}

	// 发送完整的日志数据
	return n.sendHTTPRequest(webhook, taskLog)
}

// sendHTTPRequest 发送 HTTP 请求
func (n *Notifier) sendHTTPRequest(url string, payload interface{}) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}

// extractNotifyContent 提取带 [NOTIFY] 前缀的内容
func extractNotifyContent(taskLog *models.TaskLog) string {
	var notifyLines []string

	// 处理输出内容
	if taskLog.Output != "" {
		lines := strings.Split(taskLog.Output, "\n")
		for _, line := range lines {
			// 查找 [NOTIFY] 前缀（不区分大小写）
			if strings.Contains(strings.ToUpper(line), "[NOTIFY]") {
				// 移除 [NOTIFY] 前缀并添加到结果
				cleaned := strings.TrimSpace(strings.Replace(
					strings.Replace(line, "[NOTIFY]", "", 1),
					"[notify]", "", 1,
				))
				if cleaned != "" {
					notifyLines = append(notifyLines, cleaned)
				}
			}
		}
	}

	// 如果有错误，总是包含错误信息
	if taskLog.Error != "" {
		if len(notifyLines) > 0 {
			notifyLines = append(notifyLines, "")
		}
		notifyLines = append(notifyLines, "❌ 错误: "+taskLog.Error)
	}

	return strings.Join(notifyLines, "\n")
}

// buildDefaultSummary 构建默认摘要（当没有 [NOTIFY] 内容时）
func buildDefaultSummary(taskLog *models.TaskLog) string {
	status := "✅ 成功"
	if !taskLog.Success {
		status = "❌ 失败"
	}

	summary := fmt.Sprintf("%s %s\n", status, taskLog.TaskName)
	summary += fmt.Sprintf("执行时长: %dms\n", taskLog.Duration)

	if taskLog.Error != "" {
		summary += fmt.Sprintf("\n错误: %s", taskLog.Error)
	} else {
		// 只显示前 200 个字符的输出
		output := taskLog.Output
		if len(output) > 200 {
			output = output[:200] + "..."
		}
		if output != "" {
			summary += fmt.Sprintf("\n输出:\n%s", output)
		}
	}

	return summary
}
