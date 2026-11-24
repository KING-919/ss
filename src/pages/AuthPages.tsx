import React, { useState } from 'react';
import { Lock, UserPlus, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  fsLogin,
  fsLoginWithGoogle,
  fsRegister,
  fsResetPassword,
} from '../services/firestoreService';

interface AuthPageProps {
  onNavigate: (path: string) => void;
}

export function LoginPage({ onNavigate }: AuthPageProps) {
  const { settings, setUserSession, refreshNotifications } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debugSql, setDebugSql] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetUser, setResetUser] = useState('');
  const [resetPass, setResetPass] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePostLogin = async (userId: number) => {
    await refreshNotifications(userId);
    const params = new URLSearchParams(window.location.search);
    const hashParams = window.location.hash.includes('?')
      ? new URLSearchParams(window.location.hash.split('?')[1])
      : null;
    const nextUrl = params.get('next') || hashParams?.get('next');
    if (nextUrl) {
      // Intentionally vulnerable Open Redirect via ?next=
      window.location.href = nextUrl;
      return;
    }
    onNavigate('/dashboard');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugSql('');
    setSubmitting(true);
    try {
      const data = await fsLogin(username, password);
      if (data.error || !data.user) {
        setError(data.sqlError ? `${data.error}: ${data.sqlError}` : data.error || 'خطأ في الدخول');
        if (data.debugQuery) setDebugSql(data.debugQuery);
        return;
      }
      setUserSession(data.user, data.token || null);
      await handlePostLogin(data.user.id);
    } catch {
      setError('تعذر الاتصال بقاعدة البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      const data = await fsLoginWithGoogle();
      setUserSession(data.user, data.token);
      await handlePostLogin(data.user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول عبر Google');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = await fsResetPassword(resetUser, resetPass);
    setResetMsg(message);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div
        className="p-8 border border-slate-200 shadow-xs"
        style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: settings.textColor }}>
              تسجيل الدخول
            </h1>
            <p className="text-xs text-slate-500">ادخل إلى لوحة التحكم وحسابك التعليمي</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-xs font-medium text-slate-700 mb-1">
              اسم المستخدم
            </label>
            <input
              id="login-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-slate-700 mb-1">
              كلمة المرور
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
              <p className="font-semibold">{error}</p>
              {debugSql && <p className="mt-1 font-mono text-[11px] break-all" dir="ltr">{debugSql}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: settings.secondaryColor }}
          >
            {submitting ? 'جاري التحقق...' : 'دخول'}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            تسجيل الدخول عبر Google
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setShowReset((v) => !v)}
            className="hover:underline inline-flex items-center gap-1"
            style={{ color: settings.primaryColor }}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>نسيت كلمة المرور؟</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/register')}
            className="hover:underline"
          >
            إنشاء حساب جديد
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p>حساب الإدارة الافتراضي: <code className="font-mono text-slate-800">admin / admin123</code></p>
          <p>حساب طالب للتجربة: <code className="font-mono text-slate-800">sara / sara2025</code></p>
        </div>

        {showReset && (
          <form onSubmit={handleResetPassword} className="mt-5 pt-5 border-t border-slate-200 space-y-3">
            <h2 className="text-sm font-bold text-slate-800">استعادة كلمة المرور السريعة</h2>
            <input
              type="text"
              required
              value={resetUser}
              onChange={(e) => setResetUser(e.target.value)}
              placeholder="اسم المستخدم المراد تغييره"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
            <input
              type="password"
              required
              value={resetPass}
              onChange={(e) => setResetPass(e.target.value)}
              placeholder="كلمة المرور الجديدة"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
            <button
              type="submit"
              className="w-full py-2 text-xs font-semibold text-white rounded-lg bg-slate-800"
            >
              تعيين كلمة المرور فوراً
            </button>
            {resetMsg && <p className="text-xs text-emerald-700">{resetMsg}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

export function RegisterPage({ onNavigate }: AuthPageProps) {
  const { settings, setUserSession } = useApp();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('student');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fsRegister({ name, username, email, password, role });
    if (res.error || !res.user) {
      setError(res.error || 'تعذر إنشاء الحساب');
      return;
    }
    setUserSession(res.user, res.token || null);
    onNavigate('/dashboard');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div
        className="p-8 border border-slate-200 shadow-xs"
        style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: settings.textColor }}>
              إنشاء حساب جديد
            </h1>
            <p className="text-xs text-slate-500">انضم إلى منصة ثانوية العارضة التعليمية</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">الاسم الكامل</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">اسم المستخدم</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <input type="hidden" name="role" value={role} />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full py-2.5 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: settings.primaryColor }}
          >
            تسجيل الحساب
          </button>
        </form>
      </div>
    </div>
  );
}
