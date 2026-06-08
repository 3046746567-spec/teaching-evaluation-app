const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PASSWORD = 'panwenting2022';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== 数据库 ====================
const USE_POSTGRES = !!process.env.DATABASE_URL;
let db;

if (USE_POSTGRES) {
  // PostgreSQL (云端)
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  db = {
    run: (sql, params) => pool.query(sql, params),
    get: (sql, params) => pool.query(sql, params).then(r => r.rows[0]),
    all: (sql, params) => pool.query(sql, params).then(r => r.rows),
  };
  (async () => {
    try {
      await db.run(`CREATE TABLE IF NOT EXISTS teachers (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
      await db.run(`CREATE TABLE IF NOT EXISTS votes (id SERIAL PRIMARY KEY, voter_id TEXT NOT NULL, teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(voter_id, teacher_id))`);
      const cnt = await db.get('SELECT COUNT(*)::int as cnt FROM teachers');
      if (cnt.cnt === 0) {
        for (const n of ['王老师','张老师','李老师','刘老师','陈老师','杨老师','赵老师','黄老师','周老师','吴老师'])
          await db.run('INSERT INTO teachers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [n]);
        console.log('✅ 默认老师已初始化 (PostgreSQL)');
      }
      console.log('✅ PostgreSQL 连接成功');
    } catch(e) { console.error('❌ PG 初始化失败:', e.message); }
  })();
} else {
  // SQLite (本地)
  const sqlite3 = require('sqlite3').verbose();
  const _db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));
  db = {
    run: (sql, p) => new Promise((ok,no) => _db.run(sql, p, function(e){e?no(e):ok(this)})),
    get: (sql, p) => new Promise((ok,no) => _db.get(sql, p, (e,r)=>e?no(e):ok(r))),
    all: (sql, p) => new Promise((ok,no) => _db.all(sql, p, (e,r)=>e?no(e):ok(r))),
  };
  _db.serialize(() => {
    _db.run(`CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    _db.run(`CREATE TABLE IF NOT EXISTS votes (id INTEGER PRIMARY KEY AUTOINCREMENT, voter_id TEXT NOT NULL, teacher_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE CASCADE, UNIQUE(voter_id, teacher_id))`);
    _db.get('SELECT COUNT(*) as cnt FROM teachers', [], (e,r) => {
      if (!e && r.cnt === 0) {
        const s = _db.prepare('INSERT OR IGNORE INTO teachers(name) VALUES(?)');
        ['王老师','张老师','李老师','刘老师','陈老师','杨老师','赵老师','黄老师','周老师','吴老师'].forEach(n=>s.run(n));
        s.finalize();
        console.log('✅ 默认老师已初始化 (SQLite)');
      }
    });
  });
}

const $1 = p => USE_POSTGRES ? '$1' : '?';
const $2 = (a,b) => USE_POSTGRES ? [a,b] : [a,b]; // same for both in this simple case
const wrap = fn => (req,res) => fn(req,res).catch(e => res.status(500).json({error:e.message}));

// ==================== API ====================
app.post('/api/login', (req,res) => {
  if (req.body.password === PASSWORD) res.json({success:true});
  else res.status(401).json({success:false, message:'密码错误'});
});

app.get('/api/teachers', wrap(async (req,res) => {
  res.json(await db.all('SELECT * FROM teachers ORDER BY created_at ASC'));
}));

app.post('/api/teachers', wrap(async (req,res) => {
  if (req.body.password !== PASSWORD) return res.status(403).json({error:'无权操作'});
  const name = (req.body.name||'').trim();
  if (!name) return res.status(400).json({error:'老师姓名不能为空'});
  try {
    const r = USE_POSTGRES
      ? await db.run('INSERT INTO teachers(name) VALUES($1) RETURNING id', [name])
      : await db.run('INSERT INTO teachers(name) VALUES(?)', [name]);
    const id = USE_POSTGRES ? r.rows[0].id : r.lastID;
    res.json({id, name});
  } catch(e) {
    if (e.message && (e.message.includes('UNIQUE') || e.code==='23505')) return res.status(400).json({error:'该老师已存在'});
    throw e;
  }
}));

app.delete('/api/teachers/:id', wrap(async (req,res) => {
  if (req.body.password !== PASSWORD) return res.status(403).json({error:'无权操作'});
  await db.run('DELETE FROM votes WHERE teacher_id=$1', [req.params.id]);
  await db.run('DELETE FROM teachers WHERE id=$1', [req.params.id]);
  res.json({success:true});
}));

app.post('/api/vote', wrap(async (req,res) => {
  const {voter_id, teacher_id} = req.body;
  if (!voter_id || !teacher_id) return res.status(400).json({error:'缺少参数'});
  const exist = await db.get('SELECT id FROM votes WHERE voter_id=$1 AND teacher_id=$2', [voter_id, teacher_id]);
  if (exist) return res.status(400).json({error:'已经为该老师投过票了'});
  const cnt = await db.get('SELECT COUNT(*) as c FROM votes WHERE voter_id=$1', [voter_id]);
  const c = parseInt(cnt.c);
  if (c >= 3) return res.status(400).json({error:'投票次数已用完（每人最多3票）'});
  await db.run('INSERT INTO votes(voter_id,teacher_id) VALUES($1,$2)', [voter_id, teacher_id]);
  res.json({success:true, remaining:2-c, total_used:c+1});
}));

app.get('/api/stats', wrap(async (req,res) => {
  const rows = await db.all('SELECT t.id,t.name,COUNT(v.id) as vote_count FROM teachers t LEFT JOIN votes v ON t.id=v.teacher_id GROUP BY t.id ORDER BY vote_count DESC, t.name ASC');
  res.json(rows);
}));

app.get('/api/my-votes', wrap(async (req,res) => {
  if (!req.query.voter_id) return res.status(400).json({error:'缺少参数'});
  const rows = await db.all('SELECT teacher_id FROM votes WHERE voter_id=$1', [req.query.voter_id]);
  res.json(rows.map(r=>r.teacher_id));
}));

app.post('/api/reset-votes', wrap(async (req,res) => {
  if (req.body.password !== PASSWORD) return res.status(403).json({error:'无权操作'});
  await db.run('DELETE FROM votes');
  res.json({success:true, message:'所有票数已归零'});
}));

app.get('/api/total-votes', wrap(async (req,res) => {
  const r = await db.get('SELECT COUNT(DISTINCT voter_id) as total FROM votes');
  res.json({total_voters: parseInt(r.total)||0});
}));

// ==================== 页面 ====================
app.get('/', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/intern', (req,res) => res.sendFile(path.join(__dirname,'public','intern.html')));
app.get('/headnurse', (req,res) => res.sendFile(path.join(__dirname,'public','headnurse.html')));

// ==================== 启动 ====================
app.listen(PORT, '127.0.0.1', () => {
  console.log('╔══════════════════════════════════════╗');
  console.log('║  🏥 护理实习生评价系统 v2.0        ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║ 📍 http://0.0.0.0:${PORT}             ║`);
  console.log(`║ 🗄️  ${USE_POSTGRES ? 'PostgreSQL ☁️' : 'SQLite 💻'}                        ║`);
  console.log('║                                      ║');
  console.log('║ 🎓 实习生:  /intern                  ║');
  console.log('║ 🩺 护士长:  /headnurse               ║');
  console.log('╚══════════════════════════════════════╝');
});
