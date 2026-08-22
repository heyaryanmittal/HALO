import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Upload, 
  Trash2, 
  RotateCcw, 
  Eye, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Download
} from 'lucide-react';

export default function ContactsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Viewing group contacts modal
  const [viewingGroup, setViewingGroup] = useState(null);
  const [groupContacts, setGroupContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (e) {
      console.error('Failed to fetch contact groups:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('contactFile', uploadFile);

    try {
      const res = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData,
      });
      setUploadFile(null);
      await fetchGroups();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteGroup = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;
    try {
      const res = await fetch(`/api/contacts/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.name !== filename));
        if (viewingGroup === filename) setViewingGroup(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleResetProgress = async (filename) => {
    if (!window.confirm(`Reset progress for "${filename}" back to 0?`)) return;
    try {
      const res = await fetch(`/api/contacts/${encodeURIComponent(filename)}/reset`, {
        method: 'POST',
      });
      if (res.ok) {
        setGroups((prev) =>
          prev.map((g) => (g.name === filename ? { ...g, progress: 0 } : g))
        );
      }
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const handleOpenGroup = async (filename) => {
    setViewingGroup(filename);
    setContactsLoading(true);
    try {
      const res = await fetch(`/api/contacts/${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        setGroupContacts(data);
      }
    } catch (err) {
      console.error('Failed to load contacts for group:', err);
    } finally {
      setContactsLoading(false);
    }
  };

  const filteredContacts = groupContacts.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.number && String(c.number).toLowerCase().includes(term)) ||
      (c.name && String(c.name).toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center space-x-3">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Users className="w-6 h-6" />
            </span>
            <span>Contact Groups</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload and manage recipient lists (.csv, .xlsx, .xls) for targeted message campaigns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form Card */}
        <div className="lg:col-span-4">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5 sticky top-24">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Upload New Contact List</span>
            </h3>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 text-center bg-slate-900/40 transition-colors">
                <input
                  type="file"
                  id="newContactList"
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="hidden"
                />
                <label htmlFor="newContactList" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    {uploadFile ? uploadFile.name : 'Choose CSV or Excel File'}
                  </span>
                  <span className="text-[11px] text-slate-500">Supports .csv, .xlsx, .xls</span>
                </label>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Format Requirement:</p>
                <p>Include country code in number (e.g., <code className="text-emerald-400">919876543210</code>).</p>
                <p>Must include a column named <strong className="text-slate-300">number</strong>.</p>
              </div>

              <button
                type="submit"
                disabled={!uploadFile || isUploading}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  uploadFile && !isUploading
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading...' : 'Save Contact Group'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="lg:col-span-8">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Saved Contact Lists ({groups.length})
              </h3>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs">Loading contact groups...</div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-600" />
                <p>No contact groups uploaded yet.</p>
                <p className="text-[11px] text-slate-600">Upload your first CSV or Excel file to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <div
                    key={group.name}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[180px]" title={group.name}>
                            {group.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {group.progress > 0 ? `Sent to ${group.progress} contacts` : 'Fresh list (0 sent)'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <button
                        onClick={() => handleOpenGroup(group.name)}
                        className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Data</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        {group.progress > 0 && (
                          <button
                            onClick={() => handleResetProgress(group.name)}
                            title="Reset campaign progress to 0"
                            className="p-1.5 text-amber-400 hover:bg-amber-950/40 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteGroup(group.name)}
                          title="Delete contact list"
                          className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Group Contacts Modal */}
      {viewingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col p-6 rounded-2xl glass-card border border-slate-700 bg-slate-900/95 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white truncate max-w-md">{viewingGroup}</h3>
                  <p className="text-xs text-slate-400">{groupContacts.length} Total Contacts in List</p>
                </div>
              </div>
              <button
                onClick={() => setViewingGroup(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="py-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search number or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl">
              {contactsLoading ? (
                <div className="text-center py-16 text-slate-500 text-xs">Parsing contacts...</div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">No matching contacts found.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Number (WhatsApp)</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Custom Fields</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredContacts.map((c, i) => {
                      const { number, name, ...extra } = c;
                      return (
                        <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                          <td className="px-4 py-2.5 text-emerald-400 font-semibold">{number}</td>
                          <td className="px-4 py-2.5 text-slate-200">{name || '-'}</td>
                          <td className="px-4 py-2.5 text-slate-400 text-[11px]">
                            {Object.keys(extra).length > 0 ? JSON.stringify(extra) : '-'}
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
                onClick={() => setViewingGroup(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
