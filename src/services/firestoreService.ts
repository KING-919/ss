import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import { signInWithPopup, signOut } from 'firebase/auth';
import {
  db,
  auth,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  signWeakJwt,
  verifyWeakJwt,
  unsafeMerge,
  renderVulnerableTemplate,
} from '../utils/labSandbox';
import { INITIAL_SETTINGS, type SiteSettings, type User, type NotificationItem } from '../context/AppContext';

export interface StudyPlanRecord {
  id: number;
  title: string;
  category: string;
  duration: string;
  level: string;
  description: string;
  tasks: string[];
  enrolled_count: number;
  created_at: string;
}

export interface ResourceRecord {
  id: number;
  title: string;
  category: string;
  type: string;
  description: string;
  file_name: string;
  author: string;
  downloads: number;
  created_at: string;
}

export interface CommentRecord {
  id: number;
  announcement_id: number;
  author_name: string;
  body: string;
  created_at: string;
}

export interface AnnouncementRecord {
  id: number;
  title: string;
  content: string;
  priority: string;
  author: string;
  created_at: string;
  comments?: CommentRecord[];
}

export interface TicketRecord {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  internal_note?: string;
  created_at: string;
}

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'config'));
      if (settingsSnap.exists()) return;

      const now = '2026-11-24 10:00:00';

      await setDoc(doc(db, 'settings', 'config'), INITIAL_SETTINGS);

      const seedUsers = [
        {
          id: 1,
          username: 'admin',
          password: 'admin123',
          password_md5: '0192023a7bbd73250516f069df18b500',
          name: 'مدير النظام - ثانوية العارضة',
          email: 'admin@alardah.edu.sa',
          role: 'admin',
          points: 2850,
          phone: '0501234567',
          secret_note: 'FLAG{SQLI_ADMIN_SECRET_2026} | رمز الإدارة السري: ADM-9981',
          created_at: now,
        },
        {
          id: 2,
          username: 'sara',
          password: 'sara2025',
          password_md5: 'e10adc3949ba59abbe56e057f20f883e',
          name: 'سارة القحطاني',
          email: 'sara@alardah.edu.sa',
          role: 'student',
          points: 1640,
          phone: '0559876543',
          secret_note: 'ملف الطالبة المتميزة - شعبة 3/أ',
          created_at: now,
        },
        {
          id: 3,
          username: 'khalid',
          password: '123456',
          password_md5: 'e10adc3949ba59abbe56e057f20f883e',
          name: 'خالد العتيبي',
          email: 'khalid@alardah.edu.sa',
          role: 'student',
          points: 1320,
          phone: '0541112233',
          secret_note: 'مرشح لأولمبياد الرياضيات الوطني',
          created_at: now,
        },
        {
          id: 4,
          username: 'noura',
          password: 'password',
          password_md5: '5f4dcc3b5aa765d61d8327deb882cf99',
          name: 'أ. نورة الدوسري',
          email: 'noura@alardah.edu.sa',
          role: 'teacher',
          points: 2150,
          phone: '0564445566',
          secret_note: 'منسقة القدرات والتحصيلي بالمدرسة',
          created_at: now,
        },
      ];
      await Promise.all(
        seedUsers.map((u) => setDoc(doc(db, 'users', String(u.id)), u)),
      );

      const seedPlans: StudyPlanRecord[] = [
        {
          id: 1,
          title: 'خطة القدرات الكمي المكثفة (30 يوماً)',
          category: 'القدرات الكمي',
          duration: '30 يوماً',
          level: 'متوسط - متقدم',
          description:
            'خطة يومية منظمة تغطي الجبر، الهندسة، النسب المئوية، والاحتمالات مع تدريبات محاكية للاختبار المحوسب.',
          tasks: [
            'الأسبوع 1: أساسيات الحساب والكسور والنسب المئوية',
            'الأسبوع 2: المعادلات الجبرية والمتباينات',
            'الأسبوع 3: قوانين الهندسة والمساحات والزوايا',
            'الأسبوع 4: الإحصاء والاحتمالات واختبارات تجريبية شاملة',
          ],
          enrolled_count: 420,
          created_at: now,
        },
        {
          id: 2,
          title: 'خطة التميز في القدرات اللفظي',
          category: 'القدرات اللفظي',
          duration: '21 يوماً',
          level: 'جميع المستويات',
          description:
            'تركز على التناظر اللفظي، إكمال الجمل، الخطأ السياقي، واستيعاب المقروء بأسلوب عملي سريع.',
          tasks: [
            'الأسبوع 1: استراتيجيات التناظر اللفظي والعلاقات الدلالية',
            'الأسبوع 2: الخطأ السياقي وإكمال الجمل بدقة',
            'الأسبوع 3: مهارات القراءة السريعة واستيعاب المقروء',
          ],
          enrolled_count: 385,
          created_at: now,
        },
        {
          id: 3,
          title: 'الخطة الشاملة للاختبار التحصيلي العلمي',
          category: 'التحصيلي',
          duration: '45 يوماً',
          level: 'ثالث ثانوي',
          description:
            'تغطية متكاملة لمقررات الرياضيات والفيزياء والكيمياء والأحياء للصفوف الثانوية الثلاثة.',
          tasks: [
            'الأسبوع 1-2: الرياضيات (الدوال، التفاضل، المتجهات)',
            'الأسبوع 3: الفيزياء (الميكانيكا، الكهرباء، الفيزياء الحديثة)',
            'الأسبوع 4: الكيمياء (الروابط، الاتزان، الكيمياء العضوية)',
            'الأسبوع 5-6: الأحياء ومراجعات تجميعات الأعوام السابقة',
          ],
          enrolled_count: 510,
          created_at: now,
        },
        {
          id: 4,
          title: 'خطة المراجعة النهائية ليلة الاختبار',
          category: 'مراجعة سريعة',
          duration: '7 أيام',
          level: 'مكثف',
          description:
            'مراجعة مركزة لأهم القوانين والتجميعات الحديثة مع 5 نماذج محاكاة موقتة.',
          tasks: [
            'اليوم 1-2: أهم 100 قانون في الكمي والفيزياء',
            'اليوم 3-4: حل تجميعات الفترة الأولى والثانية',
            'اليوم 5-7: اختبارات تجريبية وتحليل الأخطاء',
          ],
          enrolled_count: 290,
          created_at: now,
        },
      ];
      await Promise.all(
        seedPlans.map((p) => setDoc(doc(db, 'study_plans', String(p.id)), p)),
      );

      const seedResources: ResourceRecord[] = [
        {
          id: 1,
          title: 'ملخص قوانين القدرات الكمي الشامل',
          category: 'القدرات الكمي',
          type: 'ملف نصي / PDF',
          description: 'جميع قوانين المساحات والحجوم والنسب والسرعة مرتبة مع أمثلة محلولة.',
          file_name: 'qudrat_quant_summary.txt',
          author: 'أ. نورة الدوسري',
          downloads: 845,
          created_at: now,
        },
        {
          id: 2,
          title: 'مذكرة الفيزياء للتحصيلي - الميكانيكا والكهرباء',
          category: 'التحصيلي',
          type: 'ملخص مراجعة',
          description: 'شرح مبسط لقوانين نيوتن وأوم والطاقة مع أسئلة تجميعات محلولة.',
          file_name: 'tahsili_physics_notes.txt',
          author: 'قسم العلوم',
          downloads: 670,
          created_at: now,
        },
        {
          id: 3,
          title: 'دليل استراتيجيات التناظر اللفظي واستيعاب المقروء',
          category: 'القدرات اللفظي',
          type: 'دليل دراسي',
          description: 'أشهر العلاقات اللفظية في اختبارات قياس مع تدريبات تفاعلية.',
          file_name: 'verbal_guide.txt',
          author: 'أ. فهد المالكي',
          downloads: 530,
          created_at: now,
        },
        {
          id: 4,
          title: 'بنك أسئلة الكيمياء العضوية والتحليلية',
          category: 'التحصيلي',
          type: 'بنك أسئلة',
          description: '250 سؤالاً مصنفاً حسب الدروس مع مفتاح الإجابات النموذجية.',
          file_name: 'tahsili_physics_notes.txt',
          author: 'أ. سلمى الشهري',
          downloads: 412,
          created_at: now,
        },
        {
          id: 5,
          title: 'حقيبة التأسيس السريع في الهندسة المستوية',
          category: 'القدرات الكمي',
          type: 'حقيبة تدريبية',
          description: 'تمارين متدرجة في المثلثات والدوائر والمضلعات.',
          file_name: 'qudrat_quant_summary.txt',
          author: 'قسم الرياضيات',
          downloads: 398,
          created_at: now,
        },
      ];
      await Promise.all(
        seedResources.map((r) => setDoc(doc(db, 'resources', String(r.id)), r)),
      );

      const seedAnnouncements: AnnouncementRecord[] = [
        {
          id: 1,
          title: 'انطلاق التسجيل في الورشة التدريبية لاختبار القدرات المحوسب',
          content:
            'يسر إدارة ثانوية العارضة الإعلان عن بدء التسجيل في البرنامج التدريبي المسائي لطلاب الصفين الثاني والثالث ثانوي ابتداءً من الأسبوع القادم في معمل الحاسب الرئيسي.',
          priority: 'urgent',
          author: 'إدارة المدرسة',
          created_at: now,
        },
        {
          id: 2,
          title: 'تحديث بنك الأسئلة وتجميعات التحصيلي 1447',
          content:
            'تمت إضافة أكثر من 300 سؤال جديد محلول في قسم المصادر التعليمية لمادتي الفيزياء والرياضيات.',
          priority: 'normal',
          author: 'وحدة التطوير التعليمي',
          created_at: now,
        },
        {
          id: 3,
          title: 'جدول الاختبارات التجريبية الشهرية',
          content:
            'سيُعقد الاختبار التجريبي الأول يوم الخميس القادم الساعة 9 صباحاً عبر المنصة، يرجى مراجعة خطط المذاكرة المخصصة.',
          priority: 'important',
          author: 'المرشد الأكاديمي',
          created_at: now,
        },
      ];
      await Promise.all(
        seedAnnouncements.map((a) => setDoc(doc(db, 'announcements', String(a.id)), a)),
      );

      const seedComments: CommentRecord[] = [
        {
          id: 1,
          announcement_id: 1,
          author_name: 'سارة القحطاني',
          body: 'شكراً لإدارة المدرسة على هذه المبادرة الرائعة، تم التسجيل بنجاح!',
          created_at: now,
        },
        {
          id: 2,
          announcement_id: 1,
          author_name: 'خالد العتيبي',
          body: 'هل تتوفر ملفات الحقيبة التدريبية في قسم المصادر؟',
          created_at: now,
        },
      ];
      await Promise.all(
        seedComments.map((c) => setDoc(doc(db, 'comments', String(c.id)), c)),
      );

      const seedNotifications: NotificationItem[] = [
        {
          id: 1,
          user_id: 1,
          title: 'تنبيه إداري سري: مراجعة صلاحيات قاعدة البيانات',
          message:
            'ملاحظة للإدارة فقط: رمز النسخ الاحتياطي السري هو FLAG{IDOR_ADMIN_NOTIFICATION_LEAK}. يرجى عدم مشاركته مع الطلاب.',
          type: 'security',
          is_read: 0,
          created_at: now,
        },
        {
          id: 2,
          user_id: 1,
          title: 'تقرير تسجيل الطلاب الأسبوعي',
          message: 'تم تسجيل 34 طالباً جديداً في خطة التحصيلي الشاملة خلال هذا الأسبوع.',
          type: 'info',
          is_read: 0,
          created_at: now,
        },
        {
          id: 3,
          user_id: 2,
          title: 'إنجاز جديد: وسام المثابرة في الكمي',
          message: 'مبارك يا سارة! أكملتِ 80% من خطة القدرات الكمي وحصلتِ على 150 نقطة إضافية.',
          type: 'success',
          is_read: 0,
          created_at: now,
        },
        {
          id: 4,
          user_id: 2,
          title: 'موعد الاختبار التجريبي',
          message: 'تذكير: الاختبار التجريبي الشهري يبدأ غداً الساعة 9:00 صباحاً.',
          type: 'warning',
          is_read: 1,
          created_at: now,
        },
        {
          id: 5,
          user_id: 3,
          title: 'تحديث خطة المذاكرة',
          message: 'تمت إضافة مهام الأسبوع الثالث في خطة التميز في القدرات اللفظي.',
          type: 'info',
          is_read: 0,
          created_at: now,
        },
      ];
      await Promise.all(
        seedNotifications.map((n) => setDoc(doc(db, 'notifications', String(n.id)), n)),
      );

      const seedTickets: TicketRecord[] = [
        {
          id: 1,
          name: 'سارة القحطاني',
          email: 'sara@alardah.edu.sa',
          subject: 'استفسار عن ملفات التحصيلي',
          message: 'أرجو إضافة ملخص الكيمياء العضوية بصيغة PDF.',
          status: 'resolved',
          internal_note: 'تم الرد وإضافة الملف.',
          created_at: now,
        },
        {
          id: 2,
          name: 'خالد العتيبي',
          email: 'khalid@alardah.edu.sa',
          subject: 'مشكلة في دخول الحساب',
          message: 'نسيت كلمة المرور المؤقتة الخاصة بي: KHALID_TEMP_991.',
          status: 'open',
          internal_note: 'FLAG{IDOR_TICKET_PII_EXPOSED} - ملاحظة خاصة للمشرف',
          created_at: now,
        },
      ];
      await Promise.all(
        seedTickets.map((t) => setDoc(doc(db, 'tickets', String(t.id)), t)),
      );
    } catch (err) {
      seedPromise = null;
      handleFirestoreError(err, OperationType.WRITE, 'seed');
    }
  })();
  return seedPromise;
}

