import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClient, createClient, updateClient } from '../api';
import { ArrowRight, Save } from 'lucide-react';

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchClient();
    }
  }, [id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const res = await getClient(id);
      setForm({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        notes: res.data.notes || '',
      });
    } catch (error) {
      alert('حدث خطأ في تحميل بيانات العميل');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateClient(id, form);
      } else {
        await createClient(form);
      }
      navigate('/clients');
    } catch (error) {
      alert(error.response?.data?.error || 'حدث خطأ في حفظ البيانات');
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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {isEditing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              الاسم <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              رقم الهاتف <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              العنوان
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ملاحظات
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/clients')}
              className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}