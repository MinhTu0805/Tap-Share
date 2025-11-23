import React, { useState } from 'react';
import { ShieldCheck, ScrollText, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onAccept }) => {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 20;
    if (bottom) {
      setScrolledToBottom(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Terms of Use</h2>
            <p className="text-sm text-slate-500">Please review before continuing</p>
          </div>
        </div>

        {/* Content */}
        <div 
          className="p-6 max-h-[400px] overflow-y-auto space-y-4 text-sm text-slate-600 leading-relaxed scrollbar-thin"
          onScroll={handleScroll}
        >
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 mb-4">
            <ScrollText size={18} className="shrink-0 mt-0.5" />
            <p className="font-medium text-xs">
              Welcome to Gemini Coder. By using this AI-powered application, you agree to the following terms.
            </p>
          </div>

          <h3 className="font-bold text-slate-900">1. AI Generation Disclaimer</h3>
          <p>
            This application uses Google Gemini to generate code and content. AI models can make mistakes ("hallucinations"). You acknowledge that the generated code may not be bug-free, secure, or optimized for production environments. You are responsible for reviewing and testing all code before deployment.
          </p>

          <h3 className="font-bold text-slate-900">2. User Responsibility</h3>
          <p>
            You agree not to use this tool to generate harmful, illegal, misleading, or abusive content. You retain ownership of the input you provide, and you are responsible for the output you use.
          </p>

          <h3 className="font-bold text-slate-900">3. Web Replication</h3>
          <p>
            The "Replicate Website" feature is for educational and legitimate development purposes only. Do not use this tool to infringe on copyrights, trademarks, or to create phishing sites.
          </p>

          <h3 className="font-bold text-slate-900">4. No Warranty</h3>
          <p>
            The software is provided "as is", without warranty of any kind, express or implied. We are not liable for any damages arising from the use of this software.
          </p>

          <div className="pt-4 text-xs text-slate-400">
            Last updated: February 2025
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                className="peer sr-only"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              />
              <div className={`w-5 h-5 border-2 rounded-md transition-all flex items-center justify-center
                ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white group-hover:border-blue-400'}
              `}>
                {isChecked && <CheckCircle2 size={14} className="text-white" />}
              </div>
            </div>
            <span className="text-sm font-medium text-slate-700 select-none">
              I have read and agree to the Terms of Service
            </span>
          </label>

          <button
            onClick={onAccept}
            disabled={!isChecked}
            className={`
              w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200
              ${isChecked 
                ? 'bg-slate-900 text-white shadow-lg hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.99]' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
            `}
          >
            Enter Studio
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;