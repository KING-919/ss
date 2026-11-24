import React, { useEffect, useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useApp, type NotificationItem } from '../context/AppContext';

export function NotificationsPage() {
  const { user, settings, refreshNotifications } = useApp();
  const [targetUserId, setTargetUserId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('userId') || String(user?.id || 2);
  });
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [domMsg] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('msg') || '';
  });

  const loadForUser = async (uid: string) => {
    const res = await fetch(`/api/notifications?userId=${encodeURIComponent(uid)}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.notifications || []);
    }
  };

  useEffect(() => {
    loadForUser(targetUserId);
  }, [targetUserId]);

  const markRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    loadForUser(targetUserId);
    refreshNotifications(Number(targetUserId));
  };

  const deleteNotification = async (id: number) => {
    // Intentionally vulnerable GET CSRF deletion
    await fetch(`/api/notifications/delete?id=${id}`);
    loadForUser(targetUserId);
    refreshNotifications(Number(targetUserId));
  };

  const typeLabel = (t: string) => {
    if (t === 'security') return 'تنبيه أمني';
    if (t === 'warning') return 'تذكير';
    if (t === 'success') return 'إنجاز';
    return 'إشعار';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: settings.textColor }}>
            مركز الإشعارات
          </h1>
          <p className="text-slate-600 text-sm">
            التنبيهات الدراسية والرسائل الإدارية الخاصة بحسابك
          </p>
        </div>

        {/* Intentionally exposed userId selector demonstrating IDOR */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadForUser(targetUserId);
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="notif-userid" className="text-xs font-medium text-slate-600 whitespace-nowrap">
            معرّف المستخدم (IDOR):
          </label>
          <input
            id="notif-userid"
            type="number"
            min={1}
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="w-20 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white tabular-nums"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg whitespace-nowrap"
            style={{ backgroundColor: settings.primaryColor }}
          >
            جلب
          </button>
        </form>
      </div>

      {/* DOM XSS vector via ?msg= */}
      {domMsg && (
        <div
          className="mb-6 p-4 rounded-lg bg-indigo-50 border border-indigo-200 text-sm text-indigo-900"
          dangerouslySetInnerHTML={{ __html: domMsg }}
        />
      )}

      {items.length === 0 ? (
        <div className="p-12 text-center border border-slate-200 rounded-xl bg-white text-slate-500 text-sm">
          لا توجد إشعارات لهذا المستخدم حالياً.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className={`p-5 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                n.is_read ? 'border-slate-200 opacity-80' : 'border-indigo-200 shadow-xs'
              }`}
              style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Bell className="w-3.5 h-3.5" style={{ color: settings.primaryColor }} />
                  <span className="font-semibold text-slate-700">{typeLabel(n.type)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{n.is_read ? 'مقروء' : 'جديد'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{String(n.created_at).slice(0, 16)}</span>
                </div>
                <h2 className="text-base font-bold" style={{ color: settings.textColor }}>
                  {n.title}
                </h2>
                <div
                  className="text-sm text-slate-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: n.message }}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!n.is_read && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    aria-label={`تحديد الإشعار ${n.id} كمقروء`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>تحديد كمقروء</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteNotification(n.id)}
                  aria-label={`حذف الإشعار ${n.id}`}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
