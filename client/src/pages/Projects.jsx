import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProjects, createProject, deleteProject } from '../api';
import { getClients } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban,
  Plus,
  Search,
  Phone,
  Trash2,
  ChevronLeft,
  X,
} from 'lucide-react';

const statusLabels = {
  pending: 'قيد الانتظار',
  survey: 'المعاينة',
  design: 'التصميم',
  pricing: 'التسعير',
  contract: 'العقد',
  execution: 'التنفيذ',
  finished: 'مُنتهي',
  cancelled: 'ملغي',
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  survey: 'bg-blue-100 text-blue-800',
  design: 'bg-purple-100 text-purple-800',
  pricing: 'bg-cyan-100 text-cyan-800',
  contract: 'bg-indigo-100 text-indigo-800',
  execution: 'bg-green-100 text-green-800',
  finished: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Projects() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    client_id: '',
    unit_type: '',
    unit_area: '',
    unit_number: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, [searchParams]);

  const fetchProjects = async () => {
    try {
      const params = {};
      if (searchParams.get('client')) params.client_id = searchParams.get('client');
      const res = await getProjects(params);
      setProjects(res.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await getClients();
      setClients(res.data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newForm.name || !newForm.client_id) {
      alert('يرجى إدخال اسم المشروع واختيار العميل');
      return;
    }

    setSaving(true);
    try {
      await createProject(newForm);
      setShowNewModal(false);
      setNewForm({ name: '', client_id: '', unit_type: '', unit_area: '', unit_number: '', address: '' });
      fetchProjects();
    } catch (error) {
      alert(error.response?.data?.error || 'حدث خطأ في إنشاء المشروع');
    } finally {
      setSaving(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
      (project.client_name && project.client_name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المشاريع</h1>
          <p className="text-slate-500">إدارة مشاريع التشطيبات</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'sales' || user?.role === 'pricing') && (
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            مشروع جديد
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالمشروع أو العميل..."
            className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">كل الحالات</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Projects list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">المشروع</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">العميل</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">الحالة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">القيمة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                          <FolderKanban className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{project.name}</p>
                          {project.unit_number && (
                            <p className="text-sm text-slate-500">وحدة: {project.unit_number}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{project.client_name}</p>
                      {project.client_phone && (
                        <a href={`tel:${project.client_phone}`} className="text-sm text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {project.client_phone}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}>
                        {statusLabels[project.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {project.total_value?.toLocaleString() || '0'} ج.م
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                      >
                        عرض
                        <ChevronLeft className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <FolderKanban className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">لا توجد مشاريع</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New project modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">مشروع جديد</h2>
              <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  اسم المشروع <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  العميل <span className="text-red-500">*</span>
                </label>
                <select
                  value={newForm.client_id}
                  onChange={(e) => setNewForm({ ...newForm, client_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">اختر العميل</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نوع الوحدة</label>
                  <input
                    type="text"
                    value={newForm.unit_type}
                    onChange={(e) => setNewForm({ ...newForm, unit_type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="شقة / فيلا / مكتب..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المساحة (م²)</label>
                  <input
                    type="number"
                    value={newForm.unit_area}
                    onChange={(e) => setNewForm({ ...newForm, unit_area: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الوحدة</label>
                <input
                  type="text"
                  value={newForm.unit_number}
                  onChange={(e) => setNewForm({ ...newForm, unit_number: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
                <input
                  type="text"
                  value={newForm.address}
                  onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'جاري الإنشاء...' : 'إنشاء المشروع'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}