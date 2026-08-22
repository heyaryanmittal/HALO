import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, CheckCircle2, RefreshCw, Smartphone, ShieldCheck, AlertCircle } from 'lucide-react';

export default function QRModal({ isOpen, onClose, qrCode, status, isAuthenticated }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg p-6 overflow-hidden rounded-2xl glass-card border border-slate-700/60 shadow-2xl bg-slate-900/90">
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
            <p className="text-xs text-slate-400">Scan the QR code with WhatsApp on your phone</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-6">
          {isAuthenticated ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-500/10 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-white">Authenticated Successfully!</h3>
              <p className="text-sm text-slate-400 mt-1">Your WhatsApp session is active and ready to send messages.</p>
            </div>
          ) : qrCode ? (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/30">
                <QRCodeSVG value={qrCode} size={220} level="M" />
              </div>
              <div className="flex items-center space-x-2 mt-4 text-xs font-mono text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-full border border-emerald-800/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live QR Code • Auto-refresh active</span>
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

        <div className="space-y-2.5 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 text-xs text-slate-300">
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

        <div className="mt-5 flex justify-end">
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
