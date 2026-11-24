import React, { useState } from 'react';
import { Send, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface TicketItem {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  internal_note?: string;
}

export function ContactPage() {
  const { settings } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<TicketItem | null>(null);
  const [lookupId, setLookupId] = useState('2');
  const [foundTicket, setFoundTicket] = useState<TicketItem | null>(null);
  const [lookupError, setLookupError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    });
    if (res.ok) {
      const data = await res.json();
      setSubmittedTicket(data.ticket);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setFoundTicket(null);
    const res = await fetch(`/api/contact/tickets/${encodeURIComponent(lookupId)}`);
    if (res.ok) {
      setFoundTicket(await res.json());
    } else {
      setLookupError('لم يتم العثور على التذكرة');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: settings.textColor }}>
          التواصل والدعم الفني
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          أرسل استفسارك لإدارة ثانوية العارضة أو تابع حالة تذكرتك برقمها التسلسلي
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 border border-slate-200 space-y-4"
          style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
        >
          <h2 className="text-lg font-bold mb-2" style={{ color: settings.textColor }}>
            إرسال رسالة جديدة
          </h2>
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
            <label className="block text-xs font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">الموضوع</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">الرسالة</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <Send className="w-4 h-4" />
            <span>إرسال الرسالة</span>
          </button>

          {submittedTicket && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
              تم استلام تذكرتك بنجاح! رقم التذكرة: <strong className="tabular-nums">#{submittedTicket.id}</strong>
            </div>
          )}
        </form>

        {/* IDOR Ticket Lookup */}
        <div
          className="p-6 sm:p-8 border border-slate-200"
          style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
        >
          <h2 className="text-lg font-bold mb-2" style={{ color: settings.textColor }}>
            متابعة حالة التذكرة
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            أدخل رقم التذكرة لعرض التفاصيل والملاحظات الداخلية (IDOR: جرب الرقم 1 أو 2)
          </p>

          <form onSubmit={handleLookup} className="flex gap-2 mb-6">
            <input
              type="number"
              min={1}
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              aria-label="رقم التذكرة"
              className="flex-1 px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg"
              style={{ backgroundColor: settings.secondaryColor }}
            >
              <Search className="w-4 h-4" />
              <span>استعلام</span>
            </button>
          </form>

          {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}

          {foundTicket && (
            <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>تذكرة #{foundTicket.id}</span>
                <span>الحالة: {foundTicket.status}</span>
              </div>
              <div className="font-bold text-slate-900">{foundTicket.subject}</div>
              <div className="text-slate-600">المرسل: {foundTicket.name} ({foundTicket.email})</div>
              <p className="text-slate-700 pt-2 border-t border-slate-200">{foundTicket.message}</p>
              {foundTicket.internal_note && (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono">
                  ملاحظة المشرف: {foundTicket.internal_note}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
