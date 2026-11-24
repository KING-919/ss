import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Palette,
  Megaphone,
  Bell,
  BookOpen,
  Users,
  ShieldAlert,
  Trash2,
  Plus,
} from 'lucide-react';
import { useApp, type User } from '../context/AppContext';
import { SiteCustomizerPanel } from '../components/dashboard/SiteCustomizerPanel';
import { SecurityLabPanel } from '../components/dashboard/SecurityLabPanel';

type DashTab =
  | 'overview'
  | 'customize'
  | 'announcements'
  | 'notifications'
  | 'content'
  | 'users'
  | 'lab';

interface AnnouncementRow {
  id: number;
  title: string;
  content: string;
  priority: string;
  author: string;
}

interface PlanRow {
  id: number;
  title: string;
  category: string;
  duration: string;
}

interface ResourceRow {
  id: number;
  title: string;
  category: string;
  type: string;
}

interface TicketRow {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
}

export function DashboardPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { user, settings, refreshNotifications } = useApp();
  const [tab, setTab] = useState<DashTab>('overview');

  const [usersList, setUsersList] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);

  // Form states
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('normal');

  const [notifUserId, setNotifUserId] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifType, setNotifType] = useState('info');

  const [planTitle, setPlanTitle] = useState('');
  const [planCat, setPlanCat] = useState('القدرات الكمي');
  const [planDur, setPlanDur] = useState('14 يوماً');
  const [planDesc, setPlanDesc] = useState('');

  const [resTitle, setResTitle] = useState('');
  const [resCat, setResCat] = useState('القدرات الكمي');
  const [resType, setResType] = useState('ملخص PDF');
  const [resDesc, setResDesc] = useState('');

  const [feedback, setFeedback] = useState('');

  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  };

  const loadAllData = async () => {
    const [uRes, aRes, pRes, rRes, tRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/announcements'),
      fetch('/api/study-plans'),
      fetch('/api/resources'),
      fetch('/api/contact/tickets'),
    ]);
    if (uRes.ok) setUsersList(await uRes.json());
    if (aRes.ok) setAnnouncements(await aRes.json());
    if (pRes.ok) setPlans((await pRes.json()).plans || []);
    if (rRes.ok) setResources((await rRes.json()).items || []);
    if (tRes.ok) setTickets(await tRes.json());
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: annTitle,
        content: annContent,
        priority: annPriority,
        author: user?.name || 'إدارة المدرسة',
      }),
    });
    if (res.ok) {
      setAnnTitle('');
      setAnnContent('');
      notify('تم نشر الإعلان بنجاح');
      loadAllData();
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
    loadAllData();
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: notifUserId,
        title: notifTitle,
        message: notifMsg,
        type: notifType,
      }),
    });
    if (res.ok) {
      setNotifTitle('');
      setNotifMsg('');
      notify('تم إرسال الإشعار بنجاح');
      refreshNotifications();
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/study-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: planTitle,
        category: planCat,
        duration: planDur,
        description: planDesc,
      }),
    });
    if (res.ok) {
      setPlanTitle('');
      setPlanDesc('');
      notify('تمت إضافة خطة المذاكرة');
      loadAllData();
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: resTitle,
        category: resCat,
        type: resType,
        description: resDesc,
        author: user?.name || 'الإدارة',
      }),
    });
    if (res.ok) {
      setResTitle('');
      setResDesc('');
      notify('تمت إضافة المصدر التعليمي');
      loadAllData();
    }
  };

  const handleToggleRole = async (targetUser: User) => {
    const nextRole = targetUser.role === 'admin' ? 'student' : 'admin';
    await fetch(`/api/users/${targetUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole }),
    });
    notify(`تم تحديث صلاحية ${targetUser.username} إلى ${nextRole}`);
    loadAllData();
  };

  const navTabs: Array<{ id: DashTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'نظرة عامة', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'customize', label: 'تخصيص شكل الموقع', icon: <Palette className="w-4 h-4" /> },
    { id: 'announcements', label: 'إدارة الإعلانات', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'notifications', label: 'إرسال الإشعارات', icon: <Bell className="w-4 h-4" /> },
    { id: 'content', label: 'الخطط والمصادر', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'users', label: 'المستخدمون والتذاكر', icon: <Users className="w-4 h-4" /> },
    { id: 'lab', label: 'مختبر الثغرات', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar */}
        <aside
          className="w-full lg:w-64 shrink-0 border border-slate-200 p-4 space-y-1.5"
          style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
        >
          <div className="px-3 py-2 mb-2 border-b border-slate-100">
            <div className="text-sm font-bold text-slate-900">
              {user ? user.name : 'لوحة تحكم المنصة'}
            </div>
            <div className="text-xs text-slate-500">
              {user ? `${user.username} · ${user.role}` : 'وضع المعاينة الإداري'}
            </div>
          </div>

          {navTabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-right ${
                  active ? 'text-white font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
                style={active ? { backgroundColor: settings.primaryColor } : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          {!user && (
            <div className="pt-3 mt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
              >
                تسجيل الدخول بحساب admin
              </button>
            </div>
          )}
        </aside>

        {/* Main Workspace */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {feedback && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
              {feedback}
            </div>
          )}

          {tab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: settings.textColor }}>
                  نظرة عامة على المنصة
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  إدارة المحتوى التعليمي، تخصيص الواجهة، ومتابعة الطلاب
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['المستخدمون', usersList.length],
                  ['خطط المذاكرة', plans.length],
                  ['المصادر التعليمية', resources.length],
                  ['الإعلانات والتذاكر', announcements.length + tickets.length],
                ].map(([label, val]) => (
                  <div
                    key={String(label)}
                    className="p-5 border border-slate-200/80"
                    style={{
                      backgroundColor: settings.cardColor,
                      borderRadius: settings.borderRadius,
                    }}
                  >
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div
                      className="text-2xl font-extrabold tabular-nums"
                      style={{ color: settings.primaryColor }}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="p-6 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{
                  backgroundColor: settings.cardColor,
                  borderRadius: settings.borderRadius,
                }}
              >
                <div>
                  <h2 className="text-base font-bold" style={{ color: settings.textColor }}>
                    تخصيص تصميم الموقع بالكامل
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    غيّر ألوان المنصة، الخطوط، العناوين، والإحصائيات مباشرة من محرر المظهر.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('customize')}
                  className="px-4 py-2 text-xs font-semibold text-white rounded-lg whitespace-nowrap shrink-0"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  فتح محرر المظهر
                </button>
              </div>
            </div>
          )}

          {tab === 'customize' && <SiteCustomizerPanel />}

          {tab === 'announcements' && (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateAnnouncement}
                className="p-6 bg-white border border-slate-200 rounded-xl space-y-4"
              >
                <h2 className="text-lg font-bold text-slate-900">نشر إعلان جديد</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      عنوان الإعلان
                    </label>
                    <input
                      type="text"
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">الأولوية</label>
                    <select
                      value={annPriority}
                      onChange={(e) => setAnnPriority(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="normal">إعلان عام</option>
                      <option value="important">مهم</option>
                      <option value="urgent">عاجل</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    المحتوى (يدعم HTML خام - Stored XSS)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <Plus className="w-4 h-4" />
                  <span>نشر الإعلان</span>
                </button>
              </form>

              <div className="space-y-3">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900">{a.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{a.author}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      aria-label={`حذف إعلان ${a.title}`}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <form
              onSubmit={handleSendNotification}
              className="p-6 bg-white border border-slate-200 rounded-xl space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-900">إرسال إشعار للطلاب أو الإدارة</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">المستلم</label>
                  <select
                    value={notifUserId}
                    onChange={(e) => setNotifUserId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="all">جميع المستخدمين</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">النوع</label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="info">تنبيه عام</option>
                    <option value="success">إنجاز</option>
                    <option value="warning">تذكير مهم</option>
                    <option value="security">تنبيه أمني</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">عنوان الإشعار</label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">نص الإشعار</label>
                <textarea
                  rows={3}
                  required
                  value={notifMsg}
                  onChange={(e) => setNotifMsg(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg"
                style={{ backgroundColor: settings.primaryColor }}
              >
                إرسال الإشعار
              </button>
            </form>
          )}

          {tab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={handleCreatePlan}
                className="p-6 bg-white border border-slate-200 rounded-xl space-y-4"
              >
                <h2 className="text-base font-bold text-slate-900">إضافة خطة مذاكرة جديدة</h2>
                <input
                  type="text"
                  required
                  placeholder="عنوان الخطة"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={planCat}
                    onChange={(e) => setPlanCat(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="القدرات الكمي">القدرات الكمي</option>
                    <option value="القدرات اللفظي">القدرات اللفظي</option>
                    <option value="التحصيلي">التحصيلي</option>
                    <option value="مراجعة سريعة">مراجعة سريعة</option>
                  </select>
                  <input
                    type="text"
                    placeholder="المدة (مثلاً 14 يوماً)"
                    value={planDur}
                    onChange={(e) => setPlanDur(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="وصف الخطة"
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white rounded-lg"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  حفظ الخطة
                </button>
              </form>

              <form
                onSubmit={handleCreateResource}
                className="p-6 bg-white border border-slate-200 rounded-xl space-y-4"
              >
                <h2 className="text-base font-bold text-slate-900">إضافة مصدر تعليمي جديد</h2>
                <input
                  type="text"
                  required
                  placeholder="عنوان المصدر"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={resCat}
                    onChange={(e) => setResCat(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="القدرات الكمي">القدرات الكمي</option>
                    <option value="القدرات اللفظي">القدرات اللفظي</option>
                    <option value="التحصيلي">التحصيلي</option>
                  </select>
                  <input
                    type="text"
                    placeholder="النوع (ملخص PDF)"
                    value={resType}
                    onChange={(e) => setResType(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="وصف المصدر"
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white rounded-lg"
                  style={{ backgroundColor: settings.secondaryColor }}
                >
                  إضافة المصدر
                </button>
              </form>
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 font-bold text-sm text-slate-900">
                  المستخدمون المسجلون (Sensitive Data Exposure)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">المستخدم</th>
                        <th className="py-3 px-4">الاسم</th>
                        <th className="py-3 px-4">الدور</th>
                        <th className="py-3 px-4">النقاط</th>
                        <th className="py-3 px-4">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.map((u) => (
                        <tr key={u.id}>
                          <td className="py-3 px-4 tabular-nums">{u.id}</td>
                          <td className="py-3 px-4 font-mono">{u.username}</td>
                          <td className="py-3 px-4 font-semibold">{u.name}</td>
                          <td className="py-3 px-4">{u.role}</td>
                          <td className="py-3 px-4 tabular-nums">{u.points}</td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleRole(u)}
                              className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 rounded hover:bg-slate-50"
                            >
                              تبديل admin/student
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-sm text-slate-900">تذاكر التواصل</h3>
                {tickets.map((t) => (
                  <div key={t.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="font-bold text-slate-900">
                      #{t.id} — {t.subject} ({t.name})
                    </div>
                    <p className="text-slate-600 mt-1">{t.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'lab' && <SecurityLabPanel />}
        </div>
      </div>
    </div>
  );
}
