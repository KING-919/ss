import React, { useState } from 'react';
import { Bell, BookOpen, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const { user, settings, unreadCount, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'الرئيسية' },
    { path: '/study-plans', label: 'خطط المذاكرة' },
    { path: '/resources', label: 'المصادر' },
    { path: '/announcements', label: 'الإعلانات' },
    { path: '/achievements', label: 'الإنجازات' },
    { path: '/contact', label: 'التواصل' },
  ];

  const handleNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setMobileOpen(false);
    onNavigate(path);
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-slate-200/80 backdrop-blur-md"
      style={{ backgroundColor: `${settings.cardColor}f2` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => handleNav(e, '/')}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
        >
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <BookOpen className="w-5 h-5" />
          </span>
          <span className="text-lg font-bold tracking-tight" style={{ color: settings.textColor }}>
            {settings.siteName}
          </span>
        </a>

        {/* Zone 2: Clean single-line navigation */}
        <nav aria-label="التنقل الرئيسي" className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => {
            const active = currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleNav(e, item.path)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  active
                    ? 'font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
                style={
                  active
                    ? { color: settings.primaryColor, borderColor: settings.primaryColor }
                    : undefined
                }
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Notification Bell */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('/notifications')}
            aria-label="الإشعارات"
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white rounded-full flex items-center justify-center tabular-nums"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: settings.primaryColor,
                  borderRadius: settings.borderRadius,
                }}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة التحكم</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  onNavigate('/');
                }}
                aria-label="تسجيل الخروج"
                title="تسجيل الخروج"
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                style={{ borderRadius: settings.borderRadius }}
              >
                إنشاء حساب
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: settings.secondaryColor,
                  borderRadius: settings.borderRadius,
                }}
              >
                تسجيل الدخول
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => handleNav(e, item.path)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentPath === item.path
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onNavigate('/dashboard');
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-lg"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  لوحة التحكم
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setMobileOpen(false);
                    onNavigate('/');
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg"
                >
                  خروج
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onNavigate('/login');
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-lg"
                  style={{ backgroundColor: settings.secondaryColor }}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onNavigate('/register');
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  إنشاء حساب
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
