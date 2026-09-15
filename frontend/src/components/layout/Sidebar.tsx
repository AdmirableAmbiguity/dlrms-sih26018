import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileCheck2, 
  Files, 
  Map as MapIcon, 
  Award,
  AlertTriangle,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['citizen', 'revenue_officer', 'verifier_admin'] },
  { path: '/upload', label: 'Upload', icon: UploadCloud, roles: ['revenue_officer', 'verifier_admin'] },
  { path: '/review-queue', label: 'Review Queue', icon: FileCheck2, roles: ['revenue_officer', 'verifier_admin'], badge: '12' },
  { path: '/records', label: 'Records', icon: Files, roles: ['citizen', 'revenue_officer', 'verifier_admin'] },
  { path: '/map', label: 'GIS Map', icon: MapIcon, roles: ['citizen', 'revenue_officer', 'verifier_admin'] },
  { path: '/certificates', label: 'Certificates', icon: Award, roles: ['citizen', 'revenue_officer', 'verifier_admin'] },
  { path: '/fraud', label: 'Fraud Flags', icon: AlertTriangle, roles: ['verifier_admin'] },
];

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (v: boolean) => void }) {
  const { user, logout } = useAuth();
  
  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(user?.role || ''));

  const SidebarContent = (
    <div className="flex h-full flex-col bg-primary text-white w-64">
      <div className="p-6 flex items-center gap-3">
        <img src="/favicon.svg" alt="Logo" className="w-8 h-8 bg-white rounded-full p-1" />
        <span className="text-xl font-bold tracking-wider">DLRMS</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-secondary text-white text-xs py-0.5 px-2 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-400 capitalize truncate">{user?.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        {SidebarContent}
      </div>
      
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex md:hidden"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileOpen(false)} />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative flex-1 flex flex-col max-w-xs w-full"
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              {SidebarContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
