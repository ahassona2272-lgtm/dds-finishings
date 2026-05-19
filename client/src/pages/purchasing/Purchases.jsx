import { useState, useEffect } from 'react';
import { getPurchases, createPurchase, updatePurchase, deletePurchase, getPurchaseSummary, getProjects } from '../api';
import { ShoppingCart, Plus, X, Truck, CheckCircle } from 'lucide-react';

const statusLabels = {
  pending: 'قيد الانتظار',
  ordered: 'تم الطلب',
  received: 'تم الاستلام',
  cancelled: 'ملغي',
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  ordered: 'bg-blue-100 text-blue-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({
    project_id: '',
    item_name: '',
    quantity: '',
    unit: '',
    unit_price: '',
    supplier: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const params = {};
      if (filter) params.project_id = filter;
      const [purchasesRes, summaryRes, projectsRes] = await Promise.all([
        getPurchases(params),
        getPurchaseSummary(),
        getProjects(),
      ]);
      setPurchases(purchasesRes.data);
      setSummary(summaryRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_name) {
      alert('يرجى إدخال اسم الصنف');
      return;
    }

    setSaving(true);
    try {
      await createPurchase(form);
      setShowModal(false);
      setForm({ project_id: '', item_name: '', quantity: '', unit: '', unit_price: '', supplier: '', notes: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'حدث خطأ في إضافة المشتريات');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePurchase(id, { status: newStatus });
      fetchData();
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

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm">قيد الانتظار</p>
                <p className="text-xl font-bold text-slate-900">{summary.pending.count}</p>
                <p className="text-sm text-slate-500">{summary.pending.total?.toLocaleString()} ج.م</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm">تم الطلب</p>
                <p className="text-xl font-bold text-slate-900">{summary.ordered.count}</p>
                <p className="text-sm text-slate-500">{summary.ordered.total?.toLocaleString()} ج.م</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm">تم الاستلام</p>
                <p className="text-xl font-bold text-slate-900">{summary.received.count}</p>
                <p className="text-sm text-slate-500">{summary.received.total?.toLocaleString()} ج.م</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المشتريات</h1>
          <p className="text-slate-500">إدارة مشتريات المشاريع</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة مشتريات
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl"
        >
          <option value="">كل المشاريع</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Purchases list */}
      <div className="space-y-4">
        {purchases.map((purchase) => (
          <div key={purchase.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{purchase.item_name}</h3>
                <p className="text-sm text-slate-500">{purchase.project_name || 'بدون مشروع'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[purchase.status]}`}>
                {statusLabels[purchase.status]}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-slate-500">
                {purchase.quantity && <span>{purchase.quantity} {purchase.unit}</span>}
                {purchase.supplier && <span>المورد: {purchase.supplier}</span>}
              </div>
              <p className="text-xl font-bold text-primary-600">
                {purchase.total_price?.toLocaleString()} ج.م
              </p>
            </div>
            {purchase.status === 'pending' && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleStatusChange(purchase.id, 'ordered')}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  تم الطلب
                </button>
                <button
                  onClick={() => handleStatusChange(purchase.id, 'cancelled')}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  إلغاء
                </button>
              </div>
            )}
            {purchase.status === 'ordered' && (
              <div className="mt-4">
                <button
                  onClick={() => handleStatusChange(purchase.id, 'received')}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  تم الاستلام
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {purchases.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">لا توجد مشتريات</p>
        </div>
      )}

      {/* Add purchase modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">إضافة مشتريات</h2>
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
                >
                  <option value="">بدون مشروع</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الصنف <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.item_name}
                  onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الكمية</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الوحدة</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                    placeholder="متر، قطعة..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">سعر الوحدة</label>
                  <input
                    type="number"
                    value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المورد</label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}