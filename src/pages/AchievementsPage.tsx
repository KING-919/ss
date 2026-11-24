import React, { useEffect, useState } from 'react';
import { Award, Trophy, Sparkles } from 'lucide-react';
import { useApp, type User } from '../context/AppContext';
import { getStudentRank } from '../utils/studyLogic';
import {
  fsGetUsers,
  fsClaimPoints,
  fsGenerateCertificate,
} from '../services/firestoreService';

export function AchievementsPage() {
  const { user, settings, refreshCurrentUser } = useApp();
  const [leaders, setLeaders] = useState<User[]>([]);
  const [certName, setCertName] = useState(user?.name || 'سارة القحطاني');
  const [certTitle, setCertTitle] = useState('إتمام خطة القدرات الكمي');
  const [certOutput, setCertOutput] = useState('');
  const [claimMsg, setClaimMsg] = useState('');

  const loadLeaders = async () => {
    const users = await fsGetUsers();
    setLeaders(users);
  };

  useEffect(() => {
    loadLeaders();
  }, []);

  const handleClaimPoints = async () => {
    await fsClaimPoints(user?.id || 2, 250);
    setClaimMsg('تمت إضافة 250 نقطة مكافأة إلى رصيدك بنجاح!');
    await Promise.all([loadLeaders(), refreshCurrentUser()]);
    setTimeout(() => setClaimMsg(''), 3500);
  };

  const handleGenerateCert = (e: React.FormEvent) => {
    e.preventDefault();
    const rendered = fsGenerateCertificate(certName, certTitle);
    setCertOutput(rendered);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: settings.textColor }}>
            لوحة الإنجازات والشهادات
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            قائمة الطلاب المتميزين وإصدار شهادات التفوق الفورية
          </p>
        </div>

        <button
          type="button"
          onClick={handleClaimPoints}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg whitespace-nowrap shrink-0"
          style={{ backgroundColor: settings.primaryColor }}
        >
          <Sparkles className="w-4 h-4" />
          <span>استلام مكافأة الحضور (+250 نقطة)</span>
        </button>
      </div>

      {claimMsg && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          {claimMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Leaderboard Table */}
        <div
          className="lg:col-span-2 border border-slate-200 overflow-hidden"
          style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5" style={{ color: settings.primaryColor }} />
            <h2 className="text-lg font-bold" style={{ color: settings.textColor }}>
              ترتيب المتفوقين
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6 font-semibold">المركز</th>
                  <th className="py-3 px-6 font-semibold">الاسم</th>
                  <th className="py-3 px-6 font-semibold">المستوى</th>
                  <th className="py-3 px-6 font-semibold text-left">النقاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaders.map((leader, idx) => {
                  const rank = getStudentRank(leader.points);
                  return (
                    <tr key={leader.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-6 font-bold tabular-nums text-slate-500">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {leader.name}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">{rank.titleAr}</td>
                      <td
                        className="py-3.5 px-6 text-left font-bold tabular-nums"
                        style={{ color: settings.primaryColor }}
                      >
                        {leader.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Certificate Generator (SSTI Vector) */}
        <div
          className="p-6 border border-slate-200"
          style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5" style={{ color: settings.primaryColor }} />
            <h2 className="text-lg font-bold" style={{ color: settings.textColor }}>
              إصدار شهادة تفوق
            </h2>
          </div>
          <form onSubmit={handleGenerateCert} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                اسم الطالب (يدعم قوالب {'{{expr}}'})
              </label>
              <input
                type="text"
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                عنوان الإنجاز
              </label>
              <input
                type="text"
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 text-sm font-semibold text-white rounded-lg"
              style={{ backgroundColor: settings.primaryColor }}
            >
              توليد نص الشهادة
            </button>
          </form>

          {certOutput && (
            <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm leading-relaxed text-slate-800">
              {certOutput}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
