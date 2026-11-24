import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  points: number;
  phone?: string;
  secret_note?: string;
}

export interface SiteSettings {
  siteName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryBtn: string;
  heroSecondaryBtn: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  featuresTitle: string;
  featuresSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  footerText: string;
  copyrightText: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  heroGradientFrom: string;
  heroGradientTo: string;
  fontFamily: string;
  baseFontSize: string;
  borderRadius: string;
  showStats: boolean;
  showFeatures: boolean;
  showCta: boolean;
  bannerNotice: string;
  customCss: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

export const INITIAL_SETTINGS: SiteSettings = {
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

interface AppContextValue {
  user: User | null;
  token: string | null;
  settings: SiteSettings;
  notifications: NotificationItem[];
  unreadCount: number;
  loadingAuth: boolean;
  setUserSession: (user: User | null, token?: string | null) => void;
  logout: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  updateSettingsLocally: (next: Partial<SiteSettings>) => void;
  refreshNotifications: (overrideUserId?: number) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('alardah_user');
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('alardah_token'));
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const applyThemeToDom = useCallback((s: SiteSettings) => {
    const root = document.documentElement;
    root.style.setProperty('--site-primary', s.primaryColor);
    root.style.setProperty('--site-secondary', s.secondaryColor);
    root.style.setProperty('--site-bg', s.backgroundColor);
    root.style.setProperty('--site-card', s.cardColor);
    root.style.setProperty('--site-text', s.textColor);
    root.style.setProperty('--site-radius', s.borderRadius);
    root.style.fontSize = s.baseFontSize || '16px';
    document.body.style.fontFamily = `'${s.fontFamily || 'Cairo'}', system-ui, sans-serif`;
    document.body.style.backgroundColor = s.backgroundColor || '#f8fafc';
    document.body.style.color = s.textColor || '#0f172a';
    document.title = `${s.siteName} - منصة تعليمية متطورة`;

    let customStyleEl = document.getElementById('alardah-custom-css') as HTMLStyleElement | null;
    if (!customStyleEl) {
      customStyleEl = document.createElement('style');
      customStyleEl.id = 'alardah-custom-css';
      document.head.appendChild(customStyleEl);
    }
    customStyleEl.textContent = s.customCss || '';
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = (await res.json()) as SiteSettings;
        const merged = { ...INITIAL_SETTINGS, ...data };
        setSettings(merged);
        applyThemeToDom(merged);
      }
    } catch {
      applyThemeToDom(INITIAL_SETTINGS);
    }
  }, [applyThemeToDom]);

  const updateSettingsLocally = useCallback(
    (next: Partial<SiteSettings>) => {
      setSettings((prev) => {
        const merged = { ...prev, ...next };
        applyThemeToDom(merged);
        return merged;
      });
    },
    [applyThemeToDom],
  );

  const refreshNotifications = useCallback(
    async (overrideUserId?: number) => {
      try {
        const uid = overrideUserId ?? user?.id ?? 2;
        const res = await fetch(`/api/notifications?userId=${uid}`);
        if (res.ok) {
          const data = (await res.json()) as { notifications: NotificationItem[] };
          setNotifications(data.notifications || []);
        }
      } catch {
        // ignore
      }
    },
    [user?.id],
  );

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    const hasCookie = typeof document !== 'undefined' && document.cookie.includes('session_user=');
    if (!token && !hasCookie) {
      setLoadingAuth(false);
      return;
    }
    (async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch('/api/auth/me', { headers, credentials: 'include' });
        if (res.ok) {
          const data = (await res.json()) as { user: User };
          setUser(data.user);
          localStorage.setItem('alardah_user', JSON.stringify(data.user));
        }
      } catch {
        // ignore
      } finally {
        setLoadingAuth(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const setUserSession = (nextUser: User | null, nextToken?: string | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('alardah_user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('alardah_user');
    }
    if (nextToken !== undefined) {
      setToken(nextToken);
      if (nextToken) localStorage.setItem('alardah_token', nextToken);
      else localStorage.removeItem('alardah_token');
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUserSession(null, null);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        settings,
        notifications,
        unreadCount,
        loadingAuth,
        setUserSession,
        logout,
        refreshSettings,
        updateSettingsLocally,
        refreshNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
