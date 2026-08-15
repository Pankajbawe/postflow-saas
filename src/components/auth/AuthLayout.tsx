import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function AuthLayout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 40%)',
        }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Zap className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">PostFlow</span>
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Create Once.<br />Adapt Everywhere.<br />Publish Everywhere.
            </h1>
            <p className="text-lg text-white/80 max-w-md">
              The all-in-one platform for content creators, freelancers, and agencies to manage social media across every platform.
            </p>
            <div className="flex gap-6 pt-4">
              <div>
                <div className="text-3xl font-bold">4</div>
                <div className="text-sm text-white/60">Platforms</div>
              </div>
              <div>
                <div className="text-3xl font-bold">AI</div>
                <div className="text-sm text-white/60">Repurposing</div>
              </div>
              <div>
                <div className="text-3xl font-bold">1</div>
                <div className="text-sm text-white/60">Workflow</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-white/50">Demo MVP — No real platform APIs are used.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="p-2 rounded-xl bg-primary-600 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">PostFlow</span>
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
