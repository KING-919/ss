import React, { useEffect, useState } from 'react';
import { Megaphone, MessageSquare, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CommentItem {
  id: number;
  announcement_id: number;
  author_name: string;
  body: string;
  created_at: string;
}

interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  priority: string;
  author: string;
  created_at: string;
  comments: CommentItem[];
}

export function AnnouncementsPage() {
  const { settings, user } = useApp();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [authorInputs, setAuthorInputs] = useState<Record<number, string>>({});

  const loadAnnouncements = async () => {
    const res = await fetch('/api/announcements');
    if (res.ok) {
      setAnnouncements(await res.json());
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleAddComment = async (e: React.FormEvent, announcementId: number) => {
    e.preventDefault();
    const body = commentInputs[announcementId] || '';
    if (!body.trim()) return;
    const author_name = authorInputs[announcementId] || user?.name || 'طالب ثانوية العارضة';
    const res = await fetch(`/api/announcements/${announcementId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_name, body }),
    });
    if (res.ok) {
      setCommentInputs((prev) => ({ ...prev, [announcementId]: '' }));
      loadAnnouncements();
    }
  };

  const priorityLabel = (p: string) => {
    if (p === 'urgent') return 'عاجل';
    if (p === 'important') return 'مهم';
    return 'إعلان عام';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: settings.textColor }}>
          الإعلانات والتنبيهات المدرسية
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          تابع آخر أخبار المدرسة ومواعيد الدورات التدريبية وشارك بتعليقاتك
        </p>
      </div>

      <div className="space-y-6">
        {announcements.map((item) => (
          <article
            key={item.id}
            className="p-6 sm:p-8 border border-slate-200"
            style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
          >
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <Megaphone className="w-4 h-4" style={{ color: settings.primaryColor }} />
              <span className="font-semibold text-slate-700">{priorityLabel(item.priority)}</span>
              <span aria-hidden="true">·</span>
              <span>{item.author}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{String(item.created_at).slice(0, 10)}</span>
            </div>

            <h2 className="text-xl font-bold mb-3" style={{ color: settings.textColor }}>
              {item.title}
            </h2>

            {/* Intentionally vulnerable Stored XSS in announcement content */}
            <div
              className="text-sm sm:text-base text-slate-700 leading-relaxed mb-6"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />

            {/* Comments Section */}
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-4">
                <MessageSquare className="w-4 h-4" />
                <span>التعليقات ({item.comments?.length || 0})</span>
              </div>

              <div className="space-y-3 mb-4">
                {item.comments?.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-800">{c.author_name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{String(c.created_at).slice(0, 16)}</span>
                    </div>
                    {/* Intentionally vulnerable Stored XSS in comments */}
                    <div
                      className="text-sm text-slate-700"
                      dangerouslySetInnerHTML={{ __html: c.body }}
                    />
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => handleAddComment(e, item.id)}
                className="flex flex-col sm:flex-row gap-2"
              >
                {!user && (
                  <input
                    type="text"
                    value={authorInputs[item.id] || ''}
                    onChange={(e) =>
                      setAuthorInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder="الاسم"
                    aria-label="اسم المعلق"
                    className="sm:w-40 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  />
                )}
                <input
                  type="text"
                  value={commentInputs[item.id] || ''}
                  onChange={(e) =>
                    setCommentInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                  placeholder="أضف تعليقاً (يدعم HTML في المختبر مثل <img src=x onerror=alert(1)>)"
                  aria-label="نص التعليق"
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg whitespace-nowrap shrink-0"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال</span>
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