async function logSql(route: string, sqlQuery: string) {
  try {
    const id = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await setDoc(doc(db, 'sql_logs', id), {
      ts: new Date().toISOString(),
      route,
      query: sqlQuery.slice(0, 1900),
    });
  } catch {
    // non-fatal logging
  }
}

function setSessionCookies(user: User, token: string) {
  if (typeof document === 'undefined') return;
  const jsonStr = JSON.stringify({
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  });
  const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
  // Intentionally missing HttpOnly flag so document.cookie theft via XSS works in lab
  document.cookie = `session_user=${encodeURIComponent(b64)}; path=/`;
  document.cookie = `auth_token=${token}; path=/`;
}

export function clearSessionCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'session_user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
}

export function readSessionFromCookies(): { user: Partial<User> | null; token: string | null } {
  if (typeof document === 'undefined') return { user: null, token: null };
  const tokenMatch = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
  if (token) {
    const payload = verifyWeakJwt(token);
    if (payload) {
      return {
        user: {
          id: payload.id,
          username: payload.username,
          role: payload.role,
          name: payload.name || payload.username,
        },
        token,
      };
    }
  }
  const cookieMatch = document.cookie.match(/(?:^|;\s*)session_user=([^;]+)/);
  if (cookieMatch) {
    try {
      const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(cookieMatch[1]))));
      return { user: JSON.parse(jsonStr) as Partial<User>, token };
    } catch {
      return { user: null, token: null };
    }
  }
  return { user: null, token: null };
}

