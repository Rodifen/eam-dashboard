import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let db;
let dbPath;

export function getDb() {
  return db;
}

export async function initializeDatabase() {
  const SQL = await initSqlJs();
  dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/eam.db');

  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Load existing DB or create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS data_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('demo', 'manual', 'sql')),
      config TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      module TEXT NOT NULL CHECK(module IN ('inspection', 'maintenance', 'repair')),
      total_tasks INTEGER DEFAULT 0,
      completed_tasks INTEGER DEFAULT 0,
      in_progress_tasks INTEGER DEFAULT 0,
      pending_tasks INTEGER DEFAULT 0,
      blocked_tasks INTEGER DEFAULT 0,
      completion_rate REAL DEFAULT 0,
      response_time_avg REAL DEFAULT 0,
      issues_count INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      data_source TEXT DEFAULT 'demo',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      module TEXT NOT NULL CHECK(module IN ('inspection', 'maintenance', 'repair')),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('completed', 'in_progress', 'pending', 'blocked')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
      assignee TEXT DEFAULT '',
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      module TEXT NOT NULL CHECK(module IN ('inspection', 'maintenance', 'repair')),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      severity TEXT DEFAULT 'medium' CHECK(severity IN ('critical', 'high', 'medium', 'low')),
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'resolved', 'closed')),
      assigned_to TEXT DEFAULT '',
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      user_name TEXT DEFAULT 'System',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ai_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      data_snapshot TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create unique index for daily_progress
  try {
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_progress_unique ON daily_progress(date, module, data_source)`);
  } catch (e) { /* ignore if exists */ }

  // Seed demo data if empty
  const result = db.exec("SELECT COUNT(*) as cnt FROM daily_progress");
  const count = result[0]?.values[0]?.[0] || 0;
  if (count === 0) {
    seedDemoData();
  }

  // Set demo as active if no active source
  const activeResult = db.exec("SELECT COUNT(*) as cnt FROM data_sources WHERE is_active = 1");
  const activeCount = activeResult[0]?.values[0]?.[0] || 0;
  if (activeCount === 0) {
    db.run("INSERT OR IGNORE INTO data_sources (name, type, is_active) VALUES (?, ?, 1)", ['Demo Data', 'demo']);
  }

  saveDb();
  console.log('Database initialized successfully.');
}

export function saveDb() {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Helper: convert exec result to array of objects
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: get single row
export function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

// Helper: run statement (INSERT/UPDATE/DELETE)
export function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] || 0, changes: db.getRowsModified() };
}

function seedDemoData() {
  const modules = ['inspection', 'maintenance', 'repair'];
  const today = new Date();

  const taskTitles = {
    inspection: [
      '生产线A设备点检', '空压系统点检', '电气线路巡检', '液压系统检查',
      '传动装置点检', '冷却系统检查', '安全防护装置检查', '仪表校验',
      '润滑系统点检', '气动元件检查', '电机运行状态检查', '变频器参数核查'
    ],
    maintenance: [
      '月度设备保养-冲压机', '季度润滑保养', '年度大修计划-注塑机', '滤芯更换保养',
      '皮带张力调整', '轴承更换保养', '电气柜清洁保养', '冷却塔清洗保养',
      '空压机保养', '液压油更换', '传感器校准保养', '模具保养维护'
    ],
    repair: [
      'CNC主轴异响维修', '传送带断裂紧急修复', '液压缸泄漏修复', '电气控制柜故障排查',
      '注塑机温控故障', '空压机过热保护', 'PLC程序异常修复', '伺服电机故障维修',
      '变频器报警处理', '气缸动作失灵修复', '传感器信号异常', '机械手定位偏差修复'
    ]
  };

  const assignees = ['张工', '李工', '王工', '赵工', '刘工', '陈工'];
  const severities = ['critical', 'high', 'medium', 'low'];
  const priorities = ['high', 'medium', 'low'];
  const actions = ['完成任务', '提交报告', '发现问题', '更新状态', '分配任务'];

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    for (const mod of modules) {
      const baseTotal = mod === 'inspection' ? 12 : mod === 'maintenance' ? 8 : 6;
      const total = baseTotal + Math.floor(Math.random() * 5);
      const completed = Math.floor(total * (0.6 + Math.random() * 0.3));
      const inProgress = Math.floor((total - completed) * 0.5);
      const blocked = Math.floor(Math.random() * 2);
      const pending = Math.max(0, total - completed - inProgress - blocked);
      const rate = Math.round((completed / total) * 100 * 10) / 10;
      const responseTime = mod === 'repair' ? (15 + Math.random() * 45) : 0;
      const issues = Math.floor(Math.random() * 3);

      try {
        db.run(`
          INSERT OR REPLACE INTO daily_progress (date, module, total_tasks, completed_tasks, in_progress_tasks, pending_tasks, blocked_tasks, completion_rate, response_time_avg, issues_count, notes, data_source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'demo')
        `, [dateStr, mod, total, completed, inProgress, pending, blocked, rate, Math.round(responseTime * 10) / 10, issues, dayOffset === 0 ? '今日数据更新中' : '']);
      } catch (e) { /* ignore duplicate */ }

      // Insert tasks
      const titles = taskTitles[mod];
      for (let i = 0; i < Math.min(total, titles.length); i++) {
        const status = i < completed ? 'completed' : i < completed + inProgress ? 'in_progress' : i < completed + inProgress + pending ? 'pending' : 'blocked';
        try {
          db.run(`
            INSERT INTO tasks (date, module, title, description, status, priority, assignee, due_date, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [dateStr, mod, titles[i], `${titles[i]}的详细描述`, status, priorities[Math.floor(Math.random() * 3)], assignees[Math.floor(Math.random() * assignees.length)], dateStr, status === 'completed' ? dateStr + 'T17:00:00' : null]);
        } catch (e) { /* ignore */ }
      }

      // Insert issues
      if (issues > 0) {
        for (let i = 0; i < issues; i++) {
          const modName = mod === 'inspection' ? '点检' : mod === 'maintenance' ? '保养' : '报修';
          try {
            db.run(`
              INSERT INTO issues (date, module, title, description, severity, status, assigned_to)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [dateStr, mod, `${modName}异常-${i + 1}`, `在${dateStr}的${modName}任务中发现的异常情况`, severities[Math.floor(Math.random() * severities.length)], dayOffset > 5 ? 'resolved' : 'open', assignees[Math.floor(Math.random() * assignees.length)]]);
          } catch (e) { /* ignore */ }
        }
      }
    }

    // Activity log
    for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) {
      const mod = modules[Math.floor(Math.random() * 3)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const modName = mod === 'inspection' ? '点检' : mod === 'maintenance' ? '保养' : '报修';
      try {
        db.run(`
          INSERT INTO activity_log (date, module, action, description, user_name, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [dateStr, mod, action, `${modName}模块：${action} - ${taskTitles[mod][Math.floor(Math.random() * taskTitles[mod].length)]}`, assignees[Math.floor(Math.random() * assignees.length)], `${dateStr}T${8 + Math.floor(Math.random() * 10)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`]);
      } catch (e) { /* ignore */ }
    }
  }

  saveDb();
  console.log('Demo data seeded successfully.');
}
