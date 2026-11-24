import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculatePlanProgress } from '../utils/studyLogic';
import {
  fsGetStudyPlans,
  fsCompleteStudyPlan,
  type StudyPlanRecord,
} from '../services/firestoreService';

export function StudyPlansPage() {
  const { settings, user, refreshCurrentUser, refreshNotifications } = useApp();
  const [plans, setPlans] = useState<StudyPlanRecord[]>([]);
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [completedMap, setCompletedMap] = useState<Record<number, number[]>>({});
  const [toast, setToast] = useState<string>('');

  const categories = ['', 'القدرات الكمي', 'القدرات اللفظي', 'التحصيلي', 'مراجعة سريعة'];

  const fetchPlans = async (cat: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await fsGetStudyPlans(cat);
      if (data.error) {
        setErrorMsg(`${data.error} — Query: ${data.debugQuery}`);
        setPlans([]);
      } else {
        setPlans(data.plans);
      }
    } catch {
      setErrorMsg('تعذر تحميل خطط المذاكرة من قاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans(category);
  }, [category]);

  const toggleTask = (planId: number, idx: number) => {
    setCompletedMap((prev) => {
      const current = prev[planId] || [];
      const exists = current.includes(idx);
      const next = exists ? current.filter((i) => i !== idx) : [...current, idx];
      return { ...prev, [planId]: next };
    });
  };

  const handleCompletePlan = async (planId: number) => {
    await fsCompleteStudyPlan(planId, user?.id, 100);
    setToast('تم تسجيل إتمام الخطة وإضافة 100 نقطة إلى رصيدك');
    await Promise.all([fetchPlans(category), refreshCurrentUser(), refreshNotifications()]);
    setTimeout(() => setToast(''), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: settings.textColor }}>
            خطط المذاكرة التفاعلية
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            اختر الخطة المناسبة لمسارك وتابع إنجاز مهامك الأسبوعية خطوة بخطوة
          </p>
        </div>

        {/* Filter Segmented Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          {categories.map((cat) => (
            <button
              key={cat || 'all'}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                category === cat
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat || 'الكل'}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          {toast}
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-64 rounded-xl bg-slate-200/70 animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 border border-slate-200 rounded-xl bg-white">
          <p className="text-slate-500">لا توجد خطط مذاكرة ضمن هذا التصنيف حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const tasks = Array.isArray(plan.tasks) ? plan.tasks : [];
            const done = completedMap[plan.id] || [];
            const progress = calculatePlanProgress(done.length, tasks.length);

            return (
              <article
                key={plan.id}
                className="p-6 border border-slate-200 flex flex-col justify-between"
                style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="font-semibold" style={{ color: settings.primaryColor }}>
                      {plan.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {plan.duration}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{plan.level}</span>
                  </div>

                  <h2 className="text-lg font-bold mb-2" style={{ color: settings.textColor }}>
                    {plan.title}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{plan.description}</p>

                  {tasks.length > 0 && (
                    <div className="mb-5 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>تقدم الخطة</span>
                        <span className="font-semibold tabular-nums">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-200"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: settings.primaryColor,
                          }}
                        />
                      </div>

                      <ul className="pt-2 space-y-1.5">
                        {tasks.map((task, idx) => {
                          const checked = done.includes(idx);
                          return (
                            <li key={idx}>
                              <button
                                type="button"
                                onClick={() => toggleTask(plan.id, idx)}
                                className="w-full text-right flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-sm transition-colors"
                              >
                                <CheckCircle2
                                  className={`w-4 h-4 shrink-0 ${
                                    checked ? 'text-emerald-600' : 'text-slate-300'
                                  }`}
                                />
                                <span
                                  className={
                                    checked ? 'line-through text-slate-400' : 'text-slate-700'
                                  }
                                >
                                  {task}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                    <Users className="w-4 h-4" />
                    <span>{plan.enrolled_count} طالب ملتحق</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCompletePlan(plan.id)}
                    className="px-4 py-2 text-xs font-semibold text-white hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
                    style={{
                      backgroundColor: settings.primaryColor,
                      borderRadius: settings.borderRadius,
                    }}
                  >
                    تسجيل إتمام الخطة (+100 نقطة)
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
