import { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser } from '../api';
import {
  UserCircle,
  Plus,
  Trash2,
  Edit,
  Shield,
  X,
} from 'lucide-react';

const roleLabels = {
  admin: 'مدير النظام',
  design: 'إدارة التصميم',
  execution: 'إدارة التنفيذ',
  accounting: 'إدارة الحسابات',
  pricing: 'إدارة التسعير',
  purchasing: 'إدارة المشتريات',
  sales: 'التسويق والمبيعات',
  client: 'عميل',
};

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  design: 'bg-purple-100 text-purple-800',
  execution: 'bg-green-100 text-green-800',
  accounting: 'bg-blue-100 text-blue-800',
  pricing: 'bg-cyan-100 text-cyan-800',
  purchasing: 'bg-amber-100 text-amber-800',
  sales: 'bg-pink-100 text-pink-800',
  client: 'bg-slate-100 text-slate-800',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      await createUser(form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'sales', phone: '' });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'حدث خطأ في إنشاء المستخدم');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.user) return;
    try {
      await deleteUser(deleteModal.user.id);
      setUsers(users.filter(u => u.id !== deleteModal.user.id));
      setDeleteModal({ open: false, user: null });
    } catch (error) {
      alert(error.response?.data?.error || 'حدث خطأ في حذف المستخدم');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المستخدمين</h1>
          <p className="text-slate-500">إدارة حسابات الموظفين</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          مستخدم جديد
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">المستخدم</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">البريد</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">الهاتف</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">الصلاحية</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">تاريخ الإنشاء</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-slate-600">{user.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(user.created_at).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setDeleteModal({ open: true, user })}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create user modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">مستخدم جديد</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الصلاحية</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                >
                  {Object.entries(roleLabels).filter(([key]) => key !== 'client').map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الهاتف</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">حذف المستخدم</h3>
            <p className="text-slate-500 mb-6">
              هل أنت متأكد من حذف المستخدم "{deleteModal.user.name}"؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                حذف
              </button>
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
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