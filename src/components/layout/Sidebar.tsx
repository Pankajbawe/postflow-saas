import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PenSquare,
  Sparkles,
  Calendar,
  Library,
  Share2,
  BarChart3,
  History,
  Settings,
  Zap,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/create-post', label: 'Create Post', icon: PenSquare },
  { to: '/ai-repurpose', label: 'AI Repurpose', icon: Sparkles },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/content-library', label: 'Content Library', icon: Library },
  { to: '/social-accounts', label: 'Social Accounts', icon: Share2 },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/post-history', label: 'Post History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary-600 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">PostFlow</span>
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-600/10 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-600/10 dark:to-accent-600/10 p-4">
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-400">Demo MVP</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All features are simulated for demonstration.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
