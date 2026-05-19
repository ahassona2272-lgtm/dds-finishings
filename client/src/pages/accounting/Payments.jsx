import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPayments, createPayment, getAccountingSummary, getProjects } from '../api';
import { Receipt, Plus, Download, X, ArrowUpLeft, ArrowDownLeft } from 'lucide-react';

export default function Payments() {
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState(searchParams.get('project') || '');
  const [form, setForm] = useState({
    project_id: searchParams.get('project') || '',
    type: 'installment',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const params = {};
      if (filter) params.project_id = filter;
      const [paymentsRes, summaryRes, projectsRes] = await Promise.all([
        getPayments(params),
        getAccountingSummary(),
        getProjects(),
      ]);
      setPayments(paymentsRes.data);
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
    if (!form.project_id || !form.amount) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      await createPayment(form);
      setShowModal(false);
      setForm({
        project_id: searchParams.get('project') || '',
        type: 'installment',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'حدث خطأ في تسجيل الدفع');
    } finally {
      setSaving(false);
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
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm">إجمالي التحصيل</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {summary.totalReceived?.toLocaleString()} ج.م
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm">إجمالي المصروفات</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {summary.totalExpenses?.toLocaleString()} ج.م
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm">الرصيد</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {summary.balance?.toLocaleString()} ج.م
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm">طلبات صرف معلقة</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary.pendingPayments}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المدفوعات</h1>
          <p className="text-slate-500">سجل المدفوعات والمصروفات</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة دفع
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-4">
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

      {/* Payments table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">النوع</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">المشروع</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">الوصف</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">التاريخ</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {payment.type === 'installment' ? (
                        <ArrowUpLeft className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        payment.type === 'installment' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {payment.type === 'installment' ? 'تحصيل' : payment.type === 'expense' ? 'مصروف' : 'استرداد'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-900">{payment.project_name}</td>
                  <td className="px-6 py-4 text-slate-600">{payment.description || '-'}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(payment.date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${
                      payment.type === 'installment' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {payment.type === 'expense' ? '-' : '+'}{payment.amount?.toLocaleString()} ج.م
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">لا توجد مدفوعات</p>
          </div>
        )}
      </div>

      {/* Add payment modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">إضافة دفع</h2>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">النوع</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="installment">تحصيل</option>
                  <option value="expense">مصروف</option>
                  <option value="refund">استرداد</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  required
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