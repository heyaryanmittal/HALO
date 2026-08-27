import React, { useState, useEffect, useRef } from 'react';
import socket from '../services/socket';
import { 
  Play, 
  Pause, 
  Square, 
  FastForward, 
  Send, 
  Users, 
  FileText, 
  Sliders, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Flame, 
  Upload, 
  RefreshCw,
  Info,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export default function DashboardPage({ isAuthenticated, userInfo, onOpenQR, onLogout, isLoggingOut }) {
  // Data state
  const [contactGroups, setContactGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({ totalSent: 0, totalCampaigns: 0, daily: [] });
  
  // Form configuration state
  const [sourceType, setSourceType] = useState('group'); // 'group' | 'file'
  const [selectedGroup, setSelectedGroup] = useState('');
  const [contactFile, setContactFile] = useState(null);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  
  // Timing and simulation state
  const [minDelay, setMinDelay] = useState(15);
  const [maxDelay, setMaxDelay] = useState(45);
  const [batchSize, setBatchSize] = useState(20);
  const [dailyLimit, setDailyLimit] = useState(200);
  const [minTypingDelay, setMinTypingDelay] = useState(3000);
  const [maxTypingDelay, setMaxTypingDelay] = useState(7000);
  const [minAttachDelay, setMinAttachDelay] = useState(1000);
  const [maxAttachDelay, setMaxAttachDelay] = useState(3000);
  const [simulationStyle, setSimulationStyle] = useState('random');
  const [simulateReading, setSimulateReading] = useState(true);
  const [warmUpEnabled, setWarmUpEnabled] = useState(false);
  const [warmUpStart, setWarmUpStart] = useState(20);
  const [warmUpIncrement, setWarmUpIncrement] = useState(10);
  const [warmUpDays, setWarmUpDays] = useState(7);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Live Campaign & Log state
  const [campaignState, setCampaignState] = useState({
    isRunning: false,
    isPaused: false,
    sent: 0,
    failed: 0,
    total: 0,
    current: 0,
  });
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Fetch groups, templates, and stats
  const fetchData = async () => {
    try {
      const [groupsRes, templatesRes, statsRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/templates'),
        fetch('/api/stats')
      ]);
      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setContactGroups(data);
        if (data.length > 0 && !selectedGroup) setSelectedGroup(data[0].name);
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data);
        if (data.length > 0 && selectedTemplateIds.length === 0) {
          setSelectedTemplateIds([String(data[0].id)]);
        }
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to socket events
    const handleCampaignState = (state) => {
      setCampaignState(state);
    };

    const handleLog = (logMessage) => {
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          timestamp: new Date().toLocaleTimeString(),
          message: logMessage,
        },
      ]);
    };

    socket.on('campaignState', handleCampaignState);
    socket.on('log', handleLog);

    return () => {
      socket.off('campaignState', handleCampaignState);
      socket.off('log', handleLog);
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleTemplateToggle = (id) => {
    const stringId = String(id);
    setSelectedTemplateIds((prev) => 
      prev.includes(stringId) 
        ? prev.filter((item) => item !== stringId)
        : [...prev, stringId]
    );
  };

  const handleStartCampaign = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please authenticate your WhatsApp account first.');
      onOpenQR();
      return;
    }
    if (selectedTemplateIds.length === 0) {
      alert('Please select at least one message template.');
      return;
    }
    if (sourceType === 'group' && !selectedGroup) {
      alert('Please select a contact group.');
      return;
    }
    if (sourceType === 'file' && !contactFile) {
      alert('Please select a contact CSV/Excel file to upload.');
      return;
    }

    const formData = new FormData();
    if (sourceType === 'group') {
      formData.append('contactGroup', selectedGroup);
    } else {
      formData.append('contactFile', contactFile);
    }

    selectedTemplateIds.forEach((id) => formData.append('templateIds', id));
    formData.append('minDelay', minDelay);
    formData.append('maxDelay', maxDelay);
    formData.append('batchSize', batchSize);
    formData.append('dailyLimit', dailyLimit);
    formData.append('minTypingDelay', minTypingDelay);
    formData.append('maxTypingDelay', maxTypingDelay);
    formData.append('minAttachDelay', minAttachDelay);
    formData.append('maxAttachDelay', maxAttachDelay);
    formData.append('simulationStyle', simulationStyle);
    if (simulateReading) formData.append('simulateReading', 'on');
    if (warmUpEnabled) {
      formData.append('warmUpEnabled', 'on');
      formData.append('warmUpStart', warmUpStart);
      formData.append('warmUpIncrement', warmUpIncrement);
      formData.append('warmUpDays', warmUpDays);
    }

    try {
      const res = await fetch('/api/campaign/start', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (!result.success) {
        alert(result.message || 'Failed to start campaign');
      }
    } catch (err) {
      console.error('Error starting campaign:', err);
      alert('Network error while starting campaign');
    }
  };

  const handlePause = () => socket.emit('pauseCampaign');
  const handleResume = () => socket.emit('resumeCampaign');
  const handleEnd = () => {
    if (window.confirm('Are you sure you want to stop the campaign and save the report?')) {
      socket.emit('endCampaign');
    }
  };
  const handleSendNextBatch = () => socket.emit('sendNextBatch');

  const progressPercent = campaignState.total > 0 
    ? Math.round((campaignState.current / campaignState.total) * 100) 
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Dispatched</p>
              <p className="text-2xl font-black text-white mt-1">{stats.totalSent.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-400">
            <span>Across all campaigns</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campaigns Run</p>
              <p className="text-2xl font-black text-white mt-1">{stats.totalCampaigns || 0}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-indigo-400">
            <span>Historical logs saved</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Status</p>
              <p className="text-lg font-bold text-white mt-1">
                {campaignState.isRunning 
                  ? (campaignState.isPaused ? 'Paused' : 'Sending...') 
                  : 'Idle'}
              </p>
            </div>
            <div className={`p-3 rounded-xl border ${
              campaignState.isRunning 
                ? (campaignState.isPaused 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse') 
                : 'bg-slate-800/60 text-slate-400 border-slate-700'
            }`}>
              <RefreshCw className={`w-5 h-5 ${campaignState.isRunning && !campaignState.isPaused ? 'animate-spin' : ''}`} />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-400">
            <span>{campaignState.sent} sent / {campaignState.failed} failed</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WhatsApp Session</p>
              <p className="text-lg font-bold text-white mt-1">
                {isAuthenticated ? (userInfo?.number ? `+${userInfo.number}` : 'Connected') : 'Not Connected'}
              </p>
            </div>
            <div className={`p-3 rounded-xl border ${
              isAuthenticated 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            {!isAuthenticated ? (
              <button onClick={onOpenQR} className="text-rose-400 hover:underline font-medium">
                Click here to scan QR code &rarr;
              </button>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-emerald-400 font-medium">
                  {userInfo?.pushname ? `${userInfo.pushname} • Active` : 'Linked & Ready'}
                </span>
                <button
                  type="button"
                  onClick={onOpenQR}
                  className="text-xs text-slate-400 hover:text-emerald-400 underline transition-colors"
                >
                  Manage
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Campaign Launch & Active Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Campaign Setup Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleStartCampaign} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Campaign Launcher</h3>
                  <p className="text-xs text-slate-400">Configure contacts, message rotation, and anti-ban delays</p>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchData}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Refresh options"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Contact Source Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Select Contact Audience</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSourceType('group')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                    sourceType === 'group'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Saved Group</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('file')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                    sourceType === 'file'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Direct File Upload</span>
                </button>
              </div>

              {sourceType === 'group' ? (
                <div>
                  {contactGroups.length === 0 ? (
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-400">
                      No contact groups saved yet. Go to <strong className="text-slate-200">Contacts</strong> tab to upload one or choose direct upload.
                    </div>
                  ) : (
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      {contactGroups.map((g) => (
                        <option key={g.name} value={g.name}>
                          {g.name} {g.progress > 0 ? `(Resumes from #${g.progress})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl text-center bg-slate-900/40 transition-colors">
                  <input
                    type="file"
                    id="contactUpload"
                    accept=".csv, .xlsx, .xls"
                    onChange={(e) => setContactFile(e.target.files[0])}
                    className="hidden"
                  />
                  <label htmlFor="contactUpload" className="cursor-pointer flex flex-col items-center justify-center">
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-200">
                      {contactFile ? contactFile.name : 'Click to select CSV or Excel (.xlsx/.xls) file'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">Must contain column named 'number'</span>
                  </label>
                </div>
              )}
            </div>

            {/* 2. Message Templates Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. Select Message Templates</span>
                </label>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {selectedTemplateIds.length} template(s) selected
                </span>
              </div>

              {templates.length === 0 ? (
                <div className="p-4 bg-slate-900/60 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-400">
                  No templates created yet. Go to <strong className="text-slate-200">Templates</strong> tab to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {templates.map((t) => {
                    const isSelected = selectedTemplateIds.includes(String(t.id));
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleTemplateToggle(t.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">{t.name}</span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{t.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Anti-Ban Throttling Settings */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. Dispatch & Anti-Ban Rate Limiting</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-emerald-400 hover:underline font-medium"
                >
                  {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Min Delay (sec)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={minDelay}
                    onChange={(e) => setMinDelay(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Max Delay (sec)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={maxDelay}
                    onChange={(e) => setMaxDelay(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Batch Size</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Daily Limit</label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {showAdvanced && (
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-4 animate-fade-in text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400">Min Typing Delay (ms)</label>
                      <input
                        type="number"
                        value={minTypingDelay}
                        onChange={(e) => setMinTypingDelay(Number(e.target.value))}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400">Max Typing Delay (ms)</label>
                      <input
                        type="number"
                        value={maxTypingDelay}
                        onChange={(e) => setMaxTypingDelay(Number(e.target.value))}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <input
                      type="checkbox"
                      id="warmup"
                      checked={warmUpEnabled}
                      onChange={(e) => setWarmUpEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-900"
                    />
                    <label htmlFor="warmup" className="text-slate-300 font-medium cursor-pointer">
                      Enable Warm-up Mode (gradually ramp up messages for fresh numbers)
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Launch Campaign Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={campaignState.isRunning}
                className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                  campaignState.isRunning
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 active:scale-[0.99]'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{campaignState.isRunning ? 'Campaign is Currently Running...' : 'Launch WhatsApp Campaign'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Campaign Progress & Activity Logs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Campaign Progress Monitor */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${campaignState.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                <span>Live Campaign Tracker</span>
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                {progressPercent}% Complete
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Contact {campaignState.current} of {campaignState.total}</span>
                <span>{campaignState.sent} Success • {campaignState.failed} Failed</span>
              </div>
            </div>

            {/* Campaign Control Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {campaignState.isPaused ? (
                <button
                  type="button"
                  onClick={handleResume}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-md shadow-emerald-600/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  disabled={!campaignState.isRunning}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                    campaignState.isRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleStop}
                disabled={!campaignState.isRunning}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                  campaignState.isRunning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop & Save</span>
              </button>

              <button
                type="button"
                onClick={handleSendNextBatch}
                disabled={!campaignState.isRunning}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                  campaignState.isRunning
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <FastForward className="w-3.5 h-3.5 fill-current" />
                <span>Next Batch</span>
              </button>
            </div>
          </div>

          {/* Real-time Activity Logs Terminal */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Live Activity Stream</span>
              </div>
              <button
                onClick={() => setLogs([])}
                className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                Clear Log
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 font-mono text-[11px] h-64 overflow-y-auto space-y-1.5 text-slate-300">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic py-10 text-center">
                  Waiting for campaign actions... Live events will appear here.
                </div>
              ) : (
                logs.map((log, index) => {
                  const isError = log.text.toLowerCase().includes('error') || log.text.toLowerCase().includes('failed');
                  const isSuccess = log.text.toLowerCase().includes('success') || log.text.toLowerCase().includes('connected');
                  const isWarning = log.text.toLowerCase().includes('paused') || log.text.toLowerCase().includes('warm-up');
                  return (
                    <div key={index} className="flex items-start space-x-2 leading-relaxed">
                      <span className="text-slate-600 select-none">[{log.time}]</span>
                      <span className={
                        isError ? 'text-rose-400 font-semibold' :
                        isSuccess ? 'text-emerald-400' :
                        isWarning ? 'text-amber-400' :
                        'text-slate-300'
                      }>
                        {log.text}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
