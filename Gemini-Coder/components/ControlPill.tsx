import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, Globe, X, Loader2, Sparkles, ChevronDown, ChevronUp, Terminal, Bot } from 'lucide-react';
import { GenerationMetrics } from '../types';
import { analyzeUrl } from '../services/geminiService';

interface ControlPillProps {
  onSend: (prompt: string, imageBase64?: string, urlContext?: string) => void;
  metrics: GenerationMetrics;
}

const ControlPill: React.FC<ControlPillProps> = ({ onSend, metrics }) => {
  const [prompt, setPrompt] = useState('');
  
  // URL Analysis State
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingSite, setIsFetchingSite] = useState(false);
  const [fetchedSite, setFetchedSite] = useState<{ url: string; context: string } | null>(null);

  const [image, setImage] = useState<{ preview: string; base64: string } | null>(null);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isUrlMode) {
        handleFetchSite();
      } else {
        handleSend();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        setImage({ preview: result, base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = '24px'; // Reset to recalculate
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [prompt]);

  // Auto-expand when thinking starts
  useEffect(() => {
    if (metrics.isThinking) {
      setIsThinkingExpanded(true);
    }
  }, [metrics.isThinking]);

  const handleFetchSite = async () => {
    if (!urlInput.trim() || isFetchingSite) return;
    
    setIsFetchingSite(true);
    try {
        const context = await analyzeUrl(urlInput);
        setFetchedSite({ url: urlInput, context });
        setIsUrlMode(false);
        setUrlInput('');
    } catch (e) {
        console.error("Failed to fetch", e);
    } finally {
        setIsFetchingSite(false);
    }
  };

  const handleSend = () => {
    if ((!prompt.trim() && !image && !fetchedSite) || metrics.isThinking) return;
    
    // If no prompt is provided but a site was fetched, default to replication
    const finalPrompt = prompt.trim() 
        ? prompt 
        : fetchedSite 
            ? "Replicate this website exactly based on the analyzed blueprint." 
            : "";

    if (!finalPrompt && !image) return;

    onSend(finalPrompt, image?.base64, fetchedSite?.context);
    
    setPrompt('');
    setImage(null);
    setFetchedSite(null); // Clear fetched context after sending
    if (textareaRef.current) textareaRef.current.style.height = '24px';
  };

  const getShortUrl = (url: string) => {
      try {
          const hostname = new URL(url).hostname;
          return hostname.replace('www.', '');
      } catch (e) {
          return url.length > 20 ? url.substring(0, 20) + '...' : url;
      }
  }

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[92%] max-w-2xl z-50 flex flex-col gap-3">
      
      {/* 1. SEPARATE AI PREVIEW TABLE (Floating Panel) */}
      {(metrics.isThinking || metrics.thoughtProcess) && (
        <div className="absolute bottom-full left-0 w-full mb-3 animate-in slide-in-from-bottom-4 fade-in duration-300 z-10">
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl overflow-hidden ring-1 ring-gray-900/5">
                {/* Header / Status Bar */}
                <div 
                    className="flex items-center justify-between px-4 py-3 bg-white/50 border-b border-gray-100/50 cursor-pointer hover:bg-white/80 transition-colors"
                    onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${metrics.isThinking ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {metrics.isThinking ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                {metrics.isThinking ? 'Architect Mode' : 'System Ready'}
                            </span>
                            <span className="text-sm font-semibold text-gray-800">
                                {metrics.isThinking ? 'Generating Architecture...' : 'Design Complete'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <span className="font-mono text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                            {metrics.duration.toFixed(1)}s
                        </span>
                        <div className="p-1 text-gray-400 hover:text-gray-600">
                             {isThinkingExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </div>
                    </div>
                </div>

                {/* Dropdown Content (The "Separate Table") */}
                {isThinkingExpanded && (
                    <div className="p-4 bg-gray-50/50">
                        <div className="flex gap-3">
                            <div className="shrink-0 mt-0.5 text-gray-400">
                                <Terminal size={14} />
                            </div>
                            <div className="flex-1 font-mono text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {metrics.isThinking 
                                ? <span className="animate-pulse">Analyzing prompt requirements and constructing component tree...</span> 
                                : metrics.thoughtProcess || "Waiting for next instruction."}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* 2. ATTACHMENT BADGES */}
      <div className="flex items-center gap-2 ml-1">
          {image && (
            <div className="self-start bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-2 animate-fade-in-up">
              <img src={image.preview} alt="Upload" className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
              <button onClick={() => setImage(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
          
          {fetchedSite && (
            <div className="self-start bg-blue-50/90 backdrop-blur-md py-2 px-3 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-3 animate-fade-in-up max-w-[200px]">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                  <Globe size={20} />
              </div>
              <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Analyzed</span>
                  <span className="text-sm font-medium text-blue-900 truncate">{getShortUrl(fetchedSite.url)}</span>
              </div>
              <button onClick={() => setFetchedSite(null)} className="p-1 hover:bg-blue-100 rounded-full text-blue-400 hover:text-blue-600 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
      </div>

      {/* 3. MAIN INPUT PILL (Always Rounded Full) */}
      <div className="bg-white shadow-2xl border border-gray-200/80 transition-all duration-300 overflow-hidden rounded-[36px]">
        <div className="flex flex-col w-full">
            
            {/* Input Area */}
            <div className="w-full flex items-center px-3 py-3 gap-2">
                 
                 {/* Tools Group */}
                 {!isUrlMode && (
                     <div className="flex items-center gap-1 pr-2 border-r border-gray-100">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                            title="Attach Image"
                        >
                            <Paperclip size={20} />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange}
                        />

                        <button 
                            onClick={() => setIsUrlMode(true)}
                            className={`p-2.5 rounded-full transition-all text-gray-400 hover:text-gray-700 hover:bg-gray-100`}
                            title="Replicate Website"
                        >
                            <Globe size={20} />
                        </button>
                     </div>
                 )}

                 {/* Input Field Logic */}
                 <div className="flex-1 relative flex items-center min-h-[44px] min-w-0">
                     {isUrlMode ? (
                         <div className="flex items-center w-full gap-2 animate-in slide-in-from-left-4 duration-200">
                             <Globe size={20} className="text-blue-500 shrink-0 ml-1" />
                             <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-[15px] font-medium px-2 min-w-0"
                                onKeyDown={handleKeyDown}
                                autoFocus
                             />
                             <button 
                                onClick={() => setIsUrlMode(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 shrink-0"
                             >
                                <X size={18} />
                             </button>
                         </div>
                     ) : (
                        <textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                fetchedSite 
                                    ? "Describe changes (or leave empty to replicate exactly)..." 
                                    : image 
                                        ? "What should I do with this image?" 
                                        : "Describe your app idea..."
                            }
                            className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-[15px] font-medium resize-none py-2 px-2 max-h-[120px] leading-relaxed"
                            rows={1}
                        />
                     )}
                 </div>

                 {/* Action Button */}
                 {isUrlMode ? (
                    <button
                        onClick={handleFetchSite}
                        disabled={isFetchingSite || !urlInput}
                        className="h-11 px-4 rounded-full flex items-center gap-2 justify-center shrink-0 transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {isFetchingSite ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Fetching...</span>
                            </>
                        ) : (
                            <span>Fetch Site</span>
                        )}
                    </button>
                 ) : (
                    <button
                        onClick={handleSend}
                        disabled={metrics.isThinking || (!prompt && !image && !fetchedSite)}
                        className={`
                            h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                            ${metrics.isThinking || (!prompt && !image && !fetchedSite)
                                ? 'bg-gray-100 cursor-not-allowed' 
                                : 'bg-black hover:bg-gray-800 hover:scale-105 shadow-md active:scale-95'}
                        `}
                    >
                        {metrics.isThinking ? (
                            <Loader2 size={20} className="text-gray-400 animate-spin" />
                        ) : (
                            <ArrowUp size={22} className="text-white" />
                        )}
                    </button>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPill;