import React, { useEffect, useRef, useState } from 'react';
import { RotateCw, Smartphone, Monitor, WifiOff, Loader2 } from 'lucide-react';
import { CodeState } from '../types';

interface WorkspaceProps {
  code: CodeState;
  isBuilding: boolean;
}

const Workspace: React.FC<WorkspaceProps> = ({ code, isBuilding }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(false);
  const [activeSrcDoc, setActiveSrcDoc] = useState("");

  const handleManualRefresh = () => {
    setLoading(true);
    setKey(prev => prev + 1);
    setTimeout(() => setLoading(false), 500);
  };

  // Construct the HTML document
  const getSrcDoc = () => {
    let fullHtml = code.html || "";
    if (!fullHtml.trim()) return "";

    if (!fullHtml.trim().toLowerCase().startsWith('<!doctype html')) {
        fullHtml = `<!DOCTYPE html>\n${fullHtml}`;
    }

    if (code.css && code.css.trim().length > 0) {
        const styleTag = `<style>\n${code.css}\n</style>`;
        if (fullHtml.includes('</head>')) {
            fullHtml = fullHtml.replace('</head>', `${styleTag}\n</head>`);
        } else if (fullHtml.includes('<body')) {
             fullHtml = fullHtml.replace('<body', `${styleTag}\n<body`);
        } else {
            fullHtml += styleTag;
        }
    }

    if (code.js && code.js.trim().length > 0) {
        const scriptTag = `<script>\n(function(){\ntry {\n${code.js}\n} catch(e) { console.error("JS Error:", e); }\n})();\n</script>`;
        if (fullHtml.includes('</body>')) {
            fullHtml = fullHtml.replace('</body>', `${scriptTag}\n</body>`);
        } else {
             fullHtml += scriptTag;
        }
    }
    return fullHtml;
  };

  // Only update the iframe content when we are NOT in building mode
  useEffect(() => {
    if (!isBuilding) {
        const newDoc = getSrcDoc();
        // Small optimization: only update if changed
        if (newDoc !== activeSrcDoc) {
            setActiveSrcDoc(newDoc);
        }
    }
    // If isBuilding is true, we do NOTHING to activeSrcDoc.
    // This effectively freezes the preview on the previous state while the overlay is shown.
  }, [code, isBuilding]);


  return (
    <div className="flex flex-col h-full bg-gray-100 relative">
      {/* Toolbar */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
             {/* Manual Refresh Button */}
             <button 
                onClick={handleManualRefresh}
                className={`p-2 text-gray-500 hover:text-black transition-transform rounded-full hover:bg-gray-100 ${loading ? 'animate-spin' : ''}`}
                title="Reload Preview (Use if connection fails)"
            >
                <RotateCw size={18} />
            </button>
            
            <div className="h-4 w-px bg-gray-300"></div>
            
            {/* Device Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
               <button 
                  onClick={() => setDeviceMode('desktop')}
                  className={`p-1.5 rounded-md transition-all ${deviceMode === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 <Monitor size={16} />
               </button>
               <button 
                  onClick={() => setDeviceMode('mobile')}
                  className={`p-1.5 rounded-md transition-all ${deviceMode === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 <Smartphone size={16} />
               </button>
            </div>
        </div>
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Preview Build</span>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4 pb-32 checkerboard-bg relative w-full">
        
        {/* Building Overlay */}
        {isBuilding && (
            <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-4">
                    <Loader2 size={32} className="text-indigo-600 animate-spin" />
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-800">Building Interface...</h3>
                        <p className="text-sm text-gray-500">Constructing pixel-perfect layout</p>
                    </div>
                </div>
            </div>
        )}

        <div 
            className={`
                transition-all duration-500 bg-white shadow-2xl overflow-hidden relative
                ${deviceMode === 'mobile' ? 'w-[375px] h-[812px] max-h-full rounded-[3rem] border-[8px] border-gray-800' : 'w-full h-full rounded-lg border border-gray-200'}
            `}
        >
            {deviceMode === 'mobile' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-6 bg-gray-800 rounded-b-xl z-20 pointer-events-none"></div>
            )}
            
            <iframe
                key={key}
                ref={iframeRef}
                srcDoc={activeSrcDoc}
                title="Preview"
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
            />

            {!activeSrcDoc && !isBuilding && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                    <WifiOff size={48} className="mb-4 opacity-50" />
                    <p>Ready to code.</p>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Workspace;