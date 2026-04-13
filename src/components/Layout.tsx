import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Film, Search, Menu, X, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import AdSense from './AdSense';
import AdOverlay from './AdOverlay';
import Logo from './Logo';
import { authService } from '../services/api';
import clientConfig from '../config/client';

interface LayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function Layout({ children, isAdmin = false }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isPopupOpen, setIsPopupOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginPage = location.pathname === '/admin/login';
  const hideAds = isAdmin || isLoginPage;

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const userNav = [
    { name: 'Home', href: '/' },
    { name: 'Categories', href: '/categories' },
    { name: 'Search', href: '/search' },
  ];

  const adminNav = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Movies', href: '/admin/movies' },
    { name: 'Metadata', href: '/admin/metadata' },
  ];

  const navItems = isAdmin ? adminNav : userNav;

  const appName = clientConfig.VITE_APP_NAME;

  React.useEffect(() => {
    document.title = `${appName} - Watch Movies Online`;
  }, [appName]);

  // Global Popup Ad Logic
  React.useEffect(() => {
    if (!hideAds) {
      const timer = setTimeout(() => {
        setIsPopupOpen(true);
      }, 10000); // Show popup after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [hideAds, location.pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col">
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Logo className="w-8 h-8" />
                <span className="text-xl font-bold tracking-tight">{appName}</span>
              </Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        location.pathname === item.href
                          ? "bg-indigo-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {isAdmin && (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>
            <div className="md:hidden flex items-center space-x-2">
              {isAdmin && (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium",
                    location.pathname === item.href
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              {isAdmin && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Top Ad Slot - Moved below nav and made more subtle */}
      {!hideAds && (
        <div className="bg-slate-900/5 border-b border-slate-800/20 py-1 flex items-center justify-center">
          <AdSense slot={clientConfig.VITE_ADSENSE_TOP_SLOT} className="w-full max-w-4xl opacity-60 hover:opacity-100 transition-opacity" />
        </div>
      )}

      <main className={cn(
        "mx-auto flex-1 w-full",
        location.pathname === '/' ? "max-w-[1600px] px-4 sm:px-8 lg:px-12" : "max-w-7xl px-4 sm:px-6 lg:px-8",
        hideAds ? "py-12" : "pt-6 pb-12"
      )}>
        {children}
      </main>

      {/* Bottom Ad Slot */}
      {!hideAds && (
        <div className="bg-slate-900/20 border-t border-slate-800/50 py-4 flex items-center justify-center min-h-[100px]">
          <AdSense slot={clientConfig.VITE_ADSENSE_BOTTOM_SLOT} className="w-full max-w-6xl" />
        </div>
      )}

      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} {appName}. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Global Popup Ad */}
      <AdOverlay 
        type="popup"
        slot={clientConfig.VITE_ADSENSE_POPUP_SLOT}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        title="Exclusive Movie Offer"
      />
    </div>
  );
}