// 1. Settings
export async function fsGetSettings(): Promise<SiteSettings> {
  await ensureSeeded();
  try {
    const snap = await getDoc(doc(db, 'settings', 'config'));
    if (snap.exists()) {
      return { ...INITIAL_SETTINGS, ...(snap.data() as Partial<SiteSettings>) };
    }
    return INITIAL_SETTINGS;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'settings/config');
  }
}

export async function fsSaveSettings(nextSettings: Partial<SiteSettings>): Promise<SiteSettings> {
  try {
    const current = await fsGetSettings();
    const merged = unsafeMerge({ ...current }, nextSettings as Record<string, unknown>) as unknown as SiteSettings;
    await setDoc(doc(db, 'settings', 'config'), merged);
    return merged;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/config');
  }
}

export async function fsResetSettings(): Promise<SiteSettings> {
  try {
    await setDoc(doc(db, 'settings', 'config'), INITIAL_SETTINGS);
    return INITIAL_SETTINGS;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/config');
  }
}

// 2. Auth & Users
export async function fsGetUsers(): Promise<User[]> {
  await ensureSeeded();
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs
      .map((d) => d.data() as User)
      .sort((a, b) => (b.points || 0) - (a.points || 0));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
  }
}

export async function fsGetUserById(id: number): Promise<User | null> {
  await ensureSeeded();
  try {
    const snap = await getDoc(doc(db, 'users', String(id)));
    return snap.exists() ? (snap.data() as User) : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${id}`);
  }
}

export async function fsUpdateUser(id: number, patch: Partial<User>): Promise<User> {
  try {
    const existing = await fsGetUserById(id);
    if (!existing) throw new Error('المستخدم غير موجود');
    const updated = { ...existing, ...patch };
    await setDoc(doc(db, 'users', String(id)), updated);
    return updated;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
  }
}

export async function fsLogin(
  username: string,
  password: string,
): Promise<{ user?: User; token?: string; error?: string; sqlError?: string; debugQuery: string }> {
  await ensureSeeded();
  const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  await logSql('POST /auth/login', sql);

  const users = await fsGetUsers();
  let matched = users.find(
    (u) => u.username === username && (u as unknown as { password: string }).password === password,
  );

  // Intentional SQLi vulnerability simulation against Firestore users
  if (!matched) {
    if (
      /'\s*--/.test(username) ||
      /'\s*or\s*'1'='1/i.test(username) ||
      /'\s*or\s*1=1/i.test(username)
    ) {
      const prefix = username.split("'")[0].trim();
      matched = (prefix ? users.find((u) => u.username === prefix) : undefined) || users.find((u) => u.id === 1) || users[0];
    } else if (/'\s*or\s*'1'='1/i.test(password) || /'\s*or\s*1=1/i.test(password)) {
      matched = users.find((u) => u.username === username) || users[0];
    } else if ((username.match(/'/g) || []).length % 2 === 1) {
      return {
        error: 'خطأ في استعلام قاعدة البيانات',
        sqlError: 'near "\'": syntax error',
        debugQuery: sql,
      };
    }
  }

  if (!matched) {
    return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة', debugQuery: sql };
  }

  const token = signWeakJwt({
    id: matched.id,
    username: matched.username,
    role: matched.role,
    name: matched.name,
  });
  setSessionCookies(matched, token);
  return { user: matched, token, debugQuery: sql };
}

export async function fsLoginWithGoogle(): Promise<{ user: User; token: string }> {
  await ensureSeeded();
  const cred = await signInWithPopup(auth, googleAuthProvider);
  const email = cred.user.email || `${cred.user.uid}@google.user`;
  const users = await fsGetUsers();
  let matched = users.find((u) => u.email === email);
  if (!matched) {
    const nextId = Math.max(0, ...users.map((u) => u.id)) + 1;
    const newUser = {
      id: nextId,
      username: email.split('@')[0],
      password: 'google_oauth_user',
      password_md5: '',
      name: cred.user.displayName || email,
      email,
      role: 'student',
      points: 100,
      phone: '',
      secret_note: 'حساب مسجل عبر Google',
      created_at: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', String(nextId)), newUser);
    matched = newUser;
  }
  const token = signWeakJwt({
    id: matched.id,
    username: matched.username,
    role: matched.role,
    name: matched.name,
  });
  setSessionCookies(matched, token);
  return { user: matched, token };
}

export async function fsRegister(payload: {
  username: string;
  password: string;
  name: string;
  email: string;
  role?: string;
  points?: number;
}): Promise<{ user?: User; token?: string; error?: string }> {
  await ensureSeeded();
  const users = await fsGetUsers();
  if (users.some((u) => u.username === payload.username.trim())) {
    return { error: 'اسم المستخدم مستخدم مسبقاً' };
  }
  const nextId = Math.max(0, ...users.map((u) => u.id)) + 1;
  // Intentional Mass Assignment: accepts role and points directly!
  const created = {
    id: nextId,
    username: payload.username.trim(),
    password: payload.password,
    password_md5: 'firestore_md5',
    name: payload.name || payload.username,
    email: payload.email || '',
    role: payload.role || 'student',
    points: Number(payload.points || 0),
    phone: '',
    secret_note: 'ملاحظة حساب جديد',
    created_at: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'users', String(nextId)), created);
    const token = signWeakJwt({
      id: created.id,
      username: created.username,
      role: created.role,
      name: created.name,
    });
    setSessionCookies(created, token);
    return { user: created, token };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${nextId}`);
  }
}

