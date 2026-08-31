import { Router } from 'express';
import { queryAll, queryOne, run } from '../models/database.js';
const router = Router();

// Get EAM module detail
router.get('/:module', (req, res) => {
  const { module } = req.params;
  const { date, page = '1', pageSize = '20', status, priority, sort = 'id', order = 'desc' } = req.query;

  if (!['inspection', 'maintenance', 'repair'].includes(module)) {
    return res.status(400).json({ error: 'Invalid module' });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const progress = queryOne('SELECT * FROM daily_progress WHERE date = ? AND module = ?', [targetDate, module]);

    // Tasks with pagination
    let where = 'WHERE date = ? AND module = ?';
    let params = [targetDate, module];

    if (status) { where += ' AND status = ?'; params.push(status); }
    if (priority) { where += ' AND priority = ?'; params.push(priority); }

    const countResult = queryOne(`SELECT COUNT(*) as cnt FROM tasks ${where}`, params);
    const total = countResult?.cnt || 0;

    const validSorts = ['id', 'title', 'status', 'priority', 'assignee', 'due_date', 'created_at'];
    const sortCol = validSorts.includes(sort) ? sort : 'id';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const tasks = queryAll(`SELECT * FROM tasks ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`, [...params, parseInt(pageSize), offset]);

    const issues = queryAll('SELECT * FROM issues WHERE date = ? AND module = ? ORDER BY CASE severity WHEN \'critical\' THEN 1 WHEN \'high\' THEN 2 WHEN \'medium\' THEN 3 WHEN \'low\' THEN 4 END, created_at DESC', [targetDate, module]);

    const statusCounts = queryAll('SELECT status, COUNT(*) as count FROM tasks WHERE date = ? AND module = ? GROUP BY status', [targetDate, module]);
    const stats = { completed: 0, in_progress: 0, pending: 0, blocked: 0 };
    statusCounts.forEach(s => { stats[s.status] = s.count; });

    res.json({
      module,
      date: targetDate,
      progress: progress || { total_tasks: 0, completed_tasks: 0, in_progress_tasks: 0, pending_tasks: 0, blocked_tasks: 0, completion_rate: 0, response_time_avg: 0, issues_count: 0 },
      tasks: { data: tasks, pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / parseInt(pageSize)) } },
      issues,
      stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status
router.put('/tasks/:taskId', (req, res) => {
  const { taskId } = req.params;
  const { status, assignee } = req.body;

  try {
    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'completed') updates.push("completed_at = datetime('now')");
    }
    if (assignee !== undefined) { updates.push('assignee = ?'); params.push(assignee); }
    updates.push("updated_at = datetime('now')");
    params.push(parseInt(taskId));

    run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, params);
    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [parseInt(taskId)]);
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task
router.post('/tasks', (req, res) => {
  const { date, module, title, description, status, priority, assignee, due_date } = req.body;

  try {
    const result = run(`
      INSERT INTO tasks (date, module, title, description, status, priority, assignee, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [date, module, title, description || '', status || 'pending', priority || 'medium', assignee || '', due_date || null]);

    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
