import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Trash2, 
  Download, 
  Eye, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Search, 
  X,
  Calendar,
  Layers,
  Send
} from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState({ totalSent: 0, totalCampaigns: 0, daily: [] });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Viewing report modal state
  const [viewingReport, setViewingReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReportsAndStats = async () => {
    try {
      setLoading(true);
      const [statsRes, reportsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/reports')
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (reportsRes.ok) setReports(await reportsRes.json());
    } catch (e) {
      console.error('Failed to fetch reports/stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsAndStats();
  }, []);

  const handleOpenReport = async (filename) => {
    setViewingReport(filename);
    setReportLoading(true);
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error('Error reading report file:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDeleteReport = async (filename) => {
    if (!window.confirm(`Delete report "${filename}"?`)) return;
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r !== filename));
        if (viewingReport === filename) setViewingReport(null);
        await fetchReportsAndStats();
      }
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const handleResetAllStats = async () => {
    if (!window.confirm('Are you sure you want to reset all lifetime statistics and clear all reports?')) return;
    try {
      const res = await fetch('/api/stats/reset', { method: 'POST' });
      if (res.ok) {
        await fetchReportsAndStats();
      }
    } catch (err) {
      console.error('Failed to reset stats:', err);
    }
  };

  const filteredReportEntries = reportData.filter((entry) => {
    const q = searchQuery.toLowerCase();
    return (
      (entry.number && String(entry.number).toLowerCase().includes(q)) ||
      (entry.name && String(entry.name).toLowerCase().includes(q)) ||
      (entry.status && String(entry.status).toLowerCase().includes(q))
    );
  });

  const exportReportCSV = (filename, data) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((d) => Object.values(d).map((v) => `"${v}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center space-x-3">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <BarChart3 className="w-6 h-6" />
            </span>
            <span>Reports & Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit logs, delivery results, and lifetime campaign dispatch metrics
          </p>
        </div>
        <button
          onClick={handleResetAllStats}
          className="flex items-center space-x-2 px-3.5 py-2 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/40 text-rose-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Stats</span>
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Lifetime Messages Sent</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.totalSent.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-400 font-medium">Successfully dispatched across all runs</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Completed Campaigns</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.totalCampaigns || reports.length}</p>
          <p className="text-[11px] text-indigo-400 font-medium">Audit logs stored in system</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Today's Dispatches</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white">
            {stats.daily?.find((d) => d.date === new Date().toISOString().split('T')[0])?.sent || 0}
          </p>
          <p className="text-[11px] text-amber-400 font-medium">Messages sent today</p>
        </div>
      </div>

      {/* Reports Table Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Campaign Run Reports ({reports.length})</span>
        </h3>

        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs">Loading campaign reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs space-y-2">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-600" />
            <p>No campaign reports recorded yet.</p>
            <p className="text-[11px] text-slate-600">Run a message campaign from the Campaign Hub to generate reports.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
            {reports.map((filename) => (
              <div
                key={filename}
                className="p-4 bg-slate-900/40 hover:bg-slate-800/40 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-sm sm:max-w-md">{filename}</p>
                    <p className="text-[11px] text-slate-500">CSV Audit Log</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenReport(filename)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Audit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteReport(filename)}
                    className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Delete report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Detailed Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col p-6 rounded-2xl glass-card border border-slate-700 bg-slate-900/95 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white truncate max-w-md">{viewingReport}</h3>
                  <p className="text-xs text-slate-400">{reportData.length} Recipients Processed</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportReportCSV(viewingReport, reportData)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={() => setViewingReport(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Input inside modal */}
            <div className="py-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by number, name or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl">
              {reportLoading ? (
                <div className="text-center py-16 text-slate-500 text-xs">Loading report logs...</div>
              ) : filteredReportEntries.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">No matching entries found.</div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Recipient Number</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Dispatch Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredReportEntries.map((row, idx) => {
                      const isSuccess = String(row.status).toLowerCase().includes('success') || String(row.status).toLowerCase().includes('sent');
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-2.5 text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-2.5 text-slate-200 font-semibold">{row.number}</td>
                          <td className="px-4 py-2.5 text-slate-400">{row.name || '-'}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isSuccess
                                ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                                : 'bg-rose-950/60 border-rose-800/60 text-rose-300'
                            }`}>
                              {isSuccess ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                              <span>{row.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
