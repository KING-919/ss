import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  fsGetSettings,
  fsGetNotifications,
  fsGetUserById,
  fsLogout,
  readSessionFromCookies,
} from '../services/firestoreService';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  points: number;
  phone?: string;
  secret_note?: string;
  created_at?: string;
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
  refreshCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  updateSettingsLocally: (next: Partial<SiteSettings>) => void;
  refreshNotifications: (overrideUserId?: number) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialSession = readSessionFromCookies();
  const [user, setUser] = useState<User | null>(() =>
    initialSession.user && initialSession.user.id
      ? {
          id: Number(initialSession.user.id),
          username: String(initialSession.user.username || ''),
          name: String(initialSession.user.name || initialSession.user.username || ''),
          email: '',
          role: String(initialSession.user.role || 'student'),
          points: 0,
        }
      : null,
  );
  const [token, setToken] = useState<string | null>(() => initialSession.token);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const applyThemeToDom = useCallback((s: SiteSettings) => {
    if (typeof document === 'undefined') return;
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
      const data = await fsGetSettings();
      const merged = { ...INITIAL_SETTINGS, ...data };
      setSettings(merged);
      applyThemeToDom(merged);
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
        const list = await fsGetNotifications(uid);
        setNotifications(list);
      } catch {
        // non-fatal
      }
    },
    [user?.id],
  );

  const refreshCurrentUser = useCallback(async () => {
    const { user: cookieUser, token: cookieToken } = readSessionFromCookies();
    if (!cookieUser?.id) {
      setLoadingAuth(false);
      return;
    }
    try {
      const dbUser = await fsGetUserById(Number(cookieUser.id));
      if (dbUser) {
        // Respect role claim from JWT (intentional JWT alg:none lab behavior)
        setUser({ ...dbUser, role: cookieUser.role || dbUser.role });
      }
      if (cookieToken) setToken(cookieToken);
    } catch {
      // ignore
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const setUserSession = (nextUser: User | null, nextToken?: string | null) => {
    setUser(nextUser);
    if (nextToken !== undefined) {
      setToken(nextToken);
    }
  };

  const logout = async () => {
    await fsLogout();
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
        refreshCurrentUser,
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
