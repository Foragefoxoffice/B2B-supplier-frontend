import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Home, Package, Bell, Settings, Menu, Search, Mail,
  Users, ShoppingCart, LogOut, FolderOpen, Truck, MapPin, Activity
} from 'lucide-react';
import { useCart } from '../../store/CartContext';
import toast from 'react-hot-toast';
import { useNotifications } from '../../hooks/useNotifications.jsx';

const SidebarItem = ({ icon: Icon, label, to, badge, activeOverride, isOpen: isSidebarOpen, onClick }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const isStrictlyActive = pathname === to;

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div className={`my-2 ${!isSidebarOpen ? 'flex justify-center' : ''}`}>
      <NavLink
        to={to}
        onClick={handleClick}
        title={!isSidebarOpen ? label : ""}
        className={({ isActive }) => {
          const active = isStrictlyActive || activeOverride;
          return `flex items-center transition-all duration-200 group ${isSidebarOpen ? 'justify-between px-6 py-2.5 mx-0 rounded-none' : 'justify-center px-0 py-2.5 mx-2 w-11 h-11 rounded-xl'
            } ${active
              ? (isSidebarOpen ? 'bg-gradient-to-r from-[#103885] to-[#205EE0] text-white rounded-r-full mr-4 shadow-sm' : 'bg-gradient-to-br from-[#103885] to-[#205EE0] text-white shadow-sm')
              : 'text-[#A1B0CB] hover:text-white hover:bg-white/5'
            }`
        }}
      >
        {({ isActive }) => {
          const active = isStrictlyActive || activeOverride;
          return (
            <>
              <div className="flex items-center">
                <Icon className={`h-[18px] w-[18px] shrink-0 transition-all duration-200 ${isSidebarOpen ? 'mr-3.5' : 'mr-0'} ${active ? 'text-white' : 'text-[#A1B0CB] group-hover:text-white'}`} />
                <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  <span className={`text-[15px] ${active ? 'text-white font-medium' : 'font-medium'}`}>{label}</span>
                </div>
              </div>
              <div className={`flex items-center transition-all duration-300 overflow-hidden whitespace-nowrap shrink-0 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                {badge && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                    {badge}
                  </span>
                )}
              </div>
            </>
          );
        }}
      </NavLink>
    </div>
  );
};

const SectionHeader = ({ title, isOpen }) => {
  if (!isOpen) return <div className="h-6 mt-4"></div>;
  return (
    <div className="mt-6 mb-3 px-6">
      <p className="text-[#5A7398] text-[10.5px] font-semibold tracking-wider uppercase">{title}</p>
    </div>
  );
};

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const { cartStats } = useCart();

  const token = localStorage.getItem('token');

  // Initialize notifications
  const { notifications, unreadCount } = useNotifications(user, token);

  // Handle window resize to auto-close/open sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    if (!token || !userString) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } else {
      try {
        setUser(JSON.parse(userString));
        setLoading(false);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin h-8 w-8 text-blue-600 rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  const isSupplier = user?.role === 'SUPPLIER';

  // Protect Admin-only routes from Suppliers
  if (isSupplier && location.pathname === '/suppliers') {
    return <Navigate to="/dashboard" replace />;
  }

  // Protect Supplier-only routes from Admins
  if (!isSupplier && ['/categories', '/orders', '/transporters'].includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-gradient-to-b from-[#0a1b3f] via-[#030a1c] to-[#01040d] flex-col h-full fixed md:relative shrink-0 transition-all duration-300 ease-in-out flex ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-[80px] -translate-x-full md:translate-x-0'}`}>
        {/* Logo Area */}
        <div className={`h-24 shrink-0 relative z-10 flex items-center overflow-hidden whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'px-6' : 'px-0 justify-center'}`}>
          <div className={`flex items-center w-full ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
            <div className={`flex items-center justify-center shrink-0 transition-all duration-300 ${isSidebarOpen ? 'mr-3' : 'mr-0'}`}>
              <div className="h-[70px] w-[70px] rounded-full flex items-center justify-center border-[2px] border-[#D4AF37] overflow-hidden shrink-0 bg-white">
                <img src="/images/kannan_silks_logo.png" alt="Kannan Silks Logo" className="h-full w-full object-cover" />
              </div>
            </div>
            <div className={`transition-all duration-300 flex flex-col justify-center ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
              <h1 className="text-white font-bold text-[15px] tracking-wide leading-tight">KANNAN SILKS</h1>
              <p className="text-[#5A7398] text-[10px] font-bold tracking-wider uppercase mt-0.5">
                {isSupplier ? 'Supplier Portal' : 'Admin Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col relative z-10 pt-6 pb-0 overflow-y-auto overflow-x-hidden sidebar-scroll">
          <nav className="px-0 pb-6 w-full">
            <div className={`mb-6 ${isSidebarOpen ? 'px-0' : 'px-0'}`}>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => {
                  const active = location.pathname === '/dashboard' || location.pathname === '/';
                  return `flex items-center transition-all duration-200 group ${isSidebarOpen ? 'justify-start px-6 py-3 rounded-none' : 'justify-center px-0 py-3 mx-2 w-11 h-11 rounded-xl'
                    } ${active
                      ? (isSidebarOpen ? 'bg-gradient-to-r from-[#103885] to-[#205EE0] text-white rounded-r-full mr-4 shadow-sm' : 'bg-gradient-to-br from-[#103885] to-[#205EE0] text-white shadow-sm')
                      : 'text-[#A1B0CB] hover:text-white hover:bg-white/5'
                    }`
                }}
              >
                <div className="flex items-center">
                  <Home className={`h-[18px] w-[18px] shrink-0 ${isSidebarOpen ? 'mr-3.5' : 'mr-0'} ${location.pathname === '/dashboard' || location.pathname === '/' ? 'text-white' : 'text-[#A1B0CB] group-hover:text-white'}`} />
                  <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap font-medium text-[15px] ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} ${location.pathname === '/dashboard' || location.pathname === '/' ? 'text-white' : 'text-[#A1B0CB] group-hover:text-white'}`}>
                    Dashboard
                  </span>
                </div>
              </NavLink>
            </div>

            <SectionHeader title="Orders" isOpen={isSidebarOpen} />
            {isSupplier && (
              <SidebarItem icon={ShoppingCart} label="Purchase Orders" to="/orders" isOpen={isSidebarOpen} />
            )}
            {!isSupplier && (
              <SidebarItem icon={MapPin} label="Order Tracking" to="/order-tracking" isOpen={isSidebarOpen} />
            )}

            <SectionHeader title="Products & Catalog" isOpen={isSidebarOpen} />
            <SidebarItem icon={Package} label={isSupplier ? "My Products" : "Products"} to="/products" isOpen={isSidebarOpen} />

            {isSupplier && (
              <>
                <SidebarItem icon={FolderOpen} label="Categories" to="/categories" isOpen={isSidebarOpen} />
                <SidebarItem icon={Truck} label="Transporters" to="/transporters" isOpen={isSidebarOpen} />
              </>
            )}

            <SectionHeader title="Account" isOpen={isSidebarOpen} />
            {!isSupplier && (
              <>
                <SidebarItem icon={Users} label="Suppliers" to="/suppliers" isOpen={isSidebarOpen} />
                <SidebarItem icon={Users} label="Staff Management" to="/staff" isOpen={isSidebarOpen} />
                <SidebarItem icon={Activity} label="Activity Logs" to="/activity-logs" isOpen={isSidebarOpen} />
              </>
            )}
            <SidebarItem icon={Settings} label="Settings" to="/settings" isOpen={isSidebarOpen} />
          </nav>
        </div>

        {/* Logout Button in Footer */}
        <div className={`mt-auto bg-transparent border-t border-white/5 transition-all duration-300 ${isSidebarOpen ? 'p-4' : 'p-3 flex justify-center'}`}>
          <button
            onClick={handleLogout}
            title="Logout"
            className={`flex cursor-pointer items-center transition-all duration-200 group text-[#F43F5E] hover:bg-[#F43F5E]/10 hover:text-rose-400 ${isSidebarOpen ? 'justify-start px-4 py-3 rounded-xl w-full' : 'justify-center px-0 py-3 w-11 h-11 rounded-xl'}`}
          >
            <LogOut className={`h-[18px] w-[18px] shrink-0 ${isSidebarOpen ? 'mr-3.5' : 'mr-0'}`} />
            <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              <span className="font-semibold text-[14.5px]">Logout</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 w-full shrink-0">
          <div className="flex items-center flex-1">
            <button
              className="text-slate-400 hover:text-slate-600 mr-4 transition-transform hover:scale-105 cursor-pointer"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="max-w-md w-full relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-300" />
              </div>
              <input
                type="text"
                placeholder="Search here..."
                className="block w-full pl-10 pr-12 py-2 border-0 bg-slate-50 text-slate-900 rounded-lg focus:ring-1 focus:ring-blue-500 sm:text-sm placeholder:text-slate-400 transition-colors"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                <span className="text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm font-medium">⌘ K</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 ml-4 shrink-0">
            <button
              id="cart-icon-nav"
              className="text-slate-400 hover:text-blue-600 transition-colors relative cursor-pointer"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartStats?.totalItems > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white text-[9px] font-bold text-white">
                  {cartStats.totalItems}
                </span>
              )}
            </button>
            <div className="relative hidden sm:block" ref={notificationRef}>
              <button
                className="text-slate-400 hover:text-blue-600 transition-colors relative"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white text-[9px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-99 overflow-hidden transform origin-top-right transition-all flex flex-col max-h-[85vh]">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">{unreadCount} new</span>
                    )}
                  </div>

                  <div className="overflow-y-auto flex-1 sidebar-scroll">
                    {notifications && notifications.length > 0 ? (
                      <div className="divide-y divide-slate-50">
                        {notifications.slice(0, 5).map(notif => (
                          <div key={notif.id} className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`} onClick={() => navigate('/notifications')}>
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 mt-0.5">
                                <Bell className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className={`text-sm ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{notif.title}</h4>
                                <p className={`text-xs mt-0.5 line-clamp-2 ${!notif.is_read ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>{notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(notif.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center bg-slate-50">
                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                          <Bell className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">No new notifications</p>
                        <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 p-2 shrink-0">
                    <button
                      onClick={() => {
                        setIsNotificationOpen(false);
                        navigate('/notifications');
                      }}
                      className="w-full py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button className="text-slate-400 hover:text-blue-600 transition-colors relative hidden sm:block">
              <Mail className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white text-[9px] font-bold text-white">12</span>
            </button>
            <div className="flex items-center border-l border-slate-200 pl-6 cursor-pointer">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent((user?.first_name || 'Admin') + ' ' + (user?.last_name || 'User'))}&background=0D8ABC&color=fff&rounded=true`}
                alt="User"
                className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="ml-3 hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none mb-1">
                  {user?.company_name || `${user?.first_name || 'Admin'} ${user?.last_name || 'User'}`}
                </p>
                <p className="text-xs text-slate-500 font-medium">{user?.role === 'SUPPLIER' ? 'Supplier' : 'Admin'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#04274a03] p-8">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
