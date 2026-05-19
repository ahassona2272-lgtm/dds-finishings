import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClients, deleteClient } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building2,
  Trash2,
  Edit,
  ChevronLeft,
} from 'lucide-react';

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, client: null });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await getClients();
      setClients(res.data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.client) return;
    try {
      await deleteClient(deleteModal.client.id);
      setClients(clients.filter(c => c.id !== deleteModal.client.id));
      setDeleteModal({ open: false, client: null });
    } catch (error) {
      alert(error.response?.data?.error || 'حدث خطأ أثناء الحذف');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    (client.phone && client.phone.includes(search)) ||
    (client.email && client.email.toLowerCase().includes(search.toLowerCase()))
  );

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
          <h1 className="text-2xl font-bold text-slate-900">العملاء</h1>
          <p className="text-slate-500">إدارة بيانات العملاء</p>
        </div>
        {user?.role === 'admin' || user?.role === 'sales' || user?.role === 'accounting' ? (
          <Link
            to="/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            إضافة عميل
          </Link>
        ) : null}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف أو البريد..."
            className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Clients grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 card-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{client.name}</h3>
                    <p className="text-sm text-slate-500">{client.project_count} مشروع</p>
                  </div>
                </div>
                {(user?.role === 'admin' || user?.role === 'sales') && (
                  <div className="flex gap-1">
                    <Link
                      to={`/clients/${client.id}`}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => setDeleteModal({ open: true, client })}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="flex items-center gap-2 text-slate-600 hover:text-primary-600"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{client.phone}</span>
                  </a>
                )}
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-2 text-slate-600 hover:text-primary-600"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{client.email}</span>
                  </a>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm truncate">{client.address}</span>
                  </div>
                )}
              </div>

              <Link
                to={`/projects?client=${client.id}`}
                className="mt-4 flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                عرض المشاريع
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">لا يوجد عملاء</p>
            {user?.role === 'admin' && (
              <Link
                to="/clients/new"
                className="inline-flex items-center gap-2 mt-4 text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-4 h-4" />
                أضف أول عميل
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">حذف العميل</h3>
            <p className="text-slate-500 mb-6">
              هل أنت متأكد من حذف العميل "{deleteModal.client.name}"؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                حذف
              </button>
              <button
                onClick={() => setDeleteModal({ open: false, client: null })}
                className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}