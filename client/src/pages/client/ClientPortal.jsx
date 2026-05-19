import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, getProject } from '../api';
import {
  LayoutDashboard,
  FolderKanban,
  Image,
  Palette,
  MessageSquare,
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
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

export default function ClientPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      // Filter projects for this client (in real app, server would filter)
      setProjects(res.data.slice(0, 3)); // Show first 3 for demo
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId) => {
    try {
      const res = await getProject(projectId);
      setSelectedProject(res.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const handleProjectSelect = (projectId) => {
    fetchProjectDetails(projectId);
    setActiveTab('overview');
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
        <p className="text-primary-100">يمكنك متابعة تفاصيل مشاريعك والتواصل مع الفريق</p>
      </div>

      {!selectedProject ? (
        <>
          {/* Projects list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectSelect(project.id)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-right card-hover"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                    <FolderKanban className="w-6 h-6 text-white" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}>
                    {statusLabels[project.status]}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{project.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{project.client_name}</p>
                {project.total_value > 0 && (
                  <p className="text-lg font-bold text-primary-600">
                    {project.total_value.toLocaleString()} ج.م
                  </p>
                )}
              </button>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-12">
              <FolderKanban className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">لا توجد لديك مشاريع حالياً</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Back button */}
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>العودة للمشاريع</span>
          </button>

          {/* Project header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedProject.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedProject.status]}`}>
                    {statusLabels[selectedProject.status]}
                  </span>
                  {selectedProject.total_value > 0 && (
                    <span className="text-lg font-bold text-primary-600">
                      {selectedProject.total_value.toLocaleString()} ج.م
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate(`/messages?project=${selectedProject.id}`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
              >
                <MessageSquare className="w-5 h-5" />
                تواصل مع الفريق
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="flex overflow-x-auto border-b border-slate-200">
              {[
                { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
                { id: 'design', label: 'التصميمات', icon: Palette },
                { id: 'images', label: 'صور الموقع', icon: Image },
              ].map((tab) => (
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
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Unit Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-slate-900">معلومات الوحدة</h3>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      {selectedProject.unit_type && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                            <FolderKanban className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">نوع الوحدة</p>
                            <p className="font-medium text-slate-900">{selectedProject.unit_type}</p>
                          </div>
                        </div>
                      )}
                      {selectedProject.unit_area && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">المساحة</p>
                            <p className="font-medium text-slate-900">{selectedProject.unit_area} م²</p>
                          </div>
                        </div>
                      )}
                      {selectedProject.address && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">العنوان</p>
                            <p className="font-medium text-slate-900">{selectedProject.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-slate-900">بيانات التواصل</h3>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      {selectedProject.client_phone && (
                        <a href={`tel:${selectedProject.client_phone}`} className="flex items-center gap-3 text-slate-700 hover:text-primary-600">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                            <Phone className="w-5 h-5 text-slate-600" />
                          </div>
                          <span>{selectedProject.client_phone}</span>
                        </a>
                      )}
                      {selectedProject.client_email && (
                        <a href={`mailto:${selectedProject.client_email}`} className="flex items-center gap-3 text-slate-700 hover:text-primary-600">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                            <Mail className="w-5 h-5 text-slate-600" />
                          </div>
                          <span>{selectedProject.client_email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'design' && (
                <div className="space-y-4">
                  {selectedProject.designTasks?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedProject.designTasks.map((task) => (
                        <div key={task.id} className="bg-slate-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-slate-900">{task.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === 'approved' ? 'bg-green-100 text-green-800' :
                              task.status === 'review' ? 'bg-purple-100 text-purple-800' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {task.status === 'approved' ? 'معتمد' : 
                               task.status === 'review' ? 'قيد المراجعة' :
                               task.status === 'in_progress' ? 'جاري العمل' : 'قيد الانتظار'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mb-3">{task.description}</p>
                          {task.file_url && (
                            <a
                              href={task.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-primary-600 hover:underline"
                            >
                              عرض التصميم
                              <ChevronLeft className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-slate-500">لا توجد تصميمات حالياً</p>
                  )}
                </div>
              )}

              {activeTab === 'images' && (
                <div className="space-y-4">
                  {selectedProject.siteImages?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedProject.siteImages.map((img) => (
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
                    <p className="text-center py-8 text-slate-500">لا توجد صور حالياً</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}