import React, { useState } from 'react';
import { ShieldAlert, Terminal, Copy, Check, Bug } from 'lucide-react';
import { VULNERABILITIES_CATALOG } from '../../utils/studyLogic';

export function SecurityLabPanel() {
  const [pingHost, setPingHost] = useState('127.0.0.1; env');
  const [pingOutput, setPingOutput] = useState('');
  const [debugLogs, setDebugLogs] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string>('');

  const runPing = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/tools/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: pingHost }),
    });
    const data = await res.json();
    setPingOutput(`$ ${data.command}\n\n${data.output}`);
  };

  const fetchDebugLogs = async () => {
    const res = await fetch('/api/debug/logs');
    const data = await res.json();
    setDebugLogs(JSON.stringify(data, null, 2));
  };

  const copyPayload = (id: string, payload: string) => {
    navigator.clipboard?.writeText(payload);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          <span>مختبر الثغرات الأمنية وأدوات الفحص</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          بيئة تعليمية تحاكي أشهر ثغرات OWASP Top 10 لاختبار الاختراق الآمن وفهم أسبابها
        </p>
      </div>

      {/* Sandboxed Command Injection Ping Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              أداة فحص اتصال الخادم (Command Injection)
            </h3>
          </div>
          <form onSubmit={runPing} className="flex gap-2">
            <input
              type="text"
              dir="ltr"
              value={pingHost}
              onChange={(e) => setPingHost(e.target.value)}
              aria-label="عنوان الخادم للفحص"
              className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg whitespace-nowrap"
            >
              تنفيذ الفحص
            </button>
          </form>
          {pingOutput && (
            <pre
              dir="ltr"
              className="p-3.5 bg-slate-900 text-emerald-300 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-56"
            >
              {pingOutput}
            </pre>
          )}
        </div>

        {/* Unauthenticated Debug Endpoint */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Bug className="w-4 h-4 text-amber-600 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 truncate">
                سجلات النظام المكشوفة (<span dir="ltr" className="font-mono text-xs">/api/debug/logs</span>)
              </h3>
            </div>
            <button
              type="button"
              onClick={fetchDebugLogs}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              جلب السجلات
            </button>
          </div>
          <pre
            dir={debugLogs ? 'ltr' : 'rtl'}
            className="p-3.5 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-56"
          >
            {debugLogs || 'اضغط "جلب السجلات" لعرض استعلامات SQL ومفاتيح البيئة المسربة.'}
          </pre>
        </div>
      </div>

      {/* Vulnerability Catalog */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          دليل الثغرات المزروعة في المنصة ({VULNERABILITIES_CATALOG.length} ثغرة)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VULNERABILITIES_CATALOG.map((vuln) => (
            <div
              key={vuln.id}
              className="p-5 bg-white border border-slate-200 rounded-xl flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span
                    className={`font-bold ${
                      vuln.severity === 'critical'
                        ? 'text-red-600'
                        : vuln.severity === 'high'
                          ? 'text-amber-600'
                          : 'text-sky-600'
                    }`}
                  >
                    {vuln.severity === 'critical' ? 'حرج' : vuln.severity === 'high' ? 'عالي' : 'متوسط'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{vuln.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{vuln.locationAr}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{vuln.titleAr}</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{vuln.descriptionAr}</p>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono text-slate-500" dir="ltr">
                  {vuln.endpoint}
                </div>
                <div className="flex items-center gap-2 bg-slate-900 text-slate-100 px-3 py-2 rounded-lg">
                  <code className="text-[11px] font-mono truncate flex-1" dir="ltr">
                    {vuln.pocPayload}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyPayload(vuln.id, vuln.pocPayload)}
                    aria-label={`نسخ حمولة ${vuln.id}`}
                    className="p-1 text-slate-300 hover:text-white shrink-0"
                  >
                    {copiedId === vuln.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
