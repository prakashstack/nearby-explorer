import React, { useState } from 'react';
import { X, Key, ExternalLink, Check, Trash2, Sparkles, MapPin } from 'lucide-react';
import { getGeoapifyKey, getGeminiKey, setCustomKeys } from '../services/apiKeys';

export function ApiKeysModal({ isOpen, onClose }) {
  const [geoKey, setGeoKey] = useState(getGeoapifyKey());
  const [gemKey, setGemKey] = useState(getGeminiKey());
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setGeoKey(getGeoapifyKey());
      setGemKey(getGeminiKey());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setCustomKeys(geoKey, gemKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setGeoKey('');
    setGemKey('');
    setCustomKeys('', '');
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/90 border border-white/20 p-6 shadow-2xl backdrop-blur-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">API Settings</h3>
            <p className="text-xs text-slate-400">Configure or test your API credentials</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Geoapify Key Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Geoapify API Key
                {import.meta.env.VITE_GEOAPIFY_API_KEY && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                    .env
                  </span>
                )}
              </label>
              <a
                href="https://www.geoapify.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-0.5"
              >
                Get Key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="text"
              value={geoKey}
              onChange={(e) => setGeoKey(e.target.value)}
              placeholder="e.g. 4a9f... (or leave blank for demo mode)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-mono text-white placeholder-slate-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Powers Geoapify Places, Tiles, and Walking Routing APIs.
            </p>
          </div>

          {/* Gemini Key Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Google Gemini API Key
                {import.meta.env.VITE_GEMINI_API_KEY && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                    .env
                  </span>
                )}
              </label>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-400 hover:underline flex items-center gap-0.5"
              >
                Get Key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={gemKey}
              onChange={(e) => setGemKey(e.target.value)}
              placeholder="AIzaSy... (or leave blank for demo tips)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-mono text-white placeholder-slate-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Powers client-side Google Gen AI SDK with <code className="text-purple-300">gemini-3.8-flash</code>.
            </p>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 bg-white/5 p-3 rounded-xl border border-white/10">
            💡 <strong>Note:</strong> You can also set these inside <code className="text-blue-300">.env</code> as <code className="text-blue-300">VITE_GEOAPIFY_API_KEY</code> and <code className="text-purple-300">VITE_GEMINI_API_KEY</code>.
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Keys
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save & Apply</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
