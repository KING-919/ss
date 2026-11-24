import express from 'express';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import initSqlJs, { type Database } from 'sql.js';
import { createServer as createViteServer } from 'vite';
import {
  signWeakJwt,
  verifyWeakJwt,
  resolveVirtualFile,
  executeSandboxedPing,
  resolveSandboxedSsrf,
  unsafeMerge,
  renderVulnerableTemplate,
} from './src/utils/labSandbox';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'school.sqlite');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads_sandbox');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

let db: Database;
const sqlLogs: Array<{ ts: string; route: string; query: string }> = [];

function logSql(route: string, query: string) {
  sqlLogs.unshift({ ts: new Date().toISOString(), route, query });
  if (sqlLogs.length > 50) sqlLogs.pop();
}

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

function queryAll(sql: string, params?: unknown[]): Record<string, unknown>[] {
  if (params && params.length > 0) {
    const stmt = db.prepare(sql);
    stmt.bind(params as (string | number | null | Uint8Array)[]);
    const rows: Record<string, unknown>[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as Record<string, unknown>);
    }
    stmt.free();
    return rows;
  }
  const results = db.exec(sql);
  if (!results.length) return [];
  const { columns, values } = results[0];
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

function runStmt(sql: string, params: unknown[] = []) {
  const stmt = db.prepare(sql);
  stmt.run(params as (string | number | null | Uint8Array)[]);
  stmt.free();
  saveDb();
}

export const DEFAULT_SITE_SETTINGS = {
  siteName: 'منصة ثانوية العارضة',
  heroTitle: 'مرحباً بكم في منصة ثانوية العارضة',
  heroSubtitle:
    'منصة تعليمية متطورة تهدف إلى تطوير قدرات الطلاب ومساعدتهم في التحضير الأمثل لاختبارات القدرات والتحصيلي من خلال أدوات تفاعلية ومصادر شاملة',
  heroPrimaryBtn: 'استكشف خطط المذاكرة',
  heroSecondaryBtn: 'تصفح المصادر',
  stat1Value: '+1250',
  stat1Label: 'طالب مسجل',
  stat2Value: '95%',
  stat2Label: 'معدل النجاح',
  stat3Value: '+200',
  stat3Label: 'مصدر تعليمي',
  featuresTitle: 'ميزات المنصة',
  featuresSubtitle:
    'اكتشف مجموعة شاملة من الأدوات والمصادر المصممة لمساعدتك في تحقيق أهدافك التعليمية',
  ctaTitle: 'هل أنت مستعد لبدء رحلتك التعليمية؟',
  ctaSubtitle: 'انضم إلى آلاف الطلاب الذين حققوا نتائج مميزة من خلال منصتنا',
  footerText:
    'منصة تعليمية متطورة لتطوير قدرات الطلاب ومساعدتهم في التحضير لاختبارات القدرات والتحصيلي',
  copyrightText: '© 2026 منصة ثانوية العارضة. جميع الحقوق محفوظة.',
  primaryColor: '#4f46e5',
  secondaryColor: '#2563eb',
  accentColor: '#0284c7',
  backgroundColor: '#f8fafc',
  cardColor: '#ffffff',
  textColor: '#0f172a',
  heroGradientFrom: '#4f46e5',
  heroGradientTo: '#7c3aed',
  fontFamily: 'Cairo',
  baseFontSize: '16px',
  borderRadius: '12px',
  showStats: true,
  showFeatures: true,
  showCta: true,
  bannerNotice: '',
  customCss: '',
};

