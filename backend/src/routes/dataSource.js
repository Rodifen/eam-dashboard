import { Router } from 'express';
import { queryAll, queryOne, run } from '../models/database.js';
const router = Router();

// List all data sources
router.get('/', (req, res) => {
  try {
    const sources = queryAll('SELECT * FROM data_sources ORDER BY created_at DESC');
    const active = sources.find(s => s.is_active === 1);
    res.json({ sources, activeSource: active || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get active data source
router.get('/active', (req, res) => {
  try {
    const source = queryOne('SELECT * FROM data_sources WHERE is_active = 1');
    res.json({ source: source || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create data source
router.post('/', (req, res) => {
  const { name, type, config } = req.body;
  try {
    const result = run('INSERT INTO data_sources (name, type, config) VALUES (?, ?, ?)', [name, type, JSON.stringify(config || {})]);
    const source = queryOne('SELECT * FROM data_sources WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ source });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update data source
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, config } = req.body;
  try {
    const updates = [];
    const params = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (type) { updates.push('type = ?'); params.push(type); }
    if (config) { updates.push('config = ?'); params.push(JSON.stringify(config)); }
    updates.push("updated_at = datetime('now')");
    params.push(parseInt(id));

    run(`UPDATE data_sources SET ${updates.join(', ')} WHERE id = ?`, params);
    const source = queryOne('SELECT * FROM data_sources WHERE id = ?', [parseInt(id)]);
    res.json({ source });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activate data source
router.post('/:id/activate', (req, res) => {
  const { id } = req.params;
  try {
    run('UPDATE data_sources SET is_active = 0');
    run('UPDATE data_sources SET is_active = 1 WHERE id = ?', [parseInt(id)]);
    const source = queryOne('SELECT * FROM data_sources WHERE id = ?', [parseInt(id)]);
    res.json({ source });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test SQL connection
router.post('/test-connection', async (req, res) => {
  const { dbType, host, port, database, username, password } = req.body;
  try {
    const startTime = Date.now();
    if (dbType === 'mysql') {
      const mysql = await import('mysql2/promise');
      const client = await mysql.createConnection({ host, port: parseInt(port) || 3306, user: username, password, database, connectTimeout: 5000 });
      await client.execute('SELECT 1');
      await client.end();
    } else if (dbType === 'postgresql') {
      const { Client } = await import('pg');
      const client = new Client({ host, port: parseInt(port) || 5432, user: username, password, database, connectionTimeoutMillis: 5000 });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
    } else if (dbType === 'mssql') {
      const sql = await import('mssql');
      await sql.connect({ server: host, port: parseInt(port) || 1433, user: username, password, database, options: { connectTimeout: 5000, encrypt: false } });
      await sql.query('SELECT 1');
      await sql.close();
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported database type' });
    }
    const latency = Date.now() - startTime;
    res.json({ success: true, latency, message: `连接成功 (${latency}ms)` });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Execute SQL query
router.post('/execute-query', async (req, res) => {
  const { dbType, host, port, database, username, password, query } = req.body;
  try {
    let rows;
    if (dbType === 'mysql') {
      const mysql = await import('mysql2/promise');
      const conn = await mysql.createConnection({ host, port: parseInt(port) || 3306, user: username, password, database });
      const [result] = await conn.execute(query + ' LIMIT 100');
      rows = result;
      await conn.end();
    } else if (dbType === 'postgresql') {
      const { Client } = await import('pg');
      const client = new Client({ host, port: parseInt(port) || 5432, user: username, password, database });
      await client.connect();
      const result = await client.query(query + ' LIMIT 100');
      rows = result.rows;
      await client.end();
    } else if (dbType === 'mssql') {
      const sql = await import('mssql');
      await sql.connect({ server: host, port: parseInt(port) || 1433, user: username, password, database });
      const result = await sql.query(query);
      rows = result.recordset;
      await sql.close();
    }
    res.json({ success: true, rows: rows || [], count: rows?.length || 0 });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Delete data source
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    const source = queryOne('SELECT * FROM data_sources WHERE id = ?', [parseInt(id)]);
    if (source?.is_active) return res.status(400).json({ error: 'Cannot delete active data source' });
    run('DELETE FROM data_sources WHERE id = ?', [parseInt(id)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
