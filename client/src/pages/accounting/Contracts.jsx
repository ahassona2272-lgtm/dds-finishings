import { useState, useEffect } from 'react';
import { getContracts, createContract, updateContract, getProjects } from '../api';
import { FileText, Plus, X } from 'lucide-react';

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    project_id: '',
    contract_number: '',
    value: '',
    terms: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contractsRes, projectsRes] = await Promise.all([
        getContracts(),
        getProjects(),
      ]);
      setContracts(contractsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_id || !form.value) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      await createContract(form);
      setShowModal(false);
      setForm({ project_id: '', contract_number: '', value: '', terms: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'حدث خطأ في إنشاء العقد');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">العقود</h1>
          <p className="text-slate-500">إدارة عقود المشاريع</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          عقد جديد
        </button>
      </div>

      {/* Contracts list */}
      <div className="space-y-4">
        {contracts.map((contract) => (
          <div key={contract.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{contract.project_name}</h3>
                {contract.contract_number && (
                  <p className="text-sm text-slate-500">رقم العقد: {contract.contract_number}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                contract.status === 'signed' ? 'bg-green-100 text-green-800' :
                contract.status === 'sent' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {contract.status === 'signed' ? 'مُوقع' : contract.status === 'sent' ? 'مُرسل' : contract.status === 'draft' ? 'مسودة' : 'ملغي'}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-2xl font-bold text-primary-600">
                {contract.value?.toLocaleString()} ج.م
              </p>
              {contract.terms && (
                <p className="text-sm text-slate-500 max-w-md truncate">{contract.terms}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {contracts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">لا توجد عقود</p>
        </div>
      )}

      {/* Create contract modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">عقد جديد</h2>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم العقد</label>
                <input
                  type="text"
                  value={form.contract_number}
                  onChange={(e) => setForm({ ...form, contract_number: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">قيمة العقد</label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الشروط</label>
                <textarea
                  value={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'جاري الإنشاء...' : 'إنشاء العقد'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}