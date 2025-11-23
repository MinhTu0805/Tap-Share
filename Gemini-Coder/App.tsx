import React, { useState, useEffect, useRef } from 'react';
import { Tab, CodeState, GenerationMetrics, PaneMode } from './types';
import CodeEditor from './components/CodeEditor';
import Workspace from './components/Workspace';
import ControlPill from './components/ControlPill';
import TermsModal from './components/TermsModal';
import { generateCode, analyzeUrl } from './services/geminiService';
import { Code, Eye, Layout, Download, Copy, Check } from 'lucide-react';

function App() {
  // State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HTML);
  const [mobilePane, setMobilePane] = useState<PaneMode>(PaneMode.PREVIEW);
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  
  // Initial State - Full HTML Document
  const [code, setCode] = useState<CodeState>({
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini Coder</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 text-slate-800 h-screen flex flex-col items-center justify-center relative overflow-hidden">
    
    <!-- Decorative Background -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-300 blur-[100px]"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-300 blur-[100px]"></div>
    </div>

    <div class="text-center space-y-6 p-8 max-w-2xl animate-fade-in-up">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-200 mb-4">
            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span class="text-xs font-medium text-slate-500">System Online</span>
        </div>
        
        <h1 class="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            What shall we build?
        </h1>
        
        <p class="text-lg text-slate-500 max-w-lg mx-auto">
            I am ready to replicate websites or design new applications. Describe your idea or paste a URL below.
        </p>
    </div>

</body>
</html>`,
    css: `/* Custom styles go here */
body { font-family: 'Inter', sans-serif; }`,
    js: `// Interactive logic goes here
console.log("System Ready");`
  });

  const [metrics, setMetrics] = useState<GenerationMetrics>({
    duration: 0,
    isThinking: false,
    thoughtProcess: ''
  });

  // Check Local Storage for Terms Acceptance
  useEffect(() => {
    const accepted = localStorage.getItem('gemini_code_studio_terms_accepted');
    if (accepted === 'true') {
      setHasAcceptedTerms(true);
    }
  }, []);

  const handleAcceptTerms = () => {
    localStorage.setItem('gemini_code_studio_terms_accepted', 'true');
    setHasAcceptedTerms(true);
  };

  // Timer for Thinking Mode
  useEffect(() => {
    let interval: any;
    if (metrics.isThinking) {
      interval = setInterval(() => {
        setMetrics(m => ({ ...m, duration: m.duration + 0.1 }));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [metrics.isThinking]);

  // Handlers
  const handleCodeChange = (field: keyof CodeState, value: string) => {
    setCode(prev => ({ ...prev, [field]: value }));
  };

  const handleCopy = () => {
    const content = activeTab === Tab.HTML ? code.html : activeTab === Tab.CSS ? code.css : code.js;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const cssBlob = new Blob([code.css], { type: 'text/css' });
    const cssUrl = URL.createObjectURL(cssBlob);
    const cssLink = document.createElement('a');
    cssLink.href = cssUrl;
    cssLink.download = 'style.css';
    cssLink.click();

    const jsBlob = new Blob([code.js], { type: 'text/javascript' });
    const jsUrl = URL.createObjectURL(jsBlob);
    const jsLink = document.createElement('a');
    jsLink.href = jsUrl;
    jsLink.download = 'script.js';
    jsLink.click();

    let finalHtml = code.html;
    if (!finalHtml.includes('style.css')) {
      finalHtml = finalHtml.replace('</head>', '    <link rel="stylesheet" href="style.css">\n</head>');
    }
    if (!finalHtml.includes('script.js')) {
      finalHtml = finalHtml.replace('</body>', '    <script src="script.js"></script>\n</body>');
    }

    const htmlBlob = new Blob([finalHtml], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    const htmlLink = document.createElement('a');
    htmlLink.href = htmlUrl;
    htmlLink.download = 'index.html';
    htmlLink.click();
  };

  const animateCodeTyping = (targetCode: CodeState) => {
    setIsTyping(true);
    setCode({ html: '', css: '', js: '' }); // Clear to start typing effect

    let step = 0;
    const totalSteps = 40; // Total animation frames
    const intervalTime = 30; // ms per frame

    const interval = setInterval(() => {
      step++;
      const progress = step / totalSteps;
      
      // Easing function for smoother feel
      const ease = (t: number) => t * (2 - t);
      const easedProgress = ease(progress);

      setCode({
        html: targetCode.html.substring(0, Math.ceil(targetCode.html.length * easedProgress)),
        css: targetCode.css.substring(0, Math.ceil(targetCode.css.length * easedProgress)),
        js: targetCode.js.substring(0, Math.ceil(targetCode.js.length * easedProgress))
      });

      if (step >= totalSteps) {
        clearInterval(interval);
        setCode(targetCode); // Ensure exact final code
        setIsTyping(false);
      }
    }, intervalTime);
  };

  const handleSend = async (prompt: string, imageBase64?: string, urlContext?: string) => {
    setMetrics({ duration: 0, isThinking: true, thoughtProcess: '' });
    
    try {
      setMetrics(prev => ({ ...prev, thoughtProcess: 'Designing architecture and writing code...' }));

      const result = await generateCode(prompt, code, imageBase64, urlContext);

      setMetrics(prev => ({ 
        ...prev, 
        isThinking: false, 
        thoughtProcess: result.thought || 'Build complete.' 
      }));

      // Start Typewriter Effect
      animateCodeTyping({
        html: result.html || code.html,
        css: result.css || code.css,
        js: result.js || code.js
      });
      
      // Switch to preview on mobile automatically
      setMobilePane(PaneMode.PREVIEW);

    } catch (error) {
      console.error(error);
      setMetrics(prev => ({ 
        ...prev, 
        isThinking: false, 
        thoughtProcess: 'Error encountered. Please try again.' 
      }));
    }
  };

  return (
    <>
      {/* Terms Modal Overlay */}
      {!hasAcceptedTerms && <TermsModal onAccept={handleAcceptTerms} />}

      <div className={`h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-white relative transition-opacity duration-500 ${!hasAcceptedTerms ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Pane 1: Editor */}
        <div className={`
          flex-1 flex flex-col h-full border-r border-gray-200 transition-all duration-300
          ${mobilePane === PaneMode.PREVIEW ? 'hidden md:flex' : 'flex'}
        `}>
          {/* Tabs & Toolbar */}
          <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-2 shrink-0">
            <div className="flex items-center gap-1 p-2">
              <Layout className="w-5 h-5 text-indigo-600 mr-2" />
              <span className="font-bold text-gray-700 text-sm tracking-tight hidden sm:inline">Gemini Coder</span>
            </div>
            
            <div className="flex-1 flex justify-center">
               {Object.values(Tab).map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`
                     px-4 md:px-6 py-3 text-sm font-medium border-b-2 transition-colors
                     ${activeTab === tab 
                       ? 'border-indigo-500 text-indigo-600 bg-white' 
                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                   `}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            <div className="flex items-center gap-2 pr-2">
               <button
                 onClick={handleCopy}
                 className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-200 rounded-md transition-all"
                 title="Copy current tab"
               >
                 {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
               </button>
               <button
                 onClick={handleDownload}
                 className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-xs font-semibold transition-all"
                 title="Download Project (HTML, CSS, JS)"
               >
                 <Download size={14} />
                 <span className="hidden sm:inline">Download</span>
               </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative bg-white">
             <CodeEditor 
               language={activeTab}
               code={activeTab === Tab.HTML ? code.html : activeTab === Tab.CSS ? code.css : code.js}
               onChange={(val) => handleCodeChange(activeTab === Tab.HTML ? 'html' : activeTab === Tab.CSS ? 'css' : 'js', val)}
             />
          </div>
        </div>

        {/* Pane 2: Preview */}
        <div className={`
          flex-1 h-full relative transition-all duration-300
          ${mobilePane === PaneMode.EDITOR ? 'hidden md:block' : 'block'}
        `}>
          <Workspace 
            code={code} 
            isBuilding={metrics.isThinking || isTyping} 
          />
        </div>

        {/* Mobile Toggle Button - MOVED UP to bottom-36 */}
        <div className="md:hidden fixed bottom-36 right-4 z-[60] bg-white shadow-xl rounded-full p-1 border border-gray-200 flex flex-col gap-2">
          <button 
            onClick={() => setMobilePane(PaneMode.EDITOR)}
            className={`p-3 rounded-full transition-colors ${mobilePane === PaneMode.EDITOR ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Show Code"
          >
            <Code size={20} />
          </button>
          <button 
            onClick={() => setMobilePane(PaneMode.PREVIEW)}
            className={`p-3 rounded-full transition-colors ${mobilePane === PaneMode.PREVIEW ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Show Preview"
          >
            <Eye size={20} />
          </button>
        </div>

        {/* Global Control Pill */}
        <ControlPill onSend={handleSend} metrics={metrics} />

      </div>
    </>
  );
}

export default App;