async function initDatabase() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    const fileBuf = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      password_md5 TEXT,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'student',
      points INTEGER DEFAULT 0,
      phone TEXT,
      secret_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS study_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      duration TEXT NOT NULL,
      level TEXT NOT NULL,
      description TEXT NOT NULL,
      tasks_json TEXT NOT NULL,
      enrolled_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      file_name TEXT,
      author TEXT NOT NULL,
      downloads INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      author TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      announcement_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      internal_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const userCount = queryAll('SELECT COUNT(*) as c FROM users')[0]?.c as number;
  if (!userCount) {
    const md5 = (s: string) => crypto.createHash('md5').update(s).digest('hex');
    runStmt(
      `INSERT INTO users (username, password, password_md5, name, email, role, points, phone, secret_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'admin',
        'admin123',
        md5('admin123'),
        'مدير النظام - ثانوية العارضة',
        'admin@alardah.edu.sa',
        'admin',
        2850,
        '0501234567',
        'FLAG{SQLI_ADMIN_SECRET_2026} | رمز الإدارة السري: ADM-9981',
      ],
    );
    runStmt(
      `INSERT INTO users (username, password, password_md5, name, email, role, points, phone, secret_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'sara',
        'sara2025',
        md5('sara2025'),
        'سارة القحطاني',
        'sara@alardah.edu.sa',
        'student',
        1640,
        '0559876543',
        'ملف الطالبة المتميزة - شعبة 3/أ',
      ],
    );
    runStmt(
      `INSERT INTO users (username, password, password_md5, name, email, role, points, phone, secret_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'khalid',
        '123456',
        md5('123456'),
        'خالد العتيبي',
        'khalid@alardah.edu.sa',
        'student',
        1320,
        '0541112233',
        'مرشح لأولمبياد الرياضيات الوطني',
      ],
    );
    runStmt(
      `INSERT INTO users (username, password, password_md5, name, email, role, points, phone, secret_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'noura',
        'password',
        md5('password'),
        'أ. نورة الدوسري',
        'noura@alardah.edu.sa',
        'teacher',
        2150,
        '0564445566',
        'منسقة القدرات والتحصيلي بالمدرسة',
      ],
    );

    const plans = [
      [
        'خطة القدرات الكمي المكثفة (30 يوماً)',
        'القدرات الكمي',
        '30 يوماً',
        'متوسط - متقدم',
        'خطة يومية منظمة تغطي الجبر، الهندسة، النسب المئوية، والاحتمالات مع تدريبات محاكية للاختبار المحوسب.',
        JSON.stringify([
          'الأسبوع 1: أساسيات الحساب والكسور والنسب المئوية',
          'الأسبوع 2: المعادلات الجبرية والمتباينات',
          'الأسبوع 3: قوانين الهندسة والمساحات والزوايا',
          'الأسبوع 4: الإحصاء والاحتمالات واختبارات تجريبية شاملة',
        ]),
        420,
      ],
      [
        'خطة التميز في القدرات اللفظي',
        'القدرات اللفظي',
        '21 يوماً',
        'جميع المستويات',
        'تركز على التناظر اللفظي، إكمال الجمل، الخطأ السياقي، واستيعاب المقروء بأسلوب عملي سريع.',
        JSON.stringify([
          'الأسبوع 1: استراتيجيات التناظر اللفظي والعلاقات الدلالية',
          'الأسبوع 2: الخطأ السياقي وإكمال الجمل بدقة',
          'الأسبوع 3: مهارات القراءة السريعة واستيعاب المقروء',
        ]),
        385,
      ],
      [
        'الخطة الشاملة للاختبار التحصيلي العلمي',
        'التحصيلي',
        '45 يوماً',
        'ثالث ثانوي',
        'تغطية متكاملة لمقررات الرياضيات والفيزياء والكيمياء والأحياء للصفوف الثانوية الثلاثة.',
        JSON.stringify([
          'الأسبوع 1-2: الرياضيات (الدوال، التفاضل، المتجهات)',
          'الأسبوع 3: الفيزياء (الميكانيكا، الكهرباء، الفيزياء الحديثة)',
          'الأسبوع 4: الكيمياء (الروابط، الاتزان، الكيمياء العضوية)',
          'الأسبوع 5-6: الأحياء ومراجعات تجميعات الأعوام السابقة',
        ]),
        510,
      ],
      [
        'خطة المراجعة النهائية ليلة الاختبار',
        'مراجعة سريعة',
        '7 أيام',
        'مكثف',
        'مراجعة مركزة لأهم القوانين والتجميعات الحديثة مع 5 نماذج محاكاة موقتة.',
        JSON.stringify([
          'اليوم 1-2: أهم 100 قانون في الكمي والفيزياء',
          'اليوم 3-4: حل تجميعات الفترة الأولى والثانية',
          'اليوم 5-7: اختبارات تجريبية وتحليل الأخطاء',
        ]),
        290,
      ],
    ];
    for (const p of plans) {
      runStmt(
        `INSERT INTO study_plans (title, category, duration, level, description, tasks_json, enrolled_count) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        p,
      );
    }

    const resources = [
      [
        'ملخص قوانين القدرات الكمي الشامل',
        'القدرات الكمي',
        'ملف نصي / PDF',
        'جميع قوانين المساحات والحجوم والنسب والسرعة مرتبة مع أمثلة محلولة.',
        'qudrat_quant_summary.txt',
        'أ. نورة الدوسري',
        845,
      ],
      [
        'مذكرة الفيزياء للتحصيلي - الميكانيكا والكهرباء',
        'التحصيلي',
        'ملخص مراجعة',
        'شرح مبسط لقوانين نيوتن وأوم والطاقة مع أسئلة تجميعات محلولة.',
        'tahsili_physics_notes.txt',
        'قسم العلوم',
        670,
      ],
      [
        'دليل استراتيجيات التناظر اللفظي واستيعاب المقروء',
        'القدرات اللفظي',
        'دليل دراسي',
        'أشهر العلاقات اللفظية في اختبارات قياس مع تدريبات تفاعلية.',
        'verbal_guide.txt',
        'أ. فهد المالكي',
        530,
      ],
      [
        'بنك أسئلة الكيمياء العضوية والتحليلية',
        'التحصيلي',
        'بنك أسئلة',
        '250 سؤالاً مصنفاً حسب الدروس مع مفتاح الإجابات النموذجية.',
        'tahsili_physics_notes.txt',
        'أ. سلمى الشهري',
        412,
      ],
      [
        'حقيبة التأسيس السريع في الهندسة المستوية',
        'القدرات الكمي',
        'حقيبة تدريبية',
        'تمارين متدرجة في المثلثات والدوائر والمضلعات.',
        'qudrat_quant_summary.txt',
        'قسم الرياضيات',
        398,
      ],
    ];
    for (const r of resources) {
      runStmt(
        `INSERT INTO resources (title, category, type, description, file_name, author, downloads) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        r,
      );
    }

    const announcements = [
      [
        'انطلاق التسجيل في الورشة التدريبية لاختبار القدرات المحوسب',
        'يسر إدارة ثانوية العارضة الإعلان عن بدء التسجيل في البرنامج التدريبي المسائي لطلاب الصفين الثاني والثالث ثانوي ابتداءً من الأسبوع القادم في معمل الحاسب الرئيسي.',
        'urgent',
        'إدارة المدرسة',
      ],
      [
        'تحديث بنك الأسئلة وتجميعات التحصيلي 1447',
        'تمت إضافة أكثر من 300 سؤال جديد محلول في قسم المصادر التعليمية لمادتي الفيزياء والرياضيات.',
        'normal',
        'وحدة التطوير التعليمي',
      ],
      [
        'جدول الاختبارات التجريبية الشهرية',
        'سيُعقد الاختبار التجريبي الأول يوم الخميس القادم الساعة 9 صباحاً عبر المنصة، يرجى مراجعة خطط المذاكرة المخصصة.',
        'important',
        'المرشد الأكاديمي',
      ],
    ];
    for (const a of announcements) {
      runStmt(
        `INSERT INTO announcements (title, content, priority, author) VALUES (?, ?, ?, ?)`,
        a,
      );
    }

    runStmt(
      `INSERT INTO comments (announcement_id, author_name, body) VALUES (?, ?, ?)`,
      [1, 'سارة القحطاني', 'شكراً لإدارة المدرسة على هذه المبادرة الرائعة، تم التسجيل بنجاح!'],
    );
    runStmt(
      `INSERT INTO comments (announcement_id, author_name, body) VALUES (?, ?, ?)`,
      [1, 'خالد العتيبي', 'هل تتوفر ملفات الحقيبة التدريبية في قسم المصادر؟'],
    );

    // Notifications (including confidential admin notification for IDOR demo!)
    const notifications = [
      [
        1,
        'تنبيه إداري سري: مراجعة صلاحيات قاعدة البيانات',
        'ملاحظة للإدارة فقط: رمز النسخ الاحتياطي السري هو FLAG{IDOR_ADMIN_NOTIFICATION_LEAK}. يرجى عدم مشاركته مع الطلاب.',
        'security',
        0,
      ],
      [
        1,
        'تقرير تسجيل الطلاب الأسبوعي',
        'تم تسجيل 34 طالباً جديداً في خطة التحصيلي الشاملة خلال هذا الأسبوع.',
        'info',
        0,
      ],
      [
        2,
        'إنجاز جديد: وسام المثابرة في الكمي',
        'مبارك يا سارة! أكملتِ 80% من خطة القدرات الكمي وحصلتِ على 150 نقطة إضافية.',
        'success',
        0,
      ],
      [
        2,
        'موعد الاختبار التجريبي',
        'تذكير: الاختبار التجريبي الشهري يبدأ غداً الساعة 9:00 صباحاً.',
        'warning',
        1,
      ],
      [
        3,
        'تحديث خطة المذاكرة',
        'تمت إضافة مهام الأسبوع الثالث في خطة التميز في القدرات اللفظي.',
        'info',
        0,
      ],
    ];
    for (const n of notifications) {
      runStmt(
        `INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?)`,
        n,
      );
    }

    runStmt(
      `INSERT INTO tickets (name, email, subject, message, status, internal_note) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'سارة القحطاني',
        'sara@alardah.edu.sa',
        'استفسار عن ملفات التحصيلي',
        'أرجو إضافة ملخص الكيمياء العضوية بصيغة PDF.',
        'resolved',
        'تم الرد وإضافة الملف.',
      ],
    );
    runStmt(
      `INSERT INTO tickets (name, email, subject, message, status, internal_note) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'خالد العتيبي',
        'khalid@alardah.edu.sa',
        'مشكلة في دخول الحساب',
        'نسيت كلمة المرور المؤقتة الخاصة بي: KHALID_TEMP_991.',
        'open',
        'FLAG{IDOR_TICKET_PII_EXPOSED} - ملاحظة خاصة للمشرف',
      ],
    );

    runStmt(`INSERT INTO site_settings (key, value) VALUES (?, ?)`, [
      'config',
      JSON.stringify(DEFAULT_SITE_SETTINGS),
    ]);
  }
  saveDb();
}

