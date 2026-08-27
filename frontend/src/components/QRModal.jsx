import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Smartphone, 
  ShieldCheck, 
  AlertCircle,
  LogOut,
  UserCheck,
  ArrowRightLeft
} from 'lucide-react';

export default function QRModal({ 
  isOpen, 
  onClose, 
  qrCode, 
  status, 
  isAuthenticated,
  userInfo,
  isLoggingOut,
  onLogout 
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleLogoutClick = () => {
    setShowConfirm(false);
    onLogout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg p-6 overflow-hidden rounded-2xl glass-card border border-slate-700/60 shadow-2xl bg-slate-900/95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">WhatsApp Authentication</h2>
            <p className="text-xs text-slate-400">Manage your connected WhatsApp account & sessions</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/70 rounded-xl border border-slate-800/80 mb-6">
          {isLoggingOut ? (
            <div className="flex flex-col items-center text-center py-10 space-y-4">
              <RefreshCw className="w-12 h-12 text-amber-400 animate-spin" />
              <div>
                <h3 className="text-base font-bold text-slate-200">Logging out from WhatsApp...</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Terminating current session and generating a fresh QR code for your new account.
                </p>
              </div>
            </div>
          ) : isAuthenticated ? (
            <div className="flex flex-col items-center text-center py-4 w-full">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3 ring-8 ring-emerald-500/10 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">WhatsApp Connected!</h3>
              <p className="text-xs text-slate-400 mt-1">Your WhatsApp session is active and ready to send campaigns.</p>

              {/* Connected Account Card */}
              <div className="w-full mt-4 p-3.5 bg-slate-900/90 rounded-xl border border-emerald-500/30 text-left flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Logged in as</p>
                    <p className="text-sm font-bold text-slate-100 font-mono">
                      {userInfo?.number ? `+${userInfo.number}` : 'Connected Account'}
                    </p>
                    {userInfo?.pushname && (
                      <p className="text-[11px] text-emerald-400 font-medium">{userInfo.pushname}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-[11px] font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Active</span>
                </div>
              </div>

              {/* Logout / Switch Account Action Section */}
              <div className="w-full mt-5 pt-4 border-t border-slate-800/80">
                {showConfirm ? (
                  <div className="p-3.5 bg-rose-950/30 border border-rose-800/50 rounded-xl space-y-2.5 animate-fade-in">
                    <p className="text-xs text-rose-300 font-semibold">
                      Are you sure you want to log out from this WhatsApp account?
                    </p>
                    <p className="text-[11px] text-slate-400">
                      You will need to scan a new QR code to link another WhatsApp account.
                    </p>
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLogoutClick}
                        disabled={isLoggingOut}
                        className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md shadow-rose-900/40 transition-colors flex items-center space-x-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Confirm Logout</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 hover:border-rose-700 text-rose-300 transition-all flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-rose-400" />
                    <span>Log Out & Link Different Account</span>
                  </button>
                )}
              </div>
            </div>
          ) : qrCode ? (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/30">
                <QRCodeSVG value={qrCode} size={220} level="M" />
              </div>
              <div className="flex items-center space-x-2 mt-4 text-xs font-mono text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-full border border-emerald-800/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live QR Code • Ready to Scan</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-10 space-y-3">
              <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
              <p className="text-sm font-medium text-slate-300">
                {status || 'Initializing WhatsApp client & generating QR...'}
              </p>
              <p className="text-xs text-slate-500 max-w-xs">
                This takes a few seconds when launching the browser backend.
              </p>
            </div>
          )}
        </div>

        {(!isAuthenticated || qrCode) && !isLoggingOut && (
          <div className="space-y-2.5 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 text-xs text-slate-300 mb-5">
            <p className="font-semibold text-slate-200 flex items-center space-x-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>How to Link Your Account:</span>
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1">
              <li>Open <strong className="text-slate-200">WhatsApp</strong> on your phone</li>
              <li>Tap <strong className="text-slate-200">Menu (⋮)</strong> or <strong className="text-slate-200">Settings</strong> &gt; <strong className="text-slate-200">Linked Devices</strong></li>
              <li>Tap <strong className="text-slate-200">Link a Device</strong> and point your camera at this QR code</li>
            </ol>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
