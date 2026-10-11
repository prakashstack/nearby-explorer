import React, { useState } from 'react';
import { AlertTriangle, Key, X, Sparkles, MapPin } from 'lucide-react';

export function AlertBanner({ hasGeoapify, hasGemini, onOpenSettings }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (hasGeoapify && hasGemini)) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-3 pb-1">
      <div className="relative rounded-2xl p-3 bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-blue-500/15 backdrop-blur-xl border border-amber-500/30 shadow-lg flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
            <Key className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-white flex items-center gap-2">
              <span>Running in Live Preview Mode</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Demo
              </span>
            </div>
            <p className="text-slate-300 truncate mt-0.5">
              {!hasGeoapify && !hasGemini
                ? 'Using built-in sample places & mock Gemini insights. Add your API keys for live live data!'
                : !hasGeoapify
                ? 'Geoapify key missing. Using simulated places and walking routing.'
                : 'Gemini key missing. Add your Google Gen AI key for live insights.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold transition-all active:scale-95"
          >
            Configure
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 rounded-full text-slate-400 hover:text-white flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
