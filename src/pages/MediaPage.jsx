import React, { useState, useEffect } from 'react';
import { 
  Image, 
  Upload, 
  Trash2, 
  Edit2, 
  FileText, 
  FileVideo, 
  FileAudio, 
  File, 
  Eye, 
  X, 
  Check, 
  Download,
  FolderOpen
} from 'lucide-react';

export default function MediaPage() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Rename modal state
  const [renamingFile, setRenamingFile] = useState(null);
  const [newName, setNewName] = useState('');

  // Preview modal state
  const [previewFile, setPreviewFile] = useState(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        setMediaFiles(data);
      }
    } catch (e) {
      console.error('Failed to fetch media:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('mediaFiles', selectedFiles[i]);
    }

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      setSelectedFiles([]);
      await fetchMedia();
    } catch (err) {
      console.error('Failed to upload media:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Delete "${filename}" from Media Vault?`)) return;
    try {
      const res = await fetch(`/api/media/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMediaFiles((prev) => prev.filter((m) => m.name !== filename));
      }
    } catch (err) {
      console.error('Error deleting media:', err);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === renamingFile) return;

    try {
      const res = await fetch('/api/media/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldName: renamingFile,
          newName: newName.trim(),
        }),
      });
      if (res.ok) {
        setRenamingFile(null);
        await fetchMedia();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to rename file');
      }
    } catch (err) {
      console.error('Error renaming:', err);
    }
  };

  const getFileIcon = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <Image className="w-5 h-5 text-emerald-400" />;
    if (['mp4', 'mkv', 'mov', 'webm'].includes(ext)) return <FileVideo className="w-5 h-5 text-indigo-400" />;
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return <FileAudio className="w-5 h-5 text-amber-400" />;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return <FileText className="w-5 h-5 text-cyan-400" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center space-x-3">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Image className="w-6 h-6" />
            </span>
            <span>Media Vault</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Store and manage images, brochures, videos, and PDFs to attach with WhatsApp campaigns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-4">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5 sticky top-24">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Upload Media Files</span>
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 text-center bg-slate-900/40 transition-colors">
                <input
                  type="file"
                  id="mediaUploadInput"
                  multiple
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  className="hidden"
                />
                <label htmlFor="mediaUploadInput" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} file(s) selected`
                      : 'Choose Images, PDFs, or Videos'}
                  </span>
                  <span className="text-[11px] text-slate-500">Attach up to 10 files at once</span>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="max-h-28 overflow-y-auto space-y-1 p-2 bg-slate-950/60 rounded-xl text-xs text-slate-300">
                  {selectedFiles.map((f, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <span className="text-slate-500 font-mono">{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={selectedFiles.length === 0 || isUploading}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  selectedFiles.length > 0 && !isUploading
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading Files...' : 'Upload to Vault'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Media Grid */}
        <div className="lg:col-span-8">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Uploaded Files ({mediaFiles.length})
              </h3>
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-500 text-xs">Loading media vault...</div>
            ) : mediaFiles.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs space-y-2">
                <Image className="w-8 h-8 mx-auto text-slate-600" />
                <p>No media files uploaded yet.</p>
                <p className="text-[11px] text-slate-600">Upload images or documents to attach them with your campaigns.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {mediaFiles.map((file) => (
                  <div
                    key={file.name}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    {/* Media Thumbnail or Icon */}
                    <div className="relative h-28 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80 flex items-center justify-center">
                      {file.isImage ? (
                        <img
                          src={`/media/${encodeURIComponent(file.name)}`}
                          alt={file.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center space-y-1">
                          {getFileIcon(file)}
                          <span className="text-[10px] font-mono uppercase text-slate-400">
                            {file.name.split('.').pop()}
                          </span>
                        </div>
                      )}

                      {/* Quick Preview overlay */}
                      {file.isImage && (
                        <button
                          onClick={() => setPreviewFile(file.name)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Filename & Actions */}
                    <div>
                      <p className="text-xs font-semibold text-slate-200 truncate" title={file.name}>
                        {file.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <button
                        onClick={() => {
                          setRenamingFile(file.name);
                          setNewName(file.name);
                        }}
                        className="text-slate-400 hover:text-emerald-400 flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Rename</span>
                      </button>

                      <button
                        onClick={() => handleDelete(file.name)}
                        className="p-1 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rename File Modal */}
      {renamingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl glass-card border border-slate-700 bg-slate-900/95 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Rename Media File</h3>
            <form onSubmit={handleRename} className="space-y-4">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl"
                >
                  Update Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-3xl max-h-[85vh] p-2 bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col">
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={`/media/${encodeURIComponent(previewFile)}`}
              alt={previewFile}
              className="max-h-[75vh] w-auto object-contain rounded-xl"
            />
            <p className="text-xs text-slate-300 text-center py-2 font-mono">{previewFile}</p>
          </div>
        </div>
      )}
    </div>
  );
}
