import React, { useState } from 'react';
import { Palette, RotateCcw, Save, Check } from 'lucide-react';
import { useApp, INITIAL_SETTINGS, type SiteSettings } from '../../context/AppContext';

const THEME_PRESETS: Array<{ name: string; patch: Partial<SiteSettings> }> = [
  {
    name: 'الأزرق الملكي (الافتراضي)',
    patch: {
      primaryColor: '#4f46e5',
      secondaryColor: '#2563eb',
      accentColor: '#0284c7',
      backgroundColor: '#f8fafc',
      cardColor: '#ffffff',
      textColor: '#0f172a',
      heroGradientFrom: '#4f46e5',
      heroGradientTo: '#7c3aed',
    },
  },
  {
    name: 'الأخضر الزمردي الأكاديمي',
    patch: {
      primaryColor: '#059669',
      secondaryColor: '#0d9488',
      accentColor: '#0284c7',
      backgroundColor: '#f0fdf4',
      cardColor: '#ffffff',
      textColor: '#064e3b',
      heroGradientFrom: '#065f46',
      heroGradientTo: '#0d9488',
    },
  },
  {
    name: 'العنبر الكلاسيكي الدافئ',
    patch: {
      primaryColor: '#b45309',
      secondaryColor: '#d97706',
      accentColor: '#dc2626',
      backgroundColor: '#fffbeb',
      cardColor: '#ffffff',
      textColor: '#1c1917',
      heroGradientFrom: '#92400e',
      heroGradientTo: '#d97706',
    },
  },
  {
    name: 'الأردوازي الداكن الاحترافي',
    patch: {
      primaryColor: '#38bdf8',
      secondaryColor: '#0284c7',
      accentColor: '#818cf8',
      backgroundColor: '#0f172a',
      cardColor: '#1e293b',
      textColor: '#f8fafc',
      heroGradientFrom: '#0f172a',
      heroGradientTo: '#1e3a8a',
    },
  },
];