function getAuthenticatedUser(req: express.Request): Record<string, unknown> | null {
  // Vulnerability 1: Trust client-controlled header X-User-Id / X-User-Role!
  const headerUserId = req.headers['x-user-id'];
  if (headerUserId) {
    const rows = queryAll('SELECT * FROM users WHERE id = ?', [Number(headerUserId)]);
    if (rows[0]) return rows[0];
  }

  // Vulnerability 2: Weak JWT (accepts alg: none & secret123)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const payload = verifyWeakJwt(token);
    if (payload) {
      return {
        id: payload.id,
        username: payload.username,
        role: payload.role,
        name: payload.name || payload.username,
      };
    }
  }

  // Vulnerability 3: Unsigned base64 JSON cookie!
  const rawCookie = req.cookies?.session_user;
  if (rawCookie) {
    try {
      const parsed = JSON.parse(Buffer.from(rawCookie, 'base64').toString('utf-8'));
      return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

async function startServer() {
  await initDatabase();

  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Vulnerability: Overly permissive CORS reflecting any Origin with credentials!
  app.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-Id, X-User-Role',
    );
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Serve uploaded files directly without sanitization (allows SVG/HTML Stored XSS!)
  app.use('/uploads', (req, res) => {
    const fileName = path.basename(req.path);
    const fullPath = path.join(UPLOADS_DIR, fileName);
    if (!fs.existsSync(fullPath)) {
      res.status(404).send('File not found');
      return;
    }
    const ext = path.extname(fileName).toLowerCase();
    if (ext === '.svg') res.type('image/svg+xml');
    else if (ext === '.html' || ext === '.htm') res.type('text/html');
    else if (ext === '.js') res.type('application/javascript');
    else res.type('text/plain');
    res.send(fs.readFileSync(fullPath));
  });

  // Mark active Express backend for browser clients (prevents static-fallback mode)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.cookie('alardah_server', '1', { path: '/', httpOnly: false });
    }
    next();
  });

  // 1. Site Settings (Admin Customization CMS + Persistent Theme)
  app.get('/api/settings', (_req, res) => {
    const rows = queryAll(`SELECT value FROM site_settings WHERE key = 'config'`);
    if (rows[0]?.value) {
      try {
        const parsed = JSON.parse(String(rows[0].value));
        res.json({ ...DEFAULT_SITE_SETTINGS, ...parsed });
        return;
      } catch {
        // fallback
      }
    }
    res.json(DEFAULT_SITE_SETTINGS);
  });

  // Vulnerability: Missing strict admin check + Unsafe merge (Prototype Pollution) + No CSRF protection
  app.put('/api/settings', (req, res) => {
    const rows = queryAll(`SELECT value FROM site_settings WHERE key = 'config'`);
    let current: Record<string, unknown> = { ...DEFAULT_SITE_SETTINGS };
    if (rows[0]?.value) {
      try {
        current = JSON.parse(String(rows[0].value));
      } catch {
        current = { ...DEFAULT_SITE_SETTINGS };
      }
    }
    const updated = unsafeMerge(current, req.body || {});
    runStmt(`INSERT OR REPLACE INTO site_settings (key, value) VALUES ('config', ?)`, [
      JSON.stringify(updated),
    ]);
    res.json({ success: true, settings: updated });
  });

  app.post('/api/settings/reset', (_req, res) => {
    runStmt(`INSERT OR REPLACE INTO site_settings (key, value) VALUES ('config', ?)`, [
      JSON.stringify(DEFAULT_SITE_SETTINGS),
    ]);
    res.json({ success: true, settings: DEFAULT_SITE_SETTINGS });
  });

  // 2. Authentication (SQLi, Weak JWT, httpOnly: false cookie, Mass Assignment, Broken Reset)
  app.post('/api/auth/login', (req, res) => {
    const { username = '', password = '' } = req.body || {};
    // VULNERABLE: Raw string interpolation SQL Injection!
    const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    logSql('POST /api/auth/login', sql);
    try {
      const users = queryAll(sql);
      if (users.length === 0) {
        res.status(401).json({
          error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
          debugQuery: sql, // Information disclosure!
        });
        return;
      }
      const user = users[0];
      const token = signWeakJwt({
        id: Number(user.id),
        username: String(user.username),
        role: String(user.role),
        name: String(user.name),
      });
      const cookieVal = Buffer.from(
        JSON.stringify({
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
        }),
      ).toString('base64');

      // VULNERABLE: httpOnly: false allows document.cookie theft via XSS!
      res.cookie('session_user', cookieVal, { httpOnly: false, path: '/' });
      res.cookie('auth_token', token, { httpOnly: false, path: '/' });
      res.json({ user, token, debugQuery: sql });
    } catch (err) {
      // Verbose SQL error leakage!
      res.status(500).json({
        error: 'خطأ في استعلام قاعدة البيانات',
        sqlError: (err as Error).message,
        debugQuery: sql,
      });
    }
  });

  app.post('/api/auth/register', (req, res) => {
    const body = req.body || {};
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const name = String(body.name || username);
    const email = String(body.email || '');
    // VULNERABLE: Mass Assignment — accepts role directly from req.body!
    const role = String(body.role || 'student');
    const points = Number(body.points || 0);

    if (!username || !password) {
      res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
      return;
    }

    try {
      const md5 = crypto.createHash('md5').update(password).digest('hex');
      runStmt(
        `INSERT INTO users (username, password, password_md5, name, email, role, points, secret_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, password, md5, name, email, role, points, 'ملاحظة حساب جديد'],
      );
      const created = queryAll('SELECT * FROM users WHERE username = ?', [username])[0];
      const token = signWeakJwt({
        id: Number(created.id),
        username: String(created.username),
        role: String(created.role),
        name: String(created.name),
      });
      res.json({ user: created, token });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // VULNERABLE: Password reset without OTP or verification!
  app.post('/api/auth/reset-password', (req, res) => {
    const { username, newPassword } = req.body || {};
    if (!username || !newPassword) {
      res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم وكلمة المرور الجديدة' });
      return;
    }
    const md5 = crypto.createHash('md5').update(String(newPassword)).digest('hex');
    runStmt(`UPDATE users SET password = ?, password_md5 = ? WHERE username = ?`, [
      String(newPassword),
      md5,
      String(username),
    ]);
    res.json({
      success: true,
      message: `تم تحديث كلمة مرور الحساب (${username}) بنجاح دون الحاجة لرمز تحقق`,
    });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('session_user');
    res.clearCookie('auth_token');
    res.json({ success: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      res.status(401).json({ error: 'غير مسجل الدخول' });
      return;
    }
    const dbUser = queryAll('SELECT * FROM users WHERE id = ?', [Number(authUser.id)])[0];
    res.json({ user: dbUser ? { ...dbUser, role: authUser.role } : authUser });
  });

  // 3. Users (Sensitive Data Exposure + IDOR + Mass Assignment)
  app.get('/api/users', (_req, res) => {
    // VULNERABLE: No auth check + exposes passwords, md5, phone, secret_note!
    const users = queryAll('SELECT * FROM users ORDER BY points DESC');
    res.json(users);
  });

  app.get('/api/users/:id', (req, res) => {
    const users = queryAll('SELECT * FROM users WHERE id = ?', [Number(req.params.id)]);
    if (!users[0]) {
      res.status(404).json({ error: 'المستخدم غير موجود' });
      return;
    }
    res.json(users[0]);
  });

  app.put('/api/users/:id', (req, res) => {
    const id = Number(req.params.id);
    const existing = queryAll('SELECT * FROM users WHERE id = ?', [id])[0];
    if (!existing) {
      res.status(404).json({ error: 'المستخدم غير موجود' });
      return;
    }
    // VULNERABLE: IDOR + Mass Assignment (anyone can change any user's role/points/password!)
    const updated = { ...existing, ...(req.body || {}) };
    runStmt(
      `UPDATE users SET name = ?, email = ?, role = ?, points = ?, phone = ?, secret_note = ? WHERE id = ?`,
      [
        updated.name,
        updated.email,
        updated.role,
        Number(updated.points || 0),
        updated.phone || '',
        updated.secret_note || '',
        id,
      ],
    );
    res.json({ success: true, user: queryAll('SELECT * FROM users WHERE id = ?', [id])[0] });
  });

  // 4. Study Plans (SQLi + Missing Auth + Business Logic Bypass)
  app.get('/api/study-plans', (req, res) => {
    const category = String(req.query.category || '');
    const sql = category
      ? `SELECT * FROM study_plans WHERE category = '${category}' ORDER BY id DESC`
      : `SELECT * FROM study_plans ORDER BY id DESC`;
    logSql('GET /api/study-plans', sql);
    try {
      const plans = queryAll(sql);
      res.json({ plans, debugQuery: sql });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message, debugQuery: sql });
    }
  });

  app.post('/api/study-plans', (req, res) => {
    const { title, category, duration, level, description, tasks } = req.body || {};
    if (!title || !category) {
      res.status(400).json({ error: 'العنوان والتصنيف مطلوبان' });
      return;
    }
    const tasksJson = JSON.stringify(Array.isArray(tasks) ? tasks : ['مراجعة الدرس الأول', 'حل تدريبات تطبيقية']);
    runStmt(
      `INSERT INTO study_plans (title, category, duration, level, description, tasks_json, enrolled_count) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [title, category, duration || '14 يوماً', level || 'متوسط', description || '', tasksJson],
    );
    const plans = queryAll('SELECT * FROM study_plans ORDER BY id DESC LIMIT 1');
    res.json({ success: true, plan: plans[0] });
  });

  app.delete('/api/study-plans/:id', (req, res) => {
    runStmt('DELETE FROM study_plans WHERE id = ?', [Number(req.params.id)]);
    res.json({ success: true });
  });

  // Business logic vulnerability: Client dictates earned points!
  app.post('/api/study-plans/:id/complete', (req, res) => {
    const user = getAuthenticatedUser(req);
    const points = Number(req.body?.points ?? 100);
    runStmt('UPDATE study_plans SET enrolled_count = enrolled_count + 1 WHERE id = ?', [
      Number(req.params.id),
    ]);
    if (user?.id) {
      runStmt('UPDATE users SET points = points + ? WHERE id = ?', [points, Number(user.id)]);
    }
    res.json({ success: true, awardedPoints: points });
  });

  // 5. Learning Resources (UNION SQLi, Path Traversal, Unrestricted Upload, SSRF)
  app.get('/api/resources', (req, res) => {
    const q = String(req.query.q || '');
    const category = String(req.query.category || '');
    // VULNERABLE: Raw SQL string concatenation for UNION-based SQLi!
    let sql = `SELECT id, title, category, type, description, file_name, author, downloads FROM resources WHERE 1=1`;
    if (q) {
      sql += ` AND (title LIKE '%${q}%' OR description LIKE '%${q}%')`;
    }
    if (category && category !== 'الكل') {
      sql += ` AND category = '${category}'`;
    }
    sql += ` ORDER BY id DESC`;
    logSql('GET /api/resources', sql);
    try {
      const items = queryAll(sql);
      res.json({ items, queryEcho: q, debugQuery: sql });
    } catch (err) {
      res.status(500).json({
        error: 'فشل تنفيذ استعلام البحث',
        sqlError: (err as Error).message,
        debugQuery: sql,
      });
    }
  });

  app.post('/api/resources', (req, res) => {
    const { title, category, type, description, file_name, author } = req.body || {};
    if (!title) {
      res.status(400).json({ error: 'عنوان المصدر مطلوب' });
      return;
    }
    runStmt(
      `INSERT INTO resources (title, category, type, description, file_name, author, downloads) VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [
        title,
        category || 'القدرات الكمي',
        type || 'ملخص',
        description || '',
        file_name || 'qudrat_quant_summary.txt',
        author || 'إدارة المنصة',
      ],
    );
    res.json({ success: true });
  });

  app.delete('/api/resources/:id', (req, res) => {
    runStmt('DELETE FROM resources WHERE id = ?', [Number(req.params.id)]);
    res.json({ success: true });
  });

  // Sandboxed Path Traversal vulnerability
  app.get('/api/resources/download', (req, res) => {
    const file = String(req.query.file || 'qudrat_quant_summary.txt');
    const resolved = resolveVirtualFile(file);
    if (!resolved.found) {
      res.status(404).json({
        error: 'الملف غير موجود',
        resolvedPath: resolved.resolvedPath,
      });
      return;
    }
    res.json({
      file,
      resolvedPath: resolved.resolvedPath,
      content: resolved.content,
    });
  });

  // Unrestricted file upload (Stored XSS via SVG / HTML)
  app.post('/api/resources/upload', (req, res) => {
    const { filename = 'note.txt', content = '' } = req.body || {};
    const safeBase = path.basename(String(filename));
    fs.writeFileSync(path.join(UPLOADS_DIR, safeBase), String(content), 'utf-8');
    res.json({
      success: true,
      url: `/uploads/${safeBase}`,
      message: 'تم رفع الملف بدون فحص الامتداد أو المحتوى',
    });
  });

  // Sandboxed SSRF vulnerability
  app.post('/api/resources/import-url', (req, res) => {
    const targetUrl = String(req.body?.url || '');
    const result = resolveSandboxedSsrf(targetUrl);
    res.status(result.status).json(result);
  });

  // 6. Announcements & Comments (Stored XSS + Missing Auth + CSRF)
  app.get('/api/announcements', (_req, res) => {
    const announcements = queryAll('SELECT * FROM announcements ORDER BY id DESC');
    const comments = queryAll('SELECT * FROM comments ORDER BY id ASC');
    const enriched = announcements.map((a) => ({
      ...a,
      comments: comments.filter((c) => c.announcement_id === a.id),
    }));
    res.json(enriched);
  });

  app.post('/api/announcements', (req, res) => {
    const { title, content, priority, author } = req.body || {};
    if (!title || !content) {
      res.status(400).json({ error: 'العنوان والمحتوى مطلوبان' });
      return;
    }
    runStmt(
      `INSERT INTO announcements (title, content, priority, author) VALUES (?, ?, ?, ?)`,
      [title, content, priority || 'normal', author || 'إدارة المدرسة'],
    );
    res.json({ success: true });
  });

  app.delete('/api/announcements/:id', (req, res) => {
    runStmt('DELETE FROM announcements WHERE id = ?', [Number(req.params.id)]);
    runStmt('DELETE FROM comments WHERE announcement_id = ?', [Number(req.params.id)]);
    res.json({ success: true });
  });

  app.post('/api/announcements/:id/comments', (req, res) => {
    const { author_name, body } = req.body || {};
    if (!body) {
      res.status(400).json({ error: 'نص التعليق مطلوب' });
      return;
    }
    // VULNERABLE: Stored XSS — saves raw HTML/JS without sanitization!
    runStmt(
      `INSERT INTO comments (announcement_id, author_name, body) VALUES (?, ?, ?)`,
      [Number(req.params.id), author_name || 'زائر', body],
    );
    res.json({ success: true });
  });

  // 7. Notifications (IDOR + CSRF via GET!)
  app.get('/api/notifications', (req, res) => {
    const authUser = getAuthenticatedUser(req);
    // VULNERABLE: IDOR — trusts ?userId query param even for other users!
    const targetUserId = req.query.userId
      ? Number(req.query.userId)
      : authUser?.id
        ? Number(authUser.id)
        : 2;
    const rows = queryAll(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC',
      [targetUserId],
    );
    res.json({ userId: targetUserId, notifications: rows });
  });

  app.post('/api/notifications', (req, res) => {
    const { user_id, title, message, type } = req.body || {};
    if (!title || !message) {
      res.status(400).json({ error: 'العنوان والرسالة مطلوبان' });
      return;
    }
    if (String(user_id) === 'all') {
      const users = queryAll('SELECT id FROM users');
      for (const u of users) {
        runStmt(
          `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
          [Number(u.id), title, message, type || 'info'],
        );
      }
    } else {
      runStmt(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [Number(user_id || 2), title, message, type || 'info'],
      );
    }
    res.json({ success: true });
  });

  app.post('/api/notifications/:id/read', (req, res) => {
    runStmt('UPDATE notifications SET is_read = 1 WHERE id = ?', [Number(req.params.id)]);
    res.json({ success: true });
  });

  // VULNERABLE: State-changing action via GET (CSRF)
  app.get('/api/notifications/delete', (req, res) => {
    const id = Number(req.query.id);
    if (id) {
      runStmt('DELETE FROM notifications WHERE id = ?', [id]);
    }
    res.json({ success: true, deletedId: id });
  });

  // 8. Achievements & SSTI Certificate Generator
  app.get('/api/achievements', (_req, res) => {
    const leaders = queryAll(
      'SELECT id, username, name, role, points FROM users ORDER BY points DESC',
    );
    res.json({ leaders });
  });

  app.post('/api/achievements/claim', (req, res) => {
    const user = getAuthenticatedUser(req);
    const points = Number(req.body?.points ?? 500);
    const targetId = Number(req.body?.userId || user?.id || 2);
    // VULNERABLE: Arbitrary points manipulation!
    runStmt('UPDATE users SET points = points + ? WHERE id = ?', [points, targetId]);
    res.json({ success: true, userId: targetId, addedPoints: points });
  });

  app.post('/api/achievements/certificate', (req, res) => {
    const studentName = String(req.body?.studentName || 'سارة القحطاني');
    const achievementTitle = String(req.body?.achievementTitle || 'التميز في اختبار القدرات');
    // VULNERABLE: Sandboxed SSTI renders {{...}} expressions inside studentName!
    const template = `تشهد إدارة منصة ثانوية العارضة بأن الطالب/ة (${studentName}) قد أتم متطلبات (${achievementTitle}) بنجاح وتفوق.`;
    const rendered = renderVulnerableTemplate(template, {
      studentName,
      achievementTitle,
    });
    res.json({ rendered });
  });

  // 9. Contact & Support Tickets (IDOR)
  app.get('/api/contact/tickets', (_req, res) => {
    const tickets = queryAll('SELECT * FROM tickets ORDER BY id DESC');
    res.json(tickets);
  });

  app.get('/api/contact/tickets/:id', (req, res) => {
    const ticket = queryAll('SELECT * FROM tickets WHERE id = ?', [Number(req.params.id)])[0];
    if (!ticket) {
      res.status(404).json({ error: 'التذكرة غير موجودة' });
      return;
    }
    res.json(ticket);
  });

  app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body || {};
    if (!name || !subject || !message) {
      res.status(400).json({ error: 'الرجاء تعبئة جميع الحقول المطلوبة' });
      return;
    }
    runStmt(
      `INSERT INTO tickets (name, email, subject, message, status, internal_note) VALUES (?, ?, ?, ?, 'open', 'بانتظار مراجعة المشرف')`,
      [name, email || '', subject, message],
    );
    const latest = queryAll('SELECT * FROM tickets ORDER BY id DESC LIMIT 1')[0];
    res.json({ success: true, ticket: latest });
  });

  // 10. Admin Lab Tools (Sandboxed Command Injection, Open Redirect, Debug Disclosure, Reflected HTML)
  app.post('/api/admin/tools/ping', (req, res) => {
    const host = String(req.body?.host || '127.0.0.1');
    const result = executeSandboxedPing(host);
    res.json(result);
  });

  app.get('/api/redirect', (req, res) => {
    const nextUrl = String(req.query.next || '/');
    // VULNERABLE: Open Redirect without host validation!
    res.redirect(nextUrl);
  });

  app.get('/api/preview-html', (req, res) => {
    const name = String(req.query.name || 'طالب ثانوية العارضة');
    // VULNERABLE: Direct Reflected XSS endpoint
    res.type('text/html').send(
      `<html dir="rtl" lang="ar"><body style="font-family:sans-serif;padding:24px;"><h2>معاينة الاسم: ${name}</h2></body></html>`,
    );
  });

  app.get('/api/debug/logs', (_req, res) => {
    // VULNERABLE: Unauthenticated debug/secrets exposure
    res.json({
      environment: 'alardah-lab',
      jwtSecret: 'secret123',
      adminDefault: 'admin / admin123',
      recentSqlQueries: sqlLogs,
    });
  });

  // Vite middleware for dev, static dist for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Al-Ardah Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