export async function fsResetPassword(username: string, newPassword: string): Promise<string> {
  await ensureSeeded();
  const users = await fsGetUsers();
  const target = users.find((u) => u.username === username);
  if (target) {
    try {
      await updateDoc(doc(db, 'users', String(target.id)), { password: newPassword });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${target.id}`);
    }
  }
  return `تم تحديث كلمة مرور الحساب (${username}) بنجاح دون الحاجة لرمز تحقق`;
}

export async function fsLogout() {
  clearSessionCookies();
  try {
    if (auth.currentUser) await signOut(auth);
  } catch {
    // ignore
  }
}

// 3. Study Plans
export async function fsGetStudyPlans(category = ''): Promise<{
  plans: StudyPlanRecord[];
  error?: string;
  debugQuery: string;
}> {
  await ensureSeeded();
  const sql = category
    ? `SELECT * FROM study_plans WHERE category = '${category}' ORDER BY id DESC`
    : `SELECT * FROM study_plans ORDER BY id DESC`;
  await logSql('GET /study-plans', sql);

  if ((category.match(/'/g) || []).length % 2 === 1) {
    return { plans: [], error: 'near "\'": syntax error', debugQuery: sql };
  }

  try {
    const snap = await getDocs(collection(db, 'study_plans'));
    let plans = snap.docs.map((d) => d.data() as StudyPlanRecord);
    if (category) plans = plans.filter((p) => p.category === category);
    plans.sort((a, b) => b.id - a.id);
    return { plans, debugQuery: sql };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'study_plans');
  }
}

export async function fsCreateStudyPlan(input: {
  title: string;
  category: string;
  duration: string;
  level?: string;
  description: string;
}): Promise<StudyPlanRecord> {
  const { plans } = await fsGetStudyPlans();
  const nextId = Math.max(0, ...plans.map((p) => p.id)) + 1;
  const plan: StudyPlanRecord = {
    id: nextId,
    title: input.title,
    category: input.category || 'القدرات الكمي',
    duration: input.duration || '14 يوماً',
    level: input.level || 'متوسط',
    description: input.description || '',
    tasks: ['مراجعة الدرس الأول', 'حل تدريبات تطبيقية'],
    enrolled_count: 1,
    created_at: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'study_plans', String(nextId)), plan);
    return plan;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `study_plans/${nextId}`);
  }
}

export async function fsCompleteStudyPlan(planId: number, userId?: number, points = 100) {
  try {
    const planRef = doc(db, 'study_plans', String(planId));
    const snap = await getDoc(planRef);
    if (snap.exists()) {
      const current = snap.data() as StudyPlanRecord;
      await updateDoc(planRef, { enrolled_count: (current.enrolled_count || 0) + 1 });
    }
    if (userId) {
      const u = await fsGetUserById(userId);
      if (u) await fsUpdateUser(userId, { points: (u.points || 0) + points });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `study_plans/${planId}`);
  }
}

// 4. Resources & Uploads
export async function fsGetResources(
  q = '',
  category = 'الكل',
): Promise<{
  items: ResourceRecord[];
  sqlError?: string;
  debugQuery: string;
}> {
  await ensureSeeded();
  let sql = `SELECT id, title, category, type, description, file_name, author, downloads FROM resources WHERE 1=1`;
  if (q) sql += ` AND (title LIKE '%${q}%' OR description LIKE '%${q}%')`;
  if (category && category !== 'الكل') sql += ` AND category = '${category}'`;
  sql += ` ORDER BY id DESC`;
  await logSql('GET /resources', sql);

  // UNION SQLi simulation dumping real Firestore users!
  if (/union\s+select/i.test(q) && /from\s+users/i.test(q)) {
    const users = await fsGetUsers();
    const resourcesSnap = await getDocs(collection(db, 'resources'));
    const resources = resourcesSnap.docs.map((d) => d.data() as ResourceRecord);
    const injected: ResourceRecord[] = users.map((u) => ({
      id: u.id,
      title: u.username,
      category: String((u as unknown as { password?: string }).password || ''),
      type: u.role,
      description: u.secret_note || '',
      file_name: u.email,
      author: u.created_at || '',
      downloads: 0,
      created_at: u.created_at || '',
    }));
    return { items: [...injected, ...resources], debugQuery: sql };
  }

  if ((q.match(/'/g) || []).length % 2 === 1) {
    return {
      items: [],
      sqlError: 'near "\'": syntax error',
      debugQuery: sql,
    };
  }

  try {
    const snap = await getDocs(collection(db, 'resources'));
    let items = snap.docs.map((d) => d.data() as ResourceRecord);
    if (q) {
      const lower = q.toLowerCase();
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(lower) ||
          r.description.toLowerCase().includes(lower),
      );
    }
    if (category && category !== 'الكل') {
      items = items.filter((r) => r.category === category);
    }
    items.sort((a, b) => b.id - a.id);
    return { items, debugQuery: sql };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'resources');
  }
}

export async function fsCreateResource(input: {
  title: string;
  category: string;
  type: string;
  description: string;
  author: string;
}) {
  const { items } = await fsGetResources();
  const nextId = Math.max(0, ...items.map((r) => r.id)) + 1;
  const record: ResourceRecord = {
    id: nextId,
    title: input.title,
    category: input.category || 'القدرات الكمي',
    type: input.type || 'ملخص',
    description: input.description || '',
    file_name: 'qudrat_quant_summary.txt',
    author: input.author || 'الإدارة',
    downloads: 0,
    created_at: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'resources', String(nextId)), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `resources/${nextId}`);
  }
}

export async function fsUploadFile(filename: string, content: string): Promise<string> {
  const safeBase = filename.split('/').pop() || 'file.txt';
  try {
    await setDoc(doc(db, 'uploads', safeBase), {
      filename: safeBase,
      content,
      created_at: new Date().toISOString(),
    });
    return safeBase;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `uploads/${safeBase}`);
  }
}

export async function fsGetUploadedFile(filename: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, 'uploads', filename));
    return snap.exists() ? String((snap.data() as { content: string }).content) : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `uploads/${filename}`);
  }
}

// 5. Announcements & Comments
export async function fsGetAnnouncements(): Promise<AnnouncementRecord[]> {
  await ensureSeeded();
  try {
    const [annSnap, comSnap] = await Promise.all([
      getDocs(collection(db, 'announcements')),
      getDocs(collection(db, 'comments')),
    ]);
    const comments = comSnap.docs
      .map((d) => d.data() as CommentRecord)
      .sort((a, b) => a.id - b.id);
    const announcements = annSnap.docs
      .map((d) => d.data() as AnnouncementRecord)
      .sort((a, b) => b.id - a.id)
      .map((a) => ({
        ...a,
        comments: comments.filter((c) => c.announcement_id === a.id),
      }));
    return announcements;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'announcements');
  }
}

export async function fsCreateAnnouncement(input: {
  title: string;
  content: string;
  priority: string;
  author: string;
}) {
  const existing = await fsGetAnnouncements();
  const nextId = Math.max(0, ...existing.map((a) => a.id)) + 1;
  try {
    await setDoc(doc(db, 'announcements', String(nextId)), {
      id: nextId,
      title: input.title,
      content: input.content,
      priority: input.priority || 'normal',
      author: input.author || 'إدارة المدرسة',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `announcements/${nextId}`);
  }
}

export async function fsDeleteAnnouncement(id: number) {
  try {
    await deleteDoc(doc(db, 'announcements', String(id)));
    const comSnap = await getDocs(
      query(collection(db, 'comments'), where('announcement_id', '==', id)),
    );
    await Promise.all(comSnap.docs.map((d) => deleteDoc(d.ref)));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
  }
}

export async function fsAddComment(
  announcementId: number,
  authorName: string,
  body: string,
) {
  try {
    const snap = await getDocs(collection(db, 'comments'));
    const nextId =
      Math.max(0, ...snap.docs.map((d) => (d.data() as CommentRecord).id)) + 1;
    await setDoc(doc(db, 'comments', String(nextId)), {
      id: nextId,
      announcement_id: announcementId,
      author_name: authorName || 'زائر',
      body,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'comments');
  }
}

// 6. Notifications (IDOR by user_id)
export async function fsGetNotifications(userId: number): Promise<NotificationItem[]> {
  await ensureSeeded();
  try {
    const snap = await getDocs(
      query(collection(db, 'notifications'), where('user_id', '==', userId)),
    );
    return snap.docs
      .map((d) => d.data() as NotificationItem)
      .sort((a, b) => b.id - a.id);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'notifications');
  }
}

export async function fsSendNotification(
  userIdOrAll: string,
  title: string,
  message: string,
  type: string,
) {
  try {
    const snap = await getDocs(collection(db, 'notifications'));
    let nextId =
      Math.max(0, ...snap.docs.map((d) => (d.data() as NotificationItem).id)) + 1;

    const targetIds =
      userIdOrAll === 'all'
        ? (await fsGetUsers()).map((u) => u.id)
        : [Number(userIdOrAll || 2)];

    for (const uid of targetIds) {
      const id = nextId++;
      await setDoc(doc(db, 'notifications', String(id)), {
        id,
        user_id: uid,
        title,
        message,
        type: type || 'info',
        is_read: 0,
        created_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'notifications');
  }
}

export async function fsMarkNotificationRead(id: number) {
  try {
    await updateDoc(doc(db, 'notifications', String(id)), { is_read: 1 });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
  }
}

export async function fsDeleteNotification(id: number) {
  try {
    await deleteDoc(doc(db, 'notifications', String(id)));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `notifications/${id}`);
  }
}

// 7. Achievements & SSTI Certificate
export async function fsClaimPoints(userId: number, points: number) {
  const u = await fsGetUserById(userId);
  if (u) {
    await fsUpdateUser(userId, { points: (u.points || 0) + points });
  }
}

export function fsGenerateCertificate(studentName: string, achievementTitle: string): string {
  const template = `تشهد إدارة منصة ثانوية العارضة بأن الطالب/ة (${studentName}) قد أتم متطلبات (${achievementTitle}) بنجاح وتفوق.`;
  return renderVulnerableTemplate(template, { studentName, achievementTitle });
}

// 8. Contact Tickets (IDOR)
export async function fsGetTickets(): Promise<TicketRecord[]> {
  await ensureSeeded();
  try {
    const snap = await getDocs(collection(db, 'tickets'));
    return snap.docs
      .map((d) => d.data() as TicketRecord)
      .sort((a, b) => b.id - a.id);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'tickets');
  }
}

export async function fsGetTicketById(id: number): Promise<TicketRecord | null> {
  await ensureSeeded();
  try {
    const snap = await getDoc(doc(db, 'tickets', String(id)));
    return snap.exists() ? (snap.data() as TicketRecord) : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `tickets/${id}`);
  }
}

export async function fsCreateTicket(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<TicketRecord> {
  const tickets = await fsGetTickets();
  const nextId = Math.max(0, ...tickets.map((t) => t.id)) + 1;
  const ticket: TicketRecord = {
    id: nextId,
    name: input.name,
    email: input.email || '',
    subject: input.subject,
    message: input.message,
    status: 'open',
    internal_note: 'بانتظار مراجعة المشرف',
    created_at: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'tickets', String(nextId)), ticket);
    return ticket;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `tickets/${nextId}`);
  }
}

// 9. Debug Logs
export async function fsGetDebugLogs() {
  try {
    const snap = await getDocs(
      query(collection(db, 'sql_logs'), orderBy('ts', 'desc'), limit(25)),
    );
    return {
      environment: 'alardah-firestore-lab',
      jwtSecret: 'secret123',
      adminDefault: 'admin / admin123',
      recentSqlQueries: snap.docs.map((d) => d.data()),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'sql_logs');
  }
}
