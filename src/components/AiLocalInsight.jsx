import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import { fetchLocalInsight } from '../services/gemini';
import { getGeminiKey } from '../services/apiKeys';

export function AiLocalInsight({ place }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [modelName, setModelName] = useState('Gemini 2.5 Flash');
  const [error, setError] = useState(null);

  const apiKey = getGeminiKey();

  const loadInsight = async (forceRefresh = false) => {
    if (!place?.id) return;

    if (forceRefresh) {
      localStorage.removeItem(`cache_gemini_guide_v3_${place.id}`);
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchLocalInsight({
        place,
        apiKey,
      });

      setInsight(res.text);
      setFromCache(res.fromCache);
      if (res.model) {
        setModelName(res.model.replace('(demo)', '').replace('(fallback)', '').trim());
      }
    } catch (err) {
      console.error('Failed to fetch Gemini insight:', err);
      setError('Could not generate insight at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsight();
  }, [place?.id, apiKey]);

  return (
    <div className="w-full relative apple-intelligence-glow p-5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl bg-slate-900/40 border border-white/20">
      {/* Background ambient gradient glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-gradient-to-tr from-blue-500/20 to-teal-500/10 blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-0.5 shadow-md shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950/70 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                A Little Local Insight
              </h3>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {modelName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Apple Intelligence Insider Guide</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fromCache && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              Cached
            </span>
          )}

          <button
            onClick={() => loadInsight(true)}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            title="Regenerate insider tip"
            aria-label="Regenerate insight"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Insight Content */}
      <div className="relative z-10 mt-2">
        {loading ? (
          /* Shimmer Skeleton Loader */
          <div className="space-y-2.5 py-1">
            <div className="h-4 rounded-xl animate-shimmer w-full" />
            <div className="h-4 rounded-xl animate-shimmer w-5/6" />
            <div className="h-4 rounded-xl animate-shimmer w-3/4" />
          </div>
        ) : error ? (
          <p className="text-xs text-rose-300">{error}</p>
        ) : (
          <div className="space-y-3 text-sm sm:text-base font-normal text-slate-100 leading-relaxed tracking-normal selection:bg-purple-500/40">
            {(insight || '')
              .split(/\n\s*\n/)
              .map((paragraph) => paragraph.replace(/^\s*(?:[-*•]|\d+[.)])\s*/gm, '').trim())
              .filter(Boolean)
              .map((paragraph, index) => <p key={`${index}-${paragraph}`}>{paragraph}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}
