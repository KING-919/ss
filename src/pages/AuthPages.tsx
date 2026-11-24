import React, { useState } from 'react';
import { Lock, UserPlus, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugSql('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.sqlError ? `${data.error}: ${data.sqlError}` : data.error);
      if (data.debugQuery) setDebugSql(data.debugQuery);
      return;
    }
    setUserSession(data.user, data.token);
    await refreshNotifications(data.user.id);

    const params = new URLSearchParams(window.location.search);
    const nextUrl = params.get('next');
    if (nextUrl) {
      // Intentionally vulnerable Open Redirect via ?next=
      window.location.href = `/api/redirect?next=${encodeURIComponent(nextUrl)}`;
      return;
    }
    onNavigate('/dashboard');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: resetUser, newPassword: resetPass }),
    });
    const data = await res.json();
    setResetMsg(data.message || data.error);
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
            className="w-full py-2.5 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: settings.secondaryColor }}
          >
            دخول
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
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'تعذر إنشاء الحساب');
      return;
    }
    setUserSession(data.user, data.token);
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
          {/* Hidden Mass Assignment role field exposed as select/advanced option */}
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
