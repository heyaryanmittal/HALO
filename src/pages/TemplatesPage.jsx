import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Image, 
  Sparkles, 
  X, 
  Check, 
  Smartphone, 
  Paperclip, 
  Smile, 
  CheckCheck,
  Tag
} from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editor Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formFilePaths, setFormFilePaths] = useState([]);

  const fetchTemplatesAndMedia = async () => {
    try {
      setLoading(true);
      const [tRes, mRes] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/media')
      ]);
      if (tRes.ok) setTemplates(await tRes.json());
      if (mRes.ok) setMediaList(await mRes.json());
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplatesAndMedia();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormMessage('');
    setFormFilePaths([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingId(t.id);
    setFormName(t.name);
    setFormMessage(t.message);
    setFormFilePaths(t.filePaths || []);
    setIsModalOpen(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formMessage.trim()) {
      alert('Please provide a name and message text.');
      return;
    }

    const payload = {
      name: formName.trim(),
      message: formMessage.trim(),
      filePaths: formFilePaths,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/templates/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setTemplates((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
        }
      } else {
        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setTemplates((prev) => [...prev, created]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  const insertVariable = (variable) => {
    setFormMessage((prev) => `${prev} {${variable}} `);
  };

  const toggleMediaAttachment = (filename) => {
    setFormFilePaths((prev) =>
      prev.includes(filename) ? prev.filter((f) => f !== filename) : [...prev, filename]
    );
  };

  // Helper to format WhatsApp markdown for phone preview
  const formatWhatsAppText = (text) => {
    if (!text) return 'Enter message text to preview...';
    let formatted = text
      .replace(/\{name\}/gi, '<span class="text-emerald-300 font-bold bg-emerald-950/60 px-1 rounded">Alex</span>')
      .replace(/\{number\}/gi, '<span class="text-emerald-300 font-bold bg-emerald-950/60 px-1 rounded">+1234567890</span>')
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/~([^~]+)~/g, '<del>$1</del>')
      .replace(/\n/g, '<br/>');
    return formatted;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center space-x-3">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <FileText className="w-6 h-6" />
            </span>
            <span>Message Templates Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Craft dynamic message templates with variable tokens (`{'{name}'}`, `{'{number}'}`) and media attachments
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl glass-card text-slate-500 text-xs space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">No message templates found.</p>
          <p className="text-slate-500 max-w-sm mx-auto">Create your first template with dynamic tags to use in campaigns.</p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
          >
            + Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white truncate max-w-[200px]" title={tpl.name}>
                    {tpl.name}
                  </h3>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {tpl.message.length} chars
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 line-clamp-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 whitespace-pre-line font-sans">
                  {tpl.message}
                </p>

                {tpl.filePaths && tpl.filePaths.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tpl.filePaths.map((fp, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center space-x-1 text-[10px] bg-indigo-950/50 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded-md"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{fp}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <button
                  onClick={() => handleOpenEdit(tpl)}
                  className="flex items-center space-x-1 text-slate-300 hover:text-emerald-400 font-medium transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteTemplate(tpl.id)}
                  className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                  title="Delete template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col p-6 rounded-2xl glass-card border border-slate-700 bg-slate-900/95 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingId ? 'Edit Message Template' : 'Create New Message Template'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure message text and media attachments</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
              {/* Form Input fields */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Template Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Festival Offer Promo / Welcome Message"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Message Content</label>
                    <span className="text-[10px] text-slate-500 font-mono">{formMessage.length} characters</span>
                  </div>

                  {/* Variable Buttons */}
                  <div className="flex flex-wrap gap-1.5 my-2">
                    <span className="text-[11px] text-slate-400 self-center mr-1">Insert:</span>
                    {['name', 'number'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-mono font-medium hover:bg-emerald-900/60 transition-colors"
                      >
                        {`{${v}}`}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={6}
                    required
                    placeholder="Hi {name}, thank you for connecting with us! Here is your exclusive discount code..."
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                  />
                </div>

                {/* Media Attachment Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Attach Media Files (Optional)</span>
                  </label>

                  {mediaList.length === 0 ? (
                    <p className="text-[11px] text-slate-500 mt-1">
                      No files in Media Vault yet. Upload media under the Media tab to attach here.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-36 overflow-y-auto pr-1">
                      {mediaList.map((m) => {
                        const isAttached = formFilePaths.includes(m.name);
                        return (
                          <div
                            key={m.name}
                            onClick={() => toggleMediaAttachment(m.name)}
                            className={`p-2 rounded-xl border text-[11px] cursor-pointer flex items-center justify-between transition-all ${
                              isAttached
                                ? 'bg-indigo-950/60 border-indigo-500/60 text-white'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span className="truncate max-w-[120px]">{m.name}</span>
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center ${isAttached ? 'bg-indigo-500 text-white' : 'border border-slate-700'}`}>
                              {isAttached && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-md shadow-emerald-500/20"
                  >
                    {editingId ? 'Save Changes' : 'Create Template'}
                  </button>
                </div>
              </div>

              {/* Right Side: Live WhatsApp Phone Simulator */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-[280px] bg-slate-950 rounded-[32px] p-3 border-4 border-slate-800 shadow-2xl relative">
                  {/* Phone Notch */}
                  <div className="w-24 h-3.5 bg-slate-800 rounded-b-xl mx-auto mb-2" />

                  {/* WhatsApp Chat Header */}
                  <div className="bg-emerald-800 px-3 py-2 rounded-t-xl flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white">
                      H
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-tight">HALO Bot</p>
                      <p className="text-[8px] text-emerald-200">online</p>
                    </div>
                  </div>

                  {/* Chat Body Mockup */}
                  <div className="bg-[#0b141a] p-3 min-h-[260px] rounded-b-xl flex flex-col justify-end space-y-2 text-[11px]">
                    {/* Media preview tag if attached */}
                    {formFilePaths.length > 0 && (
                      <div className="self-end bg-[#005c4b] p-2 rounded-xl text-white max-w-[85%] text-[10px] space-y-1 shadow">
                        <div className="flex items-center space-x-1 text-emerald-200 font-semibold">
                          <Paperclip className="w-3 h-3" />
                          <span>{formFilePaths.length} attachment(s)</span>
                        </div>
                      </div>
                    )}

                    {/* Chat Bubble */}
                    <div className="self-end bg-[#005c4b] text-slate-100 p-2.5 rounded-2xl rounded-tr-sm max-w-[90%] shadow text-[11px] leading-relaxed break-words space-y-1">
                      <div
                        dangerouslySetInnerHTML={{ __html: formatWhatsAppText(formMessage) }}
                      />
                      <div className="flex items-center justify-end space-x-1 text-[9px] text-emerald-200/80 pt-0.5">
                        <span>12:00 PM</span>
                        <CheckCheck className="w-3 h-3 text-cyan-300" />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-3 text-center">
                  Live WhatsApp Message Preview
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
