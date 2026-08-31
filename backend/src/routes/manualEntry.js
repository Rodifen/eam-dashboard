import { Router } from 'express';
import { run } from '../models/database.js';
const router = Router();

// Submit daily progress
router.post('/progress', (req, res) => {
  const { date, module, total_tasks, completed_tasks, in_progress_tasks, pending_tasks, blocked_tasks, notes } = req.body;
  try {
    const total = total_tasks || 0;
    const completed = completed_tasks || 0;
    const completion_rate = total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;

    run(`
      INSERT INTO daily_progress (date, module, total_tasks, completed_tasks, in_progress_tasks, pending_tasks, blocked_tasks, completion_rate, issues_count, notes, data_source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
    `, [date, module, total, completed, in_progress_tasks || 0, pending_tasks || 0, blocked_tasks || 0, completion_rate, 0, notes || '']);

    res.json({ success: true, message: '数据提交成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch import
router.post('/batch', (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records must be an array' });

  try {
    let imported = 0;
    for (const r of records) {
      const total = r.total_tasks || 0;
      const completed = r.completed_tasks || 0;
      const rate = total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;
      run(`
        INSERT INTO daily_progress (date, module, total_tasks, completed_tasks, in_progress_tasks, pending_tasks, blocked_tasks, completion_rate, issues_count, notes, data_source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
      `, [r.date, r.module, total, completed, r.in_progress_tasks || 0, r.pending_tasks || 0, r.blocked_tasks || 0, rate, 0, r.notes || '']);
      imported++;
    }
    res.json({ success: true, imported });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
