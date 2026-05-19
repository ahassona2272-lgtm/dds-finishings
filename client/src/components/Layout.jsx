import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  UserCircle,
  Palette,
  HardHat,
  Receipt,
  ShoppingCart,
  MessageSquare,
  LogOut,
  Bell,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { useState } from 'react';

const navigation = {
  admin: [
    { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
    { name: 'العملاء', href: '/clients', icon: Users },
    { name: 'المشاريع', href: '/projects', icon: FolderKanban },
    { name: 'المستخدمين', href: '/users', icon: UserCircle },
    { name: 'مهام التصميم', href: '/design/tasks', icon: Palette },
    { name: 'تقارير الموقع', href: '/execution/reports', icon: HardHat },
    { name: 'الصور', href: '/execution/images', icon: HardHat },
    { name: 'المدفوعات', href: '/accounting/payments', icon: Receipt },
    { name: 'العقود', href: '/accounting/contracts', icon: Receipt },
    { name: 'المشتريات', href: '/purchasing', icon: ShoppingCart },
    { name: 'الرسائل', href: '/messages', icon: MessageSquare },
  ],
  design: [
    { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
    { name: 'مهام التصميم', href: '/design/tasks', icon: Palette },
    { name: 'الرسائل', href: '/messages', icon: MessageSquare },
  ],
  execution: [
    { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
    { name: 'تقارير الموقع', href: '/execution/reports', icon: HardHat },
    { name: 'الصور', href: '/execution/images', icon: HardHat },
    { name: 'الرسائل', href: '/messages', icon: MessageSquare },
  ],
  accounting: [
    { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
    { name: 'المدفوعات', href: '/accounting/payments', icon: Receipt },
    { name: 'العقود', href: '/accounting/contracts', icon: Receipt },
    { name: 'الرسائل', href: '/messages', icon: MessageSquare },
  ],
  pricing: [
    { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
    { name: 'العقود', href: '/accounting/contracts', icon: Receipt },
    { name: 'الرسائل', href: '/messages', icon: MessageSquare },
  ],
  purchasing: [
    { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
    { name: 'المشتريات', href: '/purchasing', icon: ShoppingCart },
    { name: 'الرسائل', href: '/messages', icon: MessageSquare },
  ],
  sales: [
    { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
    { name: 'العملاء', href: '/clients', icon: Users },
    { name: 'المشاريع', href: '/projects', icon: FolderKanban },
    { name: 'الرسائل', href: '/messages', icon: MessageSquare },
  ],
  client: [
    { name: 'صفحتي', href: '/my-portal', icon: LayoutDashboard },
    { name: 'الرسائل', href: '/messages', icon: MessageSquare },
  ],
};

const roleNames = {
  admin: 'مدير النظام',
  design: 'إدارة التصميم',
  execution: 'إدارة التنفيذ',
  accounting: 'إدارة الحسابات',
  pricing: 'إدارة التسعير',
  purchasing: 'إدارة المشتريات',
  sales: 'التسويق والمبيعات',
  client: 'عميل',
};

export default function Layout() {
  const { user, logout, notifications, unreadCount } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  const menuItems = navigation[user?.role] || navigation.client;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-64 bg-slate-900 transform transition-transform duration-300 z-50 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">DDS</h1>
              <p className="text-slate-400 text-xs">التشطيبات</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-sm">{roleNames[user?.role]}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:mr-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">
            <span>DDS التشطيبات</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">
              {menuItems.find(m => m.href === location.pathname)?.name || 'لوحة التحكم'}
            </span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">الإشعارات</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-slate-500">لا توجد إشعارات</p>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 ${
                          !notif.is_read ? 'bg-primary-50' : ''
                        }`}
                      >
                        <p className="font-medium text-slate-900">{notif.title}</p>
                        <p className="text-sm text-slate-500">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}