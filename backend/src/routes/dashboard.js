import { Router } from 'express';
import { queryAll, queryOne } from '../models/database.js';
const router = Router();

// Get dashboard summary
router.get('/summary', (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const progress = queryAll('SELECT * FROM daily_progress WHERE date = ? ORDER BY module', [targetDate]);

    const totalTasks = progress.reduce((sum, p) => sum + p.total_tasks, 0);
    const completedTasks = progress.reduce((sum, p) => sum + p.completed_tasks, 0);
    const inProgressTasks = progress.reduce((sum, p) => sum + p.in_progress_tasks, 0);
    const pendingTasks = progress.reduce((sum, p) => sum + p.pending_tasks, 0);
    const blockedTasks = progress.reduce((sum, p) => sum + p.blocked_tasks, 0);
    const totalIssues = progress.reduce((sum, p) => sum + p.issues_count, 0);
    const avgCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100 * 10) / 10 : 0;

    const moduleStatus = {
      inspection: progress.find(p => p.module === 'inspection') || { completion_rate: 0, total_tasks: 0, completed_tasks: 0 },
      maintenance: progress.find(p => p.module === 'maintenance') || { completion_rate: 0, total_tasks: 0, completed_tasks: 0 },
      repair: progress.find(p => p.module === 'repair') || { completion_rate: 0, total_tasks: 0, completed_tasks: 0 }
    };

    const repairData = progress.find(p => p.module === 'repair');
    const repairResponseRate = repairData ? Math.max(0, Math.min(100, 100 - repairData.response_time_avg)) : 0;

    res.json({
      date: targetDate,
      summary: { totalTasks, completedTasks, inProgressTasks, pendingTasks, blockedTasks, totalIssues, avgCompletion },
      modules: {
        inspection: { name: '点检', completionRate: moduleStatus.inspection.completion_rate, totalTasks: moduleStatus.inspection.total_tasks, completedTasks: moduleStatus.inspection.completed_tasks },
        maintenance: { name: '保养', completionRate: moduleStatus.maintenance.completion_rate, totalTasks: moduleStatus.maintenance.total_tasks, completedTasks: moduleStatus.maintenance.completed_tasks },
        repair: { name: '报修', completionRate: moduleStatus.repair.completion_rate, responseRate: Math.round(repairResponseRate * 10) / 10, totalTasks: moduleStatus.repair.total_tasks, completedTasks: moduleStatus.repair.completed_tasks, avgResponseTime: repairData ? repairData.response_time_avg : 0 }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get trend data
router.get('/trend', (req, res) => {
  const { days = '7', module } = req.query;
  const numDays = parseInt(days);

  try {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - numDays);
    const startStr = startDate.toISOString().split('T')[0];

    let data;
    if (module && module !== 'all') {
      data = queryAll('SELECT * FROM daily_progress WHERE date >= ? AND module = ? ORDER BY date ASC', [startStr, module]);
    } else {
      data = queryAll('SELECT * FROM daily_progress WHERE date >= ? ORDER BY date ASC', [startStr]);
    }

    const grouped = {};
    data.forEach(row => {
      if (!grouped[row.date]) grouped[row.date] = { date: row.date, inspection: null, maintenance: null, repair: null };
      grouped[row.date][row.module] = row;
    });

    const trend = Object.values(grouped).map(day => ({
      date: day.date,
      inspection: day.inspection ? day.inspection.completion_rate : 0,
      maintenance: day.maintenance ? day.maintenance.completion_rate : 0,
      repair: day.repair ? day.repair.completion_rate : 0,
      total: Math.round(((day.inspection?.completion_rate || 0) + (day.maintenance?.completion_rate || 0) + (day.repair?.completion_rate || 0)) / 3 * 10) / 10
    }));

    res.json({ days: numDays, trend });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent activity
router.get('/activity', (req, res) => {
  const { limit = '20' } = req.query;
  try {
    const activities = queryAll('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?', [parseInt(limit)]);
    res.json({ activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
