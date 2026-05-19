import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSiteImages, uploadSiteImages, getProjects } from '../api';
import { Image, Upload, X, Search } from 'lucide-react';

export default function SiteImages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [images, setImages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(searchParams.get('project') || '');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedProject]);

  const fetchData = async () => {
    try {
      const [imagesRes, projectsRes] = await Promise.all([
        selectedProject ? getSiteImages(selectedProject) : Promise.resolve({ data: [] }),
        getProjects(),
      ]);
      setImages(imagesRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!selectedProject) {
      alert('يرجى اختيار مشروع أولاً');
      return;
    }

    setUploading(true);
    try {
      await uploadSiteImages(selectedProject, files, description);
      setDescription('');
      fetchData();
    } catch (error) {
      alert('حدث خطأ في رفع الصور');
    } finally {
      setUploading(false);
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
          <h1 className="text-2xl font-bold text-slate-900">صور الموقع</h1>
          <p className="text-slate-500">رفع ومتابعة صور سير العمل</p>
        </div>
      </div>

      {/* Project filter */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl"
          >
            <option value="">كل المشاريع</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          <label className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 cursor-pointer">
            <Upload className="w-5 h-5" />
            <span>رفع صور</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(Array.from(e.target.files))}
              disabled={!selectedProject || uploading}
            />
          </label>
        </div>
      </div>

      {/* Upload form */}
      {selectedProject && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف الصور (اختياري)"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Images grid */}
      {selectedProject ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden">
              <img
                src={img.image_url}
                alt={img.description}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-white text-center p-2">
                  <p className="text-sm font-medium">{img.uploaded_by_name}</p>
                  <p className="text-xs opacity-75">{new Date(img.created_at).toLocaleDateString('ar-EG')}</p>
                  {img.description && <p className="text-xs mt-1">{img.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Image className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">اختر مشروع لعرض الصور</p>
        </div>
      )}

      {selectedProject && images.length === 0 && (
        <div className="text-center py-12">
          <Image className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">لا توجد صور لهذا المشروع</p>
        </div>
      )}
    </div>
  );
}