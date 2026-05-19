import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getDesignTasks, createDesignTask, updateDesignTask, getDesigners, getProjects, uploadDesignFile } from '../api';
import { Palette, Plus, Upload, Check, X, Eye } from 'lucide-react';

const statusLabels = {
  pending: 'قيد الانتظار',
  in_progress: 'جاري العمل',
  review: 'مراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  review: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function DesignTasks() {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({
    project_id: searchParams.get('project') || '',
    assigned_to: '',
    title: '',
    description: '',
    deadline: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [tasksRes, designersRes, projectsRes] = await Promise.all([
        getDesignTasks(searchParams.get('project') ? { project_id: searchParams.get('project') } : {}),
        getDesigners(),
        getProjects(),
      ]);
      setTasks(tasksRes.data);
      setDesigners(designersRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_id || !form.assigned_to || !form.title) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      await createDesignTask(form);
      setShowModal(false);
      setForm({ project_id: searchParams.get('project') || '', assigned_to: '', title: '', description: '', deadline: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'حدث خطأ في إنشاء المهمة');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateDesignTask(taskId, { status: newStatus });
      fetchData();
    } catch (error) {
      alert('حدث خطأ في تحديث الحالة');
    }
  };

  const handleFileUpload = async (taskId, file) => {
    setUploading(taskId);
    try {
      await uploadDesignFile(taskId, file);
      fetchData();
    } catch (error) {
      alert('حدث خطأ في رفع الملف');
    } finally {
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
          <h1 className="text-2xl font-bold text-slate-900">مهام التصميم</h1>
          <p className="text-slate-500">إدارة مهام التصميم للمشاريع</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          مهمة جديدة
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl"
        >
          <option value="">كل الحالات</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Tasks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.filter(t => !filter || t.status === filter).map((task) => (
          <div key={task.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Palette className="w-4 h-4 text-purple-600" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                  {statusLabels[task.status]}
                </span>
              </div>
              {task.deadline && (
                <span className="text-xs text-slate-500">
                  {new Date(task.deadline).toLocaleDateString('ar-EG')}
                </span>
              )}
            </div>

            <h3 className="font-semibold text-slate-900 mb-1">{task.title}</h3>
            <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.description}</p>

            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
              <span>{task.project_name}</span>
              <span>•</span>
              <span>{task.assigned_to_name}</span>
            </div>

            {/* File upload / preview */}
            <div className="mb-4">
              {task.file_url ? (
                <a
                  href={task.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-primary-600 hover:bg-slate-100"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">عرض الملف المرفوع</span>
                </a>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">رفع ملف التصميم</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.ai,.psd"
                    className="hidden"
                    onChange={(e) => handleFileUpload(task.id, e.target.files[0])}
                    disabled={uploading === task.id}
                  />
                </label>
              )}
            </div>

            {/* Status actions */}
            <div className="flex gap-2">
              {task.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(task.id, 'in_progress')}
                  className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ابدأ العمل
                </button>
              )}
              {task.status === 'in_progress' && (
                <button
                  onClick={() => handleStatusChange(task.id, 'review')}
                  className="flex-1 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  للإدارة
                </button>
              )}
              {task.status === 'review' && (
                <>
                  <button
                    onClick={() => handleStatusChange(task.id, 'approved')}
                    className="flex-1 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    اعتماد
                  </button>
                  <button
                    onClick={() => handleStatusChange(task.id, 'rejected')}
                    className="py-2 px-3 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    رفض
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <Palette className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">لا توجد مهام تصميم</p>
        </div>
      )}

      {/* Create task modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">مهمة تصميم جديدة</h2>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">المصمم</label>
                <select
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  required
                >
                  <option value="">اختر المصمم</option>
                  {designers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">عنوان المهمة</label>
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
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ التسليم</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'جاري الإنشاء...' : 'إنشاء المهمة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}