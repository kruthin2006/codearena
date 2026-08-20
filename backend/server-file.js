const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');

const app = express();

// ✅ FIX: Use PORT from environment (Render) or default 5000
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ============ DATABASE ============
const DB_FILE = path.join(__dirname, 'database.json');

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      users: [],
      problems: [],
      submissions: [],
      _meta: { userIdCounter: 1, problemIdCounter: 1, submissionIdCounter: 1 }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getNextId(db, type) {
  const key = type + 'IdCounter';
  const id = db._meta[key] || 1;
  db._meta[key] = id + 1;
  writeDB(db);
  return String(id);
}

// ============ MIDDLEWARE ============
function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Auth required' });
    req.user = jwt.verify(token, 'secretkey');
    next();
  } catch (e) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'setter') {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  next();
}

// ============ AUTH ROUTES ============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const db = readDB();
    if (db.users.find(u => u.username === username)) {
      return res.status(400).json({ success: false, message: 'User exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      _id: getNextId(db, 'user'),
      username,
      email,
      password: hashedPassword,
      role: role || 'student',
      stats: { problemsSolved: 0, totalAttempts: 0 },
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    writeDB(db);
    const token = jwt.sign({ userId: user._id, role: user.role }, 'secretkey', { expiresIn: '7d' });
    res.json({ success: true, token, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, 'secretkey', { expiresIn: '7d' });
    res.json({ success: true, token, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false });
    const decoded = jwt.verify(token, 'secretkey');
    const db = readDB();
    const user = db.users.find(u => u._id === decoded.userId);
    res.json({ success: true, user });
  } catch (e) {
    res.status(401).json({ success: false });
  }
});

// ============ PROBLEMS ============
app.get('/api/problems', auth, (req, res) => {
  const db = readDB();
  res.json({ success: true, problems: db.problems });
});

app.get('/api/problems/:id', auth, (req, res) => {
  const db = readDB();
  const problem = db.problems.find(p => p._id === req.params.id);
  if (!problem) {
    return res.status(404).json({ success: false, message: 'Problem not found' });
  }
  res.json({ success: true, problem });
});

// ============ ADMIN - CREATE PROBLEM ============
app.post('/api/admin/problems', auth, adminOnly, (req, res) => {
  try {
    const db = readDB();
    const newId = getNextId(db, 'problem');
    const newProblem = {
      _id: newId,
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      sampleInput: req.body.sampleInput || '',
      sampleOutput: req.body.sampleOutput || '',
      constraints: req.body.constraints || '',
      difficulty: req.body.difficulty || 'Easy',
      testCases: req.body.testCases || [{ input: '', output: '' }],
      setter: req.user.userId,
      createdAt: new Date().toISOString()
    };
    db.problems.push(newProblem);
    writeDB(db);
    res.status(201).json({ success: true, problem: newProblem });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ============ ADMIN - DELETE PROBLEM ============
app.delete('/api/admin/problems/:id', auth, adminOnly, (req, res) => {
  try {
    const db = readDB();
    const problemId = req.params.id;
    const index = db.problems.findIndex(p => p._id === problemId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    db.problems.splice(index, 1);
    writeDB(db);
    res.json({ success: true, message: 'Problem deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ============ CODE EXECUTION ============
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function executeJava(code, input) {
  return new Promise((resolve) => {
    const fileName = 'Solution_' + Date.now();
    const javaFile = path.join(TEMP_DIR, fileName + '.java');
    const classFile = path.join(TEMP_DIR, fileName + '.class');
    
    let preparedCode = code;
    if (!code.includes('public class') && !code.includes('class')) {
      preparedCode = 'public class ' + fileName + ' {\n    public static void main(String[] args) {\n        ' + code + '\n    }\n}';
    } else {
      preparedCode = code.replace(/public\s+class\s+\w+/, 'public class ' + fileName);
    }
    
    fs.writeFileSync(javaFile, preparedCode);
    
    exec('javac ' + javaFile, (compileError, stdout, stderr) => {
      if (compileError) {
        try { fs.unlinkSync(javaFile); } catch(e) {}
        resolve({ output: '', error: 'Compilation Error:\n' + (stderr || compileError.message), status: 'compile_error' });
        return;
      }
      
      const child = exec('cd ' + TEMP_DIR + ' && java ' + fileName, { timeout: 5000 });
      let output = '';
      let error = '';
      
      child.stdout.on('data', (data) => { output += data; });
      child.stderr.on('data', (data) => { error += data; });
      
      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      }
      
      child.on('close', (code) => {
        try { if (fs.existsSync(javaFile)) fs.unlinkSync(javaFile); } catch(e) {}
        try { if (fs.existsSync(classFile)) fs.unlinkSync(classFile); } catch(e) {}
        if (code === 0) {
          resolve({ output: output || '✅ Program executed successfully', error: '', status: 'success' });
        } else {
          resolve({ output: output || '', error: error || 'Runtime Error', status: 'runtime_error' });
        }
      });
      
      child.on('error', (err) => {
        try { if (fs.existsSync(javaFile)) fs.unlinkSync(javaFile); } catch(e) {}
        try { if (fs.existsSync(classFile)) fs.unlinkSync(classFile); } catch(e) {}
        resolve({ output: '', error: err.message, status: 'error' });
      });
    });
  });
}

function executeCpp(code, input) {
  return new Promise((resolve) => {
    const fileName = 'Solution_' + Date.now();
    const cppFile = path.join(TEMP_DIR, fileName + '.cpp');
    const exeFile = path.join(TEMP_DIR, fileName + '.exe');
    
    let preparedCode = code;
    if (!code.includes('#include')) {
      preparedCode = '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ' + code + '\n    return 0;\n}';
    }
    
    fs.writeFileSync(cppFile, preparedCode);
    
    exec('g++ ' + cppFile + ' -o ' + exeFile, (compileError, stdout, stderr) => {
      if (compileError) {
        try { fs.unlinkSync(cppFile); } catch(e) {}
        resolve({ output: '', error: 'Compilation Error:\n' + (stderr || compileError.message), status: 'compile_error' });
        return;
      }
      
      const child = exec('cd ' + TEMP_DIR + ' && ' + fileName + '.exe', { timeout: 5000 });
      let output = '';
      let error = '';
      
      child.stdout.on('data', (data) => { output += data; });
      child.stderr.on('data', (data) => { error += data; });
      
      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      }
      
      child.on('close', (code) => {
        try { if (fs.existsSync(cppFile)) fs.unlinkSync(cppFile); } catch(e) {}
        try { if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile); } catch(e) {}
        if (code === 0) {
          resolve({ output: output || '✅ Program executed successfully', error: '', status: 'success' });
        } else {
          resolve({ output: output || '', error: error || 'Runtime Error', status: 'runtime_error' });
        }
      });
      
      child.on('error', (err) => {
        try { if (fs.existsSync(cppFile)) fs.unlinkSync(cppFile); } catch(e) {}
        try { if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile); } catch(e) {}
        resolve({ output: '', error: err.message, status: 'error' });
      });
    });
  });
}

// ============ SUBMISSIONS ============
app.post('/api/submissions/run', auth, async (req, res) => {
  try {
    const { code, language, input } = req.body;
    console.log('📝 Running code...');
    console.log('  Language:', language);
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'No code provided' });
    }
    
    let result;
    if (language === 'java') {
      result = await executeJava(code, input || '');
    } else if (language === 'cpp') {
      result = await executeCpp(code, input || '');
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported language' });
    }
    
    res.json({
      success: true,
      output: result.output || '',
      error: result.error || '',
      status: result.status
    });
  } catch (error) {
    console.error('❌ Run error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/submissions/submit', auth, async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    const db = readDB();
    const problem = db.problems.find(p => p._id === problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    
    const results = [];
    let passedCount = 0;
    
    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];
      let result;
      if (language === 'java') {
        result = await executeJava(code, tc.input);
      } else if (language === 'cpp') {
        result = await executeCpp(code, tc.input);
      } else {
        return res.status(400).json({ success: false, message: 'Unsupported language' });
      }
      
      const output = result.output?.trim() || '';
      const expected = tc.output.trim();
      const passed = output === expected;
      
      if (passed) passedCount++;
      results.push({ passed, output, expected, error: result.error || '' });
    }
    
    const total = problem.testCases.length;
    const score = total > 0 ? (passedCount / total) * 100 : 0;
    const status = passedCount === total ? 'accepted' : 'wrong_answer';
    
    const submission = {
      _id: getNextId(db, 'submission'),
      problem: problemId,
      problemTitle: problem.title,
      user: req.user.userId,
      code,
      language,
      status,
      results,
      score,
      totalTestCases: total,
      passedTestCases: passedCount,
      submittedAt: new Date().toISOString()
    };
    
    db.submissions.push(submission);
    
    const user = db.users.find(u => u._id === req.user.userId);
    if (user) {
      if (status === 'accepted') {
        const existing = db.submissions.find(s => s.problem === problemId && s.user === req.user.userId && s.status === 'accepted');
        if (!existing) {
          user.stats.problemsSolved = (user.stats.problemsSolved || 0) + 1;
        }
      }
      user.stats.totalAttempts = (user.stats.totalAttempts || 0) + 1;
    }
    writeDB(db);
    
    res.json({
      success: true,
      submissionId: submission._id,
      status,
      score,
      passedTestCases: passedCount,
      totalTestCases: total,
      results
    });
  } catch (error) {
    console.error('❌ Submit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/submissions/user', auth, (req, res) => {
  const db = readDB();
  const subs = db.submissions.filter(s => s.user === req.user.userId);
  res.json({ success: true, submissions: subs });
});

// ============ ADMIN ANALYTICS ============
app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  try {
    const db = readDB();
    const users = db.users.map(u => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
      stats: u.stats,
      createdAt: u.createdAt
    }));
    res.json({ success: true, users });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/admin/submissions', auth, adminOnly, (req, res) => {
  try {
    const db = readDB();
    const submissions = db.submissions.map(s => {
      const user = db.users.find(u => u._id === s.user);
      return {
        ...s,
        username: user?.username || 'Unknown',
        problemTitle: s.problemTitle || 'Unknown Problem'
      };
    });
    res.json({ success: true, submissions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/admin/problem-stats', auth, adminOnly, (req, res) => {
  try {
    const db = readDB();
    const stats = db.problems.map(p => {
      const subs = db.submissions.filter(s => s.problem === p._id);
      const accepted = subs.filter(s => s.status === 'accepted');
      const users = [...new Set(subs.map(s => s.user))];
      
      return {
        problemId: p._id,
        title: p.title,
        totalSubmissions: subs.length,
        acceptedSubmissions: accepted.length,
        uniqueSolvers: users.length,
        submissions: subs.map(s => {
          const user = db.users.find(u => u._id === s.user);
          return {
            username: user?.username || 'Unknown',
            status: s.status,
            score: s.score,
            submittedAt: s.submittedAt
          };
        })
      };
    });
    res.json({ success: true, stats });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ============ ONLINE USERS ============
const onlineUsers = new Map();

app.post('/api/admin/heartbeat', auth, (req, res) => {
  onlineUsers.set(req.user.userId, Date.now());
  res.json({ success: true });
});

app.get('/api/admin/online-users', auth, adminOnly, (req, res) => {
  const db = readDB();
  const now = Date.now();
  const online = db.users
    .filter(u => onlineUsers.has(u._id) && (now - onlineUsers.get(u._id) < 15000))
    .map(u => ({
      _id: u._id,
      username: u.username,
      role: u.role
    }));
  res.json({ success: true, online });
});

setInterval(() => {
  const now = Date.now();
  for (const [userId, lastBeat] of onlineUsers) {
    if (now - lastBeat > 15000) {
      onlineUsers.delete(userId);
    }
  }
}, 10000);

// ============ CREATE DEFAULT ADMIN ============
function createDefaultAdmin() {
  const db = readDB();
  if (db.users.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.users.push({
      _id: '1',
      username: 'admin',
      email: 'admin@codearena.com',
      password: hashedPassword,
      role: 'admin',
      stats: { problemsSolved: 0, totalAttempts: 0 },
      createdAt: new Date().toISOString()
    });
    db._meta.userIdCounter = 2;
    writeDB(db);
    console.log('✅ Admin created: admin / admin123');
  }
}

createDefaultAdmin();

// ✅ FIX: Use PORT from environment and bind to 0.0.0.0 for Render
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('🚀 CodeArena Server Running!');
  console.log('📍 Port:', PORT);
  console.log('📝 Login: admin / admin123');
  console.log('========================================\n');
});