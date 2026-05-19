import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getSiteReports, createSiteReport, getProjects, uploadReportImages } from '../api';
import { HardHat, Plus, Upload, X, Image } from 'lucide-react';

export default function SiteReports() {
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    project_id: searchParams.get('project') || '',
    title: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const params = {};
      if (searchParams.get('project')) params.project_id = searchParams.get('project');
      const [reportsRes, projectsRes] = await Promise.all([
        getSiteReports(params),
        getProjects(),
      ]);
      setReports(reportsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_id || !form.title) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      const res = await createSiteReport(form);
      setShowModal(false);
      setForm({ project_id: searchParams.get('project') || '', title: '', description: '' });
      // Open upload modal for images
      setUploading(res.data.id);
    } catch (error) {
      alert(error.response?.data?.error || 'حدث خطأ في إنشاء التقرير');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (reportId, files) => {
    setUploading(reportId);
    try {
      await uploadReportImages(reportId, files);
      setUploading(null);
      fetchData();
    } catch (error) {
      alert('حدث خطأ في رفع الصور');
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">تقارير الموقع</h1>
          <p className="text-slate-500">إدارة تقارير سير العمل</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          تقرير جديد
        </button>
      </div>

      {/* Reports list */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">{report.title}</h3>
                <p className="text-sm text-slate-500">{report.project_name}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                report.status === 'approved' ? 'bg-green-100 text-green-800' :
                report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                report.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {report.status === 'draft' ? 'مسودة' : report.status === 'submitted' ? 'مُرسل' : report.status === 'approved' ? 'معتمد' : 'مرفوض'}
              </span>
            </div>

            {report.description && (
              <p className="text-slate-600 mb-4">{report.description}</p>
            )}

            {report.images && JSON.parse(report.images)?.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {JSON.parse(report.images).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt=""
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{report.created_by_name}</span>
                <span>•</span>
                <span>{new Date(report.created_at).toLocaleDateString('ar-EG')}</span>
              </div>

              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span className="text-sm">رفع صور</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(report.id, Array.from(e.target.files))}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="text-center py-12">
          <HardHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">لا توجد تقارير</p>
        </div>
      )}

      {/* Create report modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">تقرير جديد</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المشروع</label>
                <select
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  required
                >
                  <option value="">اختر المشروع</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">عنوان التقرير</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}