export function SiteCustomizerPanel() {
  const { settings, updateSettingsLocally, refreshSettings } = useApp();
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  const handleChange = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    updateSettingsLocally({ [key]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedNotice('تم حفظ مظهر ومحتوى الموقع وتطبيقه على جميع الصفحات');
        setTimeout(() => setSavedNotice(''), 4000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const res = await fetch('/api/settings/reset', { method: 'POST' });
    if (res.ok) {
      updateSettingsLocally(INITIAL_SETTINGS);
      await refreshSettings();
      setSavedNotice('تمت استعادة الإعدادات الافتراضية للموقع');
      setTimeout(() => setSavedNotice(''), 4000);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            <span>تخصيص شكل الموقع والعناوين والخطوط</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            أي تعديل تجريه هنا ينعكس فوراً على كامل الموقع ويُحفظ في قاعدة البيانات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Theme Presets */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">قوالب ألوان جاهزة</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => updateSettingsLocally(preset.patch)}
              className="p-3 border border-slate-200 rounded-lg bg-white hover:border-indigo-400 text-right transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="w-5 h-5 rounded"
                  style={{ backgroundColor: preset.patch.primaryColor }}
                />
                <span
                  className="w-5 h-5 rounded"
                  style={{ backgroundColor: preset.patch.heroGradientTo }}
                />
                <span
                  className="w-5 h-5 rounded border border-slate-200"
                  style={{ backgroundColor: preset.patch.backgroundColor }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-800">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Colors & Typography */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900">ألوان الموقع والواجهة</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['primaryColor', 'اللون الرئيسي'],
              ['secondaryColor', 'اللون الثانوي'],
              ['heroGradientFrom', 'بداية تدرج الهيرو'],
              ['heroGradientTo', 'نهاية تدرج الهيرو'],
              ['backgroundColor', 'لون خلفية الموقع'],
              ['cardColor', 'لون البطاقات'],
              ['textColor', 'لون النصوص'],
              ['accentColor', 'لون التمييز'],
            ].map(([key, label]) => {
              const k = key as keyof SiteSettings;
              return (
                <div key={key} className="flex items-center justify-between gap-2 border border-slate-100 p-2 rounded-lg">
                  <label htmlFor={`color-${key}`} className="text-xs text-slate-700">
                    {label}
                  </label>
                  <input
                    id={`color-${key}`}
                    type="color"
                    value={String(settings[k])}
                    onChange={(e) => handleChange(k, e.target.value as never)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900">الخطوط والأبعاد والأقسام</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">نوع الخط</label>
              <select
                value={settings.fontFamily}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="Cairo">Cairo (كايرو)</option>
                <option value="Tajawal">Tajawal (تجول)</option>
                <option value="Almarai">Almarai (المراعي)</option>
                <option value="IBM Plex Mono">IBM Plex Mono</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">حجم الخط العام</label>
              <select
                value={settings.baseFontSize}
                onChange={(e) => handleChange('baseFontSize', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="14px">صغير (14px)</option>
                <option value="15px">متوسط (15px)</option>
                <option value="16px">قياسي (16px)</option>
                <option value="18px">كبير (18px)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">انحناء الحواف</label>
              <select
                value={settings.borderRadius}
                onChange={(e) => handleChange('borderRadius', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="0px">حواف حادة (0px)</option>
                <option value="6px">بسيط (6px)</option>
                <option value="12px">متوازن (12px)</option>
                <option value="20px">مستدير (20px)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-700">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showStats}
                onChange={(e) => handleChange('showStats', e.target.checked)}
              />
              <span>إظهار شريط الإحصائيات</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showFeatures}
                onChange={(e) => handleChange('showFeatures', e.target.checked)}
              />
              <span>إظهار قسم الميزات</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showCta}
                onChange={(e) => handleChange('showCta', e.target.checked)}
              />
              <span>إظهار قسم الدعوة للانضمام</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              شريط تنبيه علوي اختياري (يدعم HTML)
            </label>
            <input
              type="text"
              value={settings.bannerNotice}
              onChange={(e) => handleChange('bannerNotice', e.target.value)}
              placeholder="مثال: التسجيل مفتوح لدورة القدرات المجانية"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            />
          </div>
        </div>
      </div>

      {/* Site Copy & Headings */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900">تعديل العناوين والنصوص والإحصائيات</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">اسم المنصة</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">عنوان الهيرو الرئيسي</label>
            <input
              type="text"
              value={settings.heroTitle}
              onChange={(e) => handleChange('heroTitle', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">وصف الهيرو</label>
            <textarea
              rows={2}
              value={settings.heroSubtitle}
              onChange={(e) => handleChange('heroSubtitle', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">نص الزر الأساسي</label>
            <input
              type="text"
              value={settings.heroPrimaryBtn}
              onChange={(e) => handleChange('heroPrimaryBtn', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">نص الزر الثانوي</label>
            <input
              type="text"
              value={settings.heroSecondaryBtn}
              onChange={(e) => handleChange('heroSecondaryBtn', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">عنوان قسم الميزات</label>
            <input
              type="text"
              value={settings.featuresTitle}
              onChange={(e) => handleChange('featuresTitle', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">عنوان قسم الدعوة للانضمام</label>
            <input
              type="text"
              value={settings.ctaTitle}
              onChange={(e) => handleChange('ctaTitle', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">نص الفوتر</label>
            <input
              type="text"
              value={settings.footerText}
              onChange={(e) => handleChange('footerText', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">حقوق النشر</label>
            <input
              type="text"
              value={settings.copyrightText}
              onChange={(e) => handleChange('copyrightText', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">رقم 1</label>
            <input
              type="text"
              value={settings.stat1Value}
              onChange={(e) => handleChange('stat1Value', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">وصف 1</label>
            <input
              type="text"
              value={settings.stat1Label}
              onChange={(e) => handleChange('stat1Label', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">رقم 2</label>
            <input
              type="text"
              value={settings.stat2Value}
              onChange={(e) => handleChange('stat2Value', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">وصف 2</label>
            <input
              type="text"
              value={settings.stat2Label}
              onChange={(e) => handleChange('stat2Label', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">رقم 3</label>
            <input
              type="text"
              value={settings.stat3Value}
              onChange={(e) => handleChange('stat3Value', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">وصف 3</label>
            <input
              type="text"
              value={settings.stat3Label}
              onChange={(e) => handleChange('stat3Label', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            CSS مخصص متقدم (Custom CSS)
          </label>
          <textarea
            rows={3}
            dir="ltr"
            value={settings.customCss}
            onChange={(e) => handleChange('customCss', e.target.value)}
            placeholder="/* مثال: h1 { letter-spacing: 0.02em; } */"
            className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50"
          />
        </div>
      </div>
    </form>
  );
}
