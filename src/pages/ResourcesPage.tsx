import React, { useEffect, useState } from 'react';
import { Search, Download, Upload, Globe, FileText, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  fsGetResources,
  fsUploadFile,
  fsGetUploadedFile,
  type ResourceRecord,
} from '../services/firestoreService';
import { resolveVirtualFile, resolveSandboxedSsrf } from '../utils/labSandbox';

export function ResourcesPage() {
  const { settings } = useApp();
  const [items, setItems] = useState<ResourceRecord[]>([]);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [category, setCategory] = useState('الكل');
  const [sqlError, setSqlError] = useState('');
  const [previewFile, setPreviewFile] = useState<{
    file: string;
    resolvedPath?: string;
    content?: string;
    error?: string;
  } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('http://169.254.169.254/latest/meta-data/');
  const [importResult, setImportResult] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('summary.svg');
  const [uploadContent, setUploadContent] = useState(
    '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(\'SVG XSS\')"><text y="20">ملف تعليمي</text></svg>',
  );
  const [uploadResult, setUploadResult] = useState<{ name: string; blobUrl: string } | null>(null);

  const categories = ['الكل', 'القدرات الكمي', 'القدرات اللفظي', 'التحصيلي'];

  const loadResources = async (searchQ: string, cat: string) => {
    setSqlError('');
    try {
      const data = await fsGetResources(searchQ, cat);
      if (data.sqlError) {
        setSqlError(`${data.sqlError} | Query: ${data.debugQuery}`);
        setItems([]);
      } else {
        setItems(data.items);
      }
    } catch {
      setSqlError('تعذر الاتصال بقاعدة البيانات');
    }
  };

  useEffect(() => {
    loadResources('', category);
  }, [category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query);
    loadResources(query, category);
  };

  const openFilePreview = async (fileName: string) => {
    const res = resolveVirtualFile(fileName);
    if (res.found) {
      setPreviewFile({ file: fileName, resolvedPath: res.resolvedPath, content: res.content });
      return;
    }
    const uploaded = await fsGetUploadedFile(fileName);
    if (uploaded !== null) {
      setPreviewFile({
        file: fileName,
        resolvedPath: `/firestore/uploads/${fileName}`,
        content: uploaded,
      });
      return;
    }
    setPreviewFile({
      file: fileName,
      resolvedPath: res.resolvedPath,
      error: `الملف غير موجود: ${res.resolvedPath}`,
    });
  };

  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = resolveSandboxedSsrf(importUrl);
    setImportResult(`${data.title}\n\n${data.body}`);
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    const savedName = await fsUploadFile(uploadName, uploadContent);
    const mime = savedName.endsWith('.svg')
      ? 'image/svg+xml'
      : savedName.endsWith('.html')
        ? 'text/html'
        : 'text/plain';
    const blobUrl = URL.createObjectURL(new Blob([uploadContent], { type: mime }));
    setUploadResult({ name: savedName, blobUrl });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: settings.textColor }}>
            مصادر التعلم والملخصات
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            ابحث في مكتبة الملفات والملخصات وبنوك الأسئلة أو استورد مصادر خارجية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0"
          >
            <Globe className="w-4 h-4" />
            <span>استيراد من رابط</span>
          </button>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white rounded-lg whitespace-nowrap shrink-0"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <Upload className="w-4 h-4" />
            <span>رفع ملف تعليمي</span>
          </button>
        </div>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن ملخص، مادة، أو جرب UNION SQLi..."
              aria-label="بحث في المصادر"
              className="w-full pr-10 pl-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg whitespace-nowrap shrink-0"
            style={{ backgroundColor: settings.secondaryColor }}
          >
            بحث
          </button>
        </form>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                category === cat
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Intentionally vulnerable Reflected XSS echo */}
      {submittedQuery && (
        <div className="mb-6 p-3.5 rounded-lg bg-slate-100 border border-slate-200 text-sm text-slate-700">
          <span>نتائج البحث عن: </span>
          <span
            className="font-bold"
            dangerouslySetInnerHTML={{ __html: submittedQuery }}
          />
        </div>
      )}

      {sqlError && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-mono overflow-x-auto">
          {sqlError}
        </div>
      )}

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <article
            key={`${item.id}-${idx}`}
            className="p-6 border border-slate-200 flex flex-col justify-between"
            style={{ backgroundColor: settings.cardColor, borderRadius: settings.borderRadius }}
          >
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <span className="font-semibold" style={{ color: settings.primaryColor }}>
                  {item.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>{item.type}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{item.downloads} تنزيل</span>
              </div>
              <h2 className="text-base font-bold mb-2" style={{ color: settings.textColor }}>
                {item.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{item.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 truncate">{item.author}</span>
              <button
                type="button"
                onClick={() => openFilePreview(item.file_name || 'qudrat_quant_summary.txt')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0"
                style={{ color: settings.primaryColor }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>معاينة الملف</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* File Preview / Path Traversal Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">قارئ الملفات التعليمية</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                aria-label="إغلاق"
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={previewFile.file}
                onChange={(e) => setPreviewFile({ ...previewFile, file: e.target.value })}
                aria-label="اسم الملف أو المسار"
                className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => openFilePreview(previewFile.file)}
                className="px-4 py-2 text-xs font-semibold text-white rounded-lg"
                style={{ backgroundColor: settings.primaryColor }}
              >
                فتح المسار
              </button>
            </div>

            {previewFile.resolvedPath && (
              <p className="text-xs font-mono text-slate-500 mb-2" dir="ltr">
                Resolved: {previewFile.resolvedPath}
              </p>
            )}

            <pre
              className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-72"
              dir="auto"
            >
              {previewFile.content || previewFile.error}
            </pre>
          </div>
        </div>
      )}

      {/* Import URL (SSRF) Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">استيراد مصدر تعليمي من رابط خارجي</h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                aria-label="إغلاق"
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleImportUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  رابط المصدر (URL)
                </label>
                <input
                  type="text"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg"
                style={{ backgroundColor: settings.primaryColor }}
              >
                جلب المحتوى
              </button>
            </form>
            {importResult && (
              <pre
                className="mt-4 p-4 bg-slate-900 text-emerald-300 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap"
                dir="ltr"
              >
                {importResult}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Upload File (Unrestricted Upload) Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">رفع ملف تعليمي جديد</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                aria-label="إغلاق"
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUploadFile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">اسم الملف</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">محتوى الملف</label>
                <textarea
                  rows={4}
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg"
                style={{ backgroundColor: settings.primaryColor }}
              >
                رفع الملف إلى قاعدة البيانات
              </button>
            </form>
            {uploadResult && (
              <div className="mt-4 p-3 rounded-lg bg-slate-100 text-xs font-mono flex items-center justify-between gap-2" dir="ltr">
                <span>Uploaded to Firestore: /uploads/{uploadResult.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      openFilePreview(uploadResult.name);
                    }}
                    className="underline text-slate-700"
                  >
                    معاينة
                  </button>
                  <a
                    href={uploadResult.blobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-indigo-600"
                  >
                    فتح الملف
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
