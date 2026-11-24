export interface VulnerabilityEntry {
  id: string;
  titleAr: string;
  category: string;
  severity: 'critical' | 'high' | 'medium';
  endpoint: string;
  locationAr: string;
  descriptionAr: string;
  pocPayload: string;
}

export function calculatePlanProgress(
  completedTasks: number,
  totalTasks: number,
): number {
  if (totalTasks <= 0) return 0;
  const pct = Math.round((completedTasks / totalTasks) * 100);
  return Math.max(0, Math.min(100, pct));
}

export function getStudentRank(points: number): {
  titleAr: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
} {
  if (points >= 2000) return { titleAr: 'نخبة التفوق', tier: 'platinum' };
  if (points >= 1200) return { titleAr: 'طالب متميز', tier: 'gold' };
  if (points >= 600) return { titleAr: 'طالب مثابر', tier: 'silver' };
  return { titleAr: 'طالب مجتهد', tier: 'bronze' };
}

export const VULNERABILITIES_CATALOG: VulnerabilityEntry[] = [
  {
    id: 'sqli-login',
    titleAr: 'حقن قواعد البيانات في تسجيل الدخول (SQL Injection)',
    category: 'A03: Injection',
    severity: 'critical',
    endpoint: 'fsLogin() -> Firestore: users',
    locationAr: 'صفحة تسجيل الدخول',
    descriptionAr:
      'يتم دمج اسم المستخدم وكلمة المرور مباشرة داخل استعلام SQL دون استخدام Parameterized Queries.',
    pocPayload: "admin' --",
  },
  {
    id: 'sqli-union',
    titleAr: 'استخراج البيانات عبر UNION SQLi في البحث',
    category: 'A03: Injection',
    severity: 'critical',
    endpoint: 'fsGetResources(q) -> Firestore: resources',
    locationAr: 'صفحة مصادر التعلم',
    descriptionAr:
      'مربع البحث في المصادر التعليمية يمرر النص إلى استعلام LIKE مباشرة مما يسمح بسحب جدول المستخدمين وكلمات المرور.',
    pocPayload:
      "%') UNION SELECT id, username, password, role, secret_note, email, created_at, 0 FROM users --",
  },
  {
    id: 'xss-stored',
    titleAr: 'حقن الأكواد المخزن (Stored XSS)',
    category: 'A03: Injection',
    severity: 'high',
    endpoint: 'fsAddComment() -> Firestore: comments',
    locationAr: 'تعليقات الإعلانات ونشر الإعلانات',
    descriptionAr:
      'يتم حفظ التعليقات والإعلانات وعرضها عبر dangerouslySetInnerHTML دون تعقيم وسوم HTML.',
    pocPayload: '<img src=x onerror="alert(\'XSS: \' + document.cookie)">',
  },
  {
    id: 'xss-reflected',
    titleAr: 'حقن الأكواد المنعكس (Reflected XSS)',
    category: 'A03: Injection',
    severity: 'high',
    endpoint: '#/resources (Search Query Echo)',
    locationAr: 'شريط البحث في المصادر',
    descriptionAr:
      'يتم عرض عبارة البحث مباشرة داخل DOM كـ HTML خام دون ترميز.',
    pocPayload: '<svg onload="alert(\'Reflected XSS\')">',
  },
  {
    id: 'idor-notifications',
    titleAr: 'الوصول المباشر للكائنات (IDOR) في الإشعارات والحسابات',
    category: 'A01: Broken Access Control',
    severity: 'critical',
    endpoint: 'fsGetNotifications(userId) -> Firestore: notifications',
    locationAr: 'صفحة الإشعارات وملف المستخدم',
    descriptionAr:
      'تغيير رقم userId في الطلب يسمح بقراءة إشعارات المدير الخاصة ورسائل التواصل السرية.',
    pocPayload: '#/notifications?userId=1',
  },
  {
    id: 'mass-assignment',
    titleAr: 'تصعيد الصلاحيات عبر التعيين الجماعي (Mass Assignment)',
    category: 'A01: Broken Access Control',
    severity: 'critical',
    endpoint: 'fsRegister() -> Firestore: users',
    locationAr: 'إنشاء حساب وتحديث الملف الشخصي',
    descriptionAr:
      'يقبل النظام حقل role مباشرة أثناء التسجيل مما يتيح إنشاء حساب مدير admin مباشرة.',
    pocPayload: '{"username":"pentester","password":"123","role":"admin"}',
  },
  {
    id: 'jwt-alg-none',
    titleAr: 'ضعف توقيع JWT وقبول خوارزمية alg: none',
    category: 'A07: Identification & Auth Failures',
    severity: 'critical',
    endpoint: 'Cookie: auth_token (verifyWeakJwt)',
    locationAr: 'التحقق من الجلسة والكوكيز',
    descriptionAr:
      'يستخدم النظام كلمة سر ضعيفة (secret123) ويقبل توكن JWT موقع بخوارزمية none بدون توقيع.',
    pocPayload: 'Header: {"alg":"none","typ":"JWT"}',
  },
  {
    id: 'weak-reset',
    titleAr: 'إعادة تعيين كلمة المرور لأي مستخدم دون تحقق',
    category: 'A07: Identification & Auth Failures',
    severity: 'high',
    endpoint: 'fsResetPassword() -> Firestore: users',
    locationAr: 'نموذج استعادة كلمة المرور',
    descriptionAr:
      'لا يتحقق النظام من رمز التحقق OTP ويكتفي بإدخال اسم المستخدم لتغيير كلمة مروره.',
    pocPayload: '{"username":"admin","newPassword":"hacked123"}',
  },
  {
    id: 'path-traversal',
    titleAr: 'اختراق المسارات وقراءة الملفات الحساسة (Path Traversal)',
    category: 'A01: Broken Access Control',
    severity: 'high',
    endpoint: 'resolveVirtualFile(file)',
    locationAr: 'تنزيل ومعاينة ملفات المصادر',
    descriptionAr:
      'دمج اسم الملف دون إزالة ../ يسمح بقراءة ملفات الإعدادات الافتراضية داخل البيئة المعزولة.',
    pocPayload: '../../.env.lab',
  },
  {
    id: 'cmd-injection',
    titleAr: 'حقن أوامر النظام (Command Injection)',
    category: 'A03: Injection',
    severity: 'critical',
    endpoint: 'executeSandboxedPing(host)',
    locationAr: 'أداة فحص الشبكة في لوحة التحكم',
    descriptionAr:
      'يمكن دمج أوامر إضافية بعد اسم المضيف باستخدام الفاصلة المنقوطة ; أو && داخل المحاكي الآمن.',
    pocPayload: '127.0.0.1; env',
  },
  {
    id: 'ssrf',
    titleAr: 'تزوير طلبات الخادم (SSRF)',
    category: 'A10: SSRF',
    severity: 'high',
    endpoint: 'resolveSandboxedSsrf(url)',
    locationAr: 'استيراد مصدر تعليمي من رابط',
    descriptionAr:
      'لا يمنع المحاكي طلب عناوين الشبكة الداخلية أو بيانات السحابة 169.254.169.254.',
    pocPayload: 'http://169.254.169.254/latest/meta-data/',
  },
  {
    id: 'ssti',
    titleAr: 'حقن القوالب من جهة الخادم (SSTI)',
    category: 'A03: Injection',
    severity: 'high',
    endpoint: 'fsGenerateCertificate() -> renderVulnerableTemplate',
    locationAr: 'مولد شهادات التفوق',
    descriptionAr:
      'يقوم مولد الشهادات بتنفيذ التعبيرات البرمجية داخل الأقواس {{ }} مباشرة.',
    pocPayload: '{{7*7}} - {{labFlag}}',
  },
  {
    id: 'csrf-upload-redirect',
    titleAr: 'ثغرات CSRF + رفع ملفات غير مقيد + إعادة توجيه مفتوحة',
    category: 'A04 / A05: Security Misconfiguration',
    severity: 'medium',
    endpoint: 'fsUploadFile() -> Firestore: uploads | ?next=',
    locationAr: 'رفع الملفات، الإشعارات، تسجيل الدخول',
    descriptionAr:
      'نقص رموز CSRF، إمكانية رفع ملفات SVG/HTML تحتوي سكريبتات، ووجود ?next= بدون تحقق.',
    pocPayload: '#/login?next=https://example.com',
  },
];
