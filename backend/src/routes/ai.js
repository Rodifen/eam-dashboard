import { Router } from 'express';
import { queryAll, queryOne, run } from '../models/database.js';
const router = Router();

// Get prompt template
router.get('/template', (req, res) => {
  const template = `你是一位EAM系统实施专家。请基于以下EAM系统实施数据，生成一份专业的实施进度分析报告和产品需求文档。

## 数据概览
{data_summary}

## 各模块详情
{module_details}

## 趋势分析
{trend_analysis}

## 要求
1. 分析当前实施进度的整体健康度
2. 识别潜在风险和瓶颈
3. 给出改进建议
4. 生成下一阶段的产品需求文档
5. 输出格式为Markdown`;
  res.json({ template });
});

// Generate AI requirements based on current data
router.post('/generate', (req, res) => {
  const { date, days = '7' } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const progress = queryAll('SELECT * FROM daily_progress WHERE date = ?', [targetDate]);
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - parseInt(days));
    const trend = queryAll('SELECT * FROM daily_progress WHERE date >= ? ORDER BY date ASC', [startDate.toISOString().split('T')[0]]);
    const issues = queryAll("SELECT * FROM issues WHERE status IN ('open', 'investigating') ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END");

    const modules = { inspection: [], maintenance: [], repair: [] };
    progress.forEach(p => { if (modules[p.module]) modules[p.module].push(p); });

    const dataSummary = `
| 模块 | 总任务 | 已完成 | 完成率 | 问题数 |
|------|--------|--------|--------|--------|
| 点检 | ${modules.inspection[0]?.total_tasks || 0} | ${modules.inspection[0]?.completed_tasks || 0} | ${modules.inspection[0]?.completion_rate || 0}% | ${modules.inspection[0]?.issues_count || 0} |
| 保养 | ${modules.maintenance[0]?.total_tasks || 0} | ${modules.maintenance[0]?.completed_tasks || 0} | ${modules.maintenance[0]?.completion_rate || 0}% | ${modules.maintenance[0]?.issues_count || 0} |
| 报修 | ${modules.repair[0]?.total_tasks || 0} | ${modules.repair[0]?.completed_tasks || 0} | ${modules.repair[0]?.completion_rate || 0}% | ${modules.repair[0]?.issues_count || 0} |`;

    const trendByModule = { inspection: [], maintenance: [], repair: [] };
    trend.forEach(t => { if (trendByModule[t.module]) trendByModule[t.module].push(t); });

    const trendAnalysis = Object.entries(trendByModule).map(([mod, data]) => {
      const name = mod === 'inspection' ? '点检' : mod === 'maintenance' ? '保养' : '报修';
      const rates = data.map(d => d.completion_rate);
      const avg = rates.length > 0 ? (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1) : 0;
      const tr = rates.length >= 2 ? (rates[rates.length - 1] > rates[0] ? '上升' : rates[rates.length - 1] < rates[0] ? '下降' : '持平') : '数据不足';
      return `- **${name}**: 平均完成率 ${avg}%，趋势: ${tr}`;
    }).join('\n');

    const overallRate = progress.length > 0 ? (progress.reduce((s, p) => s + p.completion_rate, 0) / progress.length).toFixed(1) : 0;

    const content = `# EAM系统实施进度分析报告

**生成日期**: ${targetDate}
**分析周期**: 最近${days}天

## 一、数据概览

${dataSummary}

## 二、趋势分析

${trendAnalysis}

## 三、当前问题

${issues.length > 0 ? issues.map(i => `- [${i.severity.toUpperCase()}] ${i.title} - ${i.status} (${i.assigned_to || '未分配'})`).join('\n') : '- 当前无活跃问题'}

## 四、进度评估

### 整体健康度: ${overallRate}%

${parseFloat(overallRate) >= 80 ? '✅ 整体进度良好，各模块推进顺利。' : parseFloat(overallRate) >= 60 ? '⚠️ 进度一般，需关注部分滞后模块。' : '❌ 进度滞后，需要立即采取措施。'}

## 五、改进建议

1. **点检模块**: ${modules.inspection[0]?.completion_rate >= 80 ? '保持当前节奏，优化点检流程自动化' : '加快点检任务执行，增加人员投入'}
2. **保养模块**: ${modules.maintenance[0]?.completion_rate >= 80 ? '推进预防性保养体系建设' : '梳理保养计划，确保按时完成'}
3. **报修模块**: ${modules.repair[0]?.completion_rate >= 80 ? '完善报修闭环管理，减少重复故障' : '优化报修响应流程，缩短维修周期'}

## 六、产品需求文档

### 6.1 功能需求

#### P0 - 高优先级
- 实时数据监控看板优化
- 移动端点检扫码功能
- 报修自动派单功能

#### P1 - 中优先级
- 保养计划智能排程
- 备件库存联动
- 故障知识库建设

#### P2 - 低优先级
- 数据报表自动生成
- 多维度统计分析
- 与ERP系统集成

### 6.2 技术需求
- 数据接口标准化
- 移动端适配优化
- 系统性能监控

---
*本报告由AI自动生成，基于${targetDate}的实施数据*`;

    run('INSERT INTO ai_requirements (title, content, data_snapshot) VALUES (?, ?, ?)', [
      `EAM实施进度分析报告 - ${targetDate}`,
      content,
      JSON.stringify({ progress, trend: trend.slice(-7), issues: issues.slice(0, 10) })
    ]);

    res.json({
      title: `EAM实施进度分析报告 - ${targetDate}`,
      content,
      dataUsed: { progressRecords: progress.length, trendDays: trend.length, openIssues: issues.length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get saved requirements
router.get('/requirements', (req, res) => {
  try {
    const requirements = queryAll('SELECT id, title, created_at FROM ai_requirements ORDER BY created_at DESC LIMIT 20');
    res.json({ requirements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific requirement
router.get('/requirements/:id', (req, res) => {
  try {
    const requirement = queryOne('SELECT * FROM ai_requirements WHERE id = ?', [parseInt(req.params.id)]);
    if (!requirement) return res.status(404).json({ error: 'Not found' });
    res.json({ requirement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
