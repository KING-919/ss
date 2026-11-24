import React from 'react';
import { useApp } from '../context/AppContext';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { settings } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div>
            <h3 className="text-lg font-bold text-white mb-3">{settings.siteName}</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              {settings.footerText}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/study-plans"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/study-plans');
                  }}
                  className="hover:text-white transition-colors"
                >
                  خطط المذاكرة
                </a>
              </li>
              <li>
                <a
                  href="/resources"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/resources');
                  }}
                  className="hover:text-white transition-colors"
                >
                  المصادر التعليمية
                </a>
              </li>
              <li>
                <a
                  href="/announcements"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/announcements');
                  }}
                  className="hover:text-white transition-colors"
                >
                  الإعلانات
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/contact');
                  }}
                  className="hover:text-white transition-colors"
                >
                  تواصل معنا
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">الحساب والإشعارات</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/notifications"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/notifications');
                  }}
                  className="hover:text-white transition-colors"
                >
                  مركز الإشعارات
                </a>
              </li>
              <li>
                <a
                  href="/achievements"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/achievements');
                  }}
                  className="hover:text-white transition-colors"
                >
                  لوحة الإنجازات
                </a>
              </li>
              <li>
                <a
                  href="/dashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/dashboard');
                  }}
                  className="hover:text-white transition-colors"
                >
                  لوحة التحكم
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>{settings.copyrightText}</p>
          <p>ثانوية العارضة التعليمية</p>
        </div>
      </div>
    </footer>
  );
}
