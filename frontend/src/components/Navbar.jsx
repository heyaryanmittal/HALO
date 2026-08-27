import React, { useState } from 'react';
import { 
  Send, 
  Users, 
  FileText, 
  Image, 
  BarChart3, 
  QrCode, 
  Wifi, 
  WifiOff, 
  Radio, 
  ShieldCheck,
  Sparkles,
  LogOut,
  User,
  RefreshCw,
  Smartphone
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  status, 
  isAuthenticated, 
  userInfo,
  isLoggingOut,
  onOpenQR,
  onLogout
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Campaign Hub', icon: Send },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'media', label: 'Media Vault', icon: Image },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-white font-extrabold shadow-lg shadow-emerald-500/20">
              <span className="text-xl tracking-tighter">H</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-wider text-white">HALO</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                by <span className="text-slate-300 font-semibold hover:text-emerald-400 transition-colors">heyaryanmittal</span>
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* WhatsApp Connection Status / Account / Logout Actions */}
          <div className="flex items-center space-x-2.5">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {/* Account Details & Status Badge */}
                <button
                  onClick={onOpenQR}
                  title="Click to view WhatsApp connection details"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-700 transition-all shadow-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold text-emerald-400">
                    {userInfo?.number ? `+${userInfo.number}` : 'Connected'}
                  </span>
                  {userInfo?.pushname && (
                    <span className="hidden lg:inline text-[11px] text-emerald-400/70 border-l border-emerald-800/80 pl-2">
                      {userInfo.pushname}
                    </span>
                  )}
                </button>

                {/* Logout / Switch Account Button */}
                <div className="relative">
                  {showLogoutConfirm ? (
                    <div className="flex items-center space-x-1.5 bg-slate-900 border border-rose-500/40 p-1 rounded-xl shadow-xl animate-fade-in z-50">
                      <span className="text-[11px] text-rose-300 font-semibold px-1.5">Log out?</span>
                      <button
                        onClick={handleConfirmLogout}
                        disabled={isLoggingOut}
                        className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center space-x-1"
                      >
                        {isLoggingOut ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <span>Yes</span>
                        )}
                      </button>
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      disabled={isLoggingOut}
                      title="Log out of WhatsApp and link a new account"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 hover:border-rose-700/60 text-rose-300 transition-all"
                    >
                      {isLoggingOut ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span className="hidden sm:inline">Logging out...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Logout</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenQR}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/40 hover:border-amber-700 animate-pulse"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
