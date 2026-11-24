import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, FileText, Trophy, Megaphone } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

interface AnnouncementPreview {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { settings } = useApp();
  const [announcements, setAnnouncements] = useState<AnnouncementPreview[]>([]);

  useEffect(() => {
    fetch('/api/announcements')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAnnouncements(data.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Optional Admin Custom Banner */}
      {settings.bannerNotice && (
        <div
          className="px-4 py-2.5 text-center text-sm font-medium text-white"
          style={{ backgroundColor: settings.secondaryColor }}
          dangerouslySetInnerHTML={{ __html: settings.bannerNotice }}
        />
      )}

      {/* Hero Section matching reference layout */}
      <section
        className="text-white py-20 sm:py-24 px-4"
        style={{
          background: `linear-gradient(135deg, ${settings.heroGradientFrom} 0%, ${settings.heroGradientTo} 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-3xl sm:text-5xl font-extrabold leading-tight mb-6"
            style={{ textWrap: 'balance' }}
          >
            {settings.heroTitle}
          </h1>
          <p className="text-base sm:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto mb-10">
            {settings.heroSubtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/study-plans')}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-bold bg-white text-slate-900 shadow-sm hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              style={{ borderRadius: settings.borderRadius }}
            >
              <span>{settings.heroPrimaryBtn}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/resources')}
              className="px-6 py-3 text-sm sm:text-base font-semibold bg-white/15 text-white border border-white/30 hover:bg-white/25 transition-colors whitespace-nowrap shrink-0"
              style={{ borderRadius: settings.borderRadius }}
            >
              {settings.heroSecondaryBtn}
            </button>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      {settings.showStats && (
        <section className="py-12 border-b border-slate-200/70" style={{ backgroundColor: settings.backgroundColor }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div
                className="text-3xl sm:text-4xl font-extrabold tabular-nums mb-1"
                style={{ color: settings.secondaryColor }}
              >
                {settings.stat1Value}
              </div>
              <div className="text-sm font-medium text-slate-600">{settings.stat1Label}</div>
            </div>
            <div>
              <div
                className="text-3xl sm:text-4xl font-extrabold tabular-nums mb-1"
                style={{ color: settings.secondaryColor }}
              >
                {settings.stat2Value}
              </div>
              <div className="text-sm font-medium text-slate-600">{settings.stat2Label}</div>
            </div>
            <div>
              <div
                className="text-3xl sm:text-4xl font-extrabold tabular-nums mb-1"
                style={{ color: settings.secondaryColor }}
              >
                {settings.stat3Value}
              </div>
              <div className="text-sm font-medium text-slate-600">{settings.stat3Label}</div>
            </div>
          </div>
        </section>
      )}

      {/* Platform Features */}
      {settings.showFeatures && (
        <section className="py-16 sm:py-20 px-4">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: settings.textColor }}>
                {settings.featuresTitle}
              </h2>
              <p className="text-slate-600 text-base">{settings.featuresSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="p-8 border border-slate-200 text-center flex flex-col items-center"
                style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white mb-5"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: settings.textColor }}>
                  خطط مذاكرة مخصصة
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  خطط مذاكرة مصممة خصيصاً لمساعدتك في التحضير الأمثل لاختبارات القدرات والتحصيلي.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/study-plans')}
                  className="mt-auto px-4 py-2 text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
                  style={{ color: settings.primaryColor, borderRadius: settings.borderRadius }}
                >
                  اكتشف المزيد
                </button>
              </div>

              <div
                className="p-8 border border-slate-200 text-center flex flex-col items-center"
                style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white mb-5"
                  style={{ backgroundColor: settings.secondaryColor }}
                >
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: settings.textColor }}>
                  مصادر تعليمية شاملة
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  مكتبة واسعة من الملخصات والمذكرات وبنوك الأسئلة المتنوعة لجميع المسارات.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/resources')}
                  className="mt-auto px-4 py-2 text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
                  style={{ color: settings.primaryColor, borderRadius: settings.borderRadius }}
                >
                  اكتشف المزيد
                </button>
              </div>

              <div
                className="p-8 border border-slate-200 text-center flex flex-col items-center"
                style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white mb-5"
                  style={{ backgroundColor: settings.accentColor }}
                >
                  <Trophy className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: settings.textColor }}>
                  تتبع الإنجازات والإشعارات
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  تابع تقدمك الدراسي واستلم الإشعارات الفورية وتنبيهات الاختبارات التجريبية.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/achievements')}
                  className="mt-auto px-4 py-2 text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
                  style={{ color: settings.primaryColor, borderRadius: settings.borderRadius }}
                >
                  اكتشف المزيد
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Announcements Preview */}
      {announcements.length > 0 && (
        <section className="py-14 px-4 border-t border-slate-200/70">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: settings.textColor }}>
                  أحدث الإعلانات المدرسية
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  تابع المستجدات ومواعيد الدورات التدريبية
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/announcements')}
                className="text-sm font-semibold hover:underline whitespace-nowrap shrink-0"
                style={{ color: settings.primaryColor }}
              >
                عرض جميع الإعلانات
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.map((item) => (
                <article
                  key={item.id}
                  className="p-6 border border-slate-200 flex flex-col justify-between"
                  style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <Megaphone className="w-3.5 h-3.5" style={{ color: settings.primaryColor }} />
                      <span>{item.author}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{String(item.created_at).slice(0, 10)}</span>
                    </div>
                    <h3 className="text-base font-bold mb-2" style={{ color: settings.textColor }}>
                      {item.title}
                    </h3>
                    <div
                      className="text-sm text-slate-600 line-clamp-3 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      {settings.showCta && (
        <section
          className="py-16 px-4 text-white"
          style={{
            background: `linear-gradient(135deg, ${settings.secondaryColor} 0%, ${settings.heroGradientFrom} 100%)`,
          }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{settings.ctaTitle}</h2>
            <p className="text-white/90 mb-8">{settings.ctaSubtitle}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('/study-plans')}
                className="px-6 py-3 bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 transition-colors"
                style={{ borderRadius: settings.borderRadius }}
              >
                ابدأ الآن
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/contact')}
                className="px-6 py-3 bg-white/15 text-white border border-white/30 font-semibold text-sm hover:bg-white/25 transition-colors"
                style={{ borderRadius: settings.borderRadius }}
              >
                تواصل معنا
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
