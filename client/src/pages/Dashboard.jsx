import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../api';
import {
  Users,
  FolderKanban,
  Receipt,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
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
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">مرحباً، {user?.name}</h1>
        <p className="text-primary-100">إليك ملخص أداء نظام DDS للتشطيبات</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">إجمالي المشاريع</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalProjects || 0}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">إجمالي العملاء</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalClients || 0}</p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">إجمالي الإيرادات</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {stats?.totalRevenue?.toLocaleString() || 0} ج.م
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">مهام التصميم</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.pendingDesignTasks || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Projects by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">المشاريع حسب الحالة</h2>
          <div className="space-y-3">
            {stats?.projectsByStatus?.length > 0 ? (
              stats.projectsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">لا توجد مشاريع</p>
            )}
          </div>
        </div>

        {/* Recent projects */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">آخر المشاريع</h2>
            <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              عرض الكل
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentProjects?.length > 0 ? (
              stats.recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{project.name}</p>
                    <p className="text-sm text-slate-500">{project.client_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                    {statusLabels[project.status]}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">لا توجد مشاريع</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/clients/new"
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-primary-300 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">إضافة عميل جديد</h3>
              <p className="text-sm text-slate-500">سجل بيانات العميل</p>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 mr-auto" />
          </div>
        </Link>

        <Link
          to="/projects"
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-secondary-300 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
              <FolderKanban className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">إنشاء مشروع</h3>
              <p className="text-sm text-slate-500">أضف مشروع جديد</p>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 mr-auto" />
          </div>
        </Link>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{stats?.pendingPayments || 0}</p>
              <p className="text-sm text-slate-500">طلبات صرف معلقة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}