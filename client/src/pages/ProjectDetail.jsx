import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProject, updateProject } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Edit,
  FileText,
  Image,
  MessageSquare,
  Palette,
  HardHat,
  Receipt,
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

const taskStatusColors = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  review: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const taskStatusLabels = {
  pending: 'قيد الانتظار',
  in_progress: 'جاري العمل',
  review: 'مراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await getProject(id);
      setProject(res.data);
    } catch (error) {
      alert('حدث خطأ في تحميل المشروع');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateProject(id, { status: newStatus });
      setProject({ ...project, status: newStatus });
      setShowStatusModal(false);
    } catch (error) {
      alert('حدث خطأ في تحديث الحالة');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!project) return null;

  const tabs = [
    { id: 'details', label: 'التفاصيل', icon: FileText },
    { id: 'design', label: 'التصميم', icon: Palette },
    { id: 'reports', label: 'التقارير', icon: HardHat },
    { id: 'images', label: 'الصور', icon: Image },
    { id: 'payments', label: 'المدفوعات', icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
                {project.client_name && (
                  <Link to={`/clients/${project.client_id}`} className="text-primary-600 hover:underline">
                    {project.client_name}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'sales' || user?.role === 'pricing') && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
              >
                تغيير الحالة
              </button>
              <button
                onClick={() => navigate(`/messages?project=${project.id}`)}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex overflow-x-auto border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Project Info */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg text-slate-900">معلومات المشروع</h3>
                <div className="space-y-4">
                  {project.unit_type && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">نوع الوحدة</p>
                        <p className="font-medium text-slate-900">{project.unit_type}</p>
                      </div>
                    </div>
                  )}
                  {project.unit_area && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">المساحة</p>
                        <p className="font-medium text-slate-900">{project.unit_area} م²</p>
                      </div>
                    </div>
                  )}
                  {project.unit_number && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">رقم الوحدة</p>
                        <p className="font-medium text-slate-900">{project.unit_number}</p>
                      </div>
                    </div>
                  )}
                  {project.address && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">العنوان</p>
                        <p className="font-medium text-slate-900">{project.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg text-slate-900">معلومات العميل</h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-slate-900">{project.client_name}</p>
                  {project.client_phone && (
                    <a href={`tel:${project.client_phone}`} className="flex items-center gap-2 text-slate-600 hover:text-primary-600">
                      <Phone className="w-4 h-4" />
                      {project.client_phone}
                    </a>
                  )}
                  {project.client_email && (
                    <a href={`mailto:${project.client_email}`} className="flex items-center gap-2 text-slate-600 hover:text-primary-600">
                      <Mail className="w-4 h-4" />
                      {project.client_email}
                    </a>
                  )}
                  {project.client_address && (
                    <p className="text-slate-500">{project.client_address}</p>
                  )}
                </div>
              </div>

              {/* Contract */}
              {project.contract && (
                <div className="lg:col-span-2">
                  <h3 className="font-semibold text-lg text-slate-900 mb-4">العقد</h3>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {project.contract.contract_number || 'بدون رقم'}
                        </p>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                          {project.contract.value?.toLocaleString()} ج.م
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        project.contract.status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {project.contract.status === 'signed' ? 'مُوقع' : project.contract.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-slate-900">مهام التصميم</h3>
                {(user?.role === 'admin' || user?.role === 'design') && (
                  <Link
                    to={`/design/tasks?project=${project.id}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    إدارة المهام
                  </Link>
                )}
              </div>
              {project.designTasks?.length > 0 ? (
                <div className="space-y-3">
                  {project.designTasks.map((task) => (
                    <div key={task.id} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{task.title}</p>
                        <p className="text-sm text-slate-500">
                          {task.assigned_to_name} • {task.description?.substring(0, 50)}...
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${taskStatusColors[task.status]}`}>
                        {taskStatusLabels[task.status]}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">لا توجد مهام تصميم</p>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-slate-900">تقارير الموقع</h3>
                {(user?.role === 'admin' || user?.role === 'execution') && (
                  <Link
                    to={`/execution/reports?project=${project.id}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    إدارة التقارير
                  </Link>
                )}
              </div>
              {project.siteReports?.length > 0 ? (
                <div className="space-y-3">
                  {project.siteReports.map((report) => (
                    <div key={report.id} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-slate-900">{report.title}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          report.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          report.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{report.description}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {report.created_by_name} • {new Date(report.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">لا توجد تقارير</p>
              )}
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-slate-900">صور الموقع</h3>
                {(user?.role === 'admin' || user?.role === 'execution') && (
                  <Link
                    to={`/execution/images?project=${project.id}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    رفع صور
                  </Link>
                )}
              </div>
              {project.siteImages?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {project.siteImages.map((img) => (
                    <div key={img.id} className="aspect-square bg-slate-100 rounded-xl overflow-hidden">
                      <img
                        src={img.image_url}
                        alt={img.description}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">لا توجد صور</p>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-slate-900">المدفوعات</h3>
                {(user?.role === 'admin' || user?.role === 'accounting') && (
                  <Link
                    to={`/accounting/payments?project=${project.id}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    إدارة المدفوعات
                  </Link>
                )}
              </div>
              {project.payments?.length > 0 ? (
                <div className="space-y-3">
                  {project.payments.map((payment) => (
                    <div key={payment.id} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{payment.description || 'دفعة'}</p>
                        <p className="text-sm text-slate-500">{new Date(payment.date).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <p className={`font-bold ${payment.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                        {payment.type === 'expense' ? '-' : '+'}{payment.amount?.toLocaleString()} ج.م
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">لا توجد مدفوعات</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">تغيير حالة المشروع</h2>
              <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(statusLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    project.status === key
                      ? `${statusColors[key]} cursor-default`
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  disabled={project.status === key}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}