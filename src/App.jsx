import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import QRModal from './components/QRModal.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ContactsPage from './pages/ContactsPage.jsx';
import TemplatesPage from './pages/TemplatesPage.jsx';
import MediaPage from './pages/MediaPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import socket from './services/socket.js';
import { Code2, Heart, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [status, setStatus] = useState('Initializing client...');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected to backend');
    });

    socket.on('status', (newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'Connected') {
        setIsAuthenticated(true);
      }
    });

    socket.on('qr', (qr) => {
      setQrCode(qr);
      setIsAuthenticated(false);
      // Auto open QR modal if user needs to authenticate
      setIsQRModalOpen(true);
    });

    socket.on('authenticated', () => {
      setIsAuthenticated(true);
      setQrCode(null);
    });

    socket.on('show_qr', () => {
      setIsAuthenticated(false);
      setIsQRModalOpen(true);
    });

    return () => {
      socket.off('connect');
      socket.off('status');
      socket.off('qr');
      socket.off('authenticated');
      socket.off('show_qr');
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Dynamic Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        status={status}
        isAuthenticated={isAuthenticated}
        onOpenQR={() => setIsQRModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 z-10">
        {currentTab === 'dashboard' && (
          <DashboardPage
            isAuthenticated={isAuthenticated}
            onOpenQR={() => setIsQRModalOpen(true)}
          />
        )}
        {currentTab === 'contacts' && <ContactsPage />}
        {currentTab === 'templates' && <TemplatesPage />}
        {currentTab === 'media' && <MediaPage />}
        {currentTab === 'reports' && <ReportsPage />}
      </main>

      {/* WhatsApp QR Modal */}
      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        qrCode={qrCode}
        status={status}
        isAuthenticated={isAuthenticated}
      />

      {/* Clean Modern Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md py-6 mt-12 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">HALO</span>
            <span>• WhatsApp Automation & Bulk Sender</span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/heyaryanmittal/HALO"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <Code2 className="w-4 h-4" />
              <span>heyaryanmittal/HALO</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
