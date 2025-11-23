import React, { useEffect, useRef, useState } from 'react';
import { Tab } from '../types';

// We rely on the global Prism object loaded via CDN
declare const Prism: any;

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: Tab;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, language }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const getGrammar = () => {
    switch (language) {
      case Tab.HTML: return 'html';
      case Tab.CSS: return 'css';
      case Tab.JS: return 'javascript';
      default: return 'javascript';
    }
  };

  const highlight = (text: string) => {
    if (typeof Prism === 'undefined') return text;
    return Prism.highlight(text, Prism.languages[getGrammar()] || Prism.languages.javascript, getGrammar());
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const syncScroll = () => {
    if (textareaRef.current && preRef.current && lineNumbersRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;
      
      preRef.current.scrollTop = top;
      preRef.current.scrollLeft = left;
      lineNumbersRef.current.scrollTop = top;
    }
  };

  // Sync highligher when code changes externally
  useEffect(() => {
      if (preRef.current && textareaRef.current && lineNumbersRef.current) {
          preRef.current.scrollTop = textareaRef.current.scrollTop;
          preRef.current.scrollLeft = textareaRef.current.scrollLeft;
          // Also re-sync line numbers if code content changes drastically
          lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
  }, [code]);

  const lineNumbers = code.split('\n').map((_, i) => i + 1);

  return (
    <div className="editor-container relative h-full w-full bg-white flex">
      {/* Line Numbers Gutter */}
      <div 
        ref={lineNumbersRef}
        className="h-full w-12 bg-gray-50 border-r border-gray-100 pt-4 pb-40 text-right pr-2 select-none overflow-hidden text-gray-400 font-mono text-[14px] leading-[1.5]"
      >
        {lineNumbers.map(num => (
          <div key={num}>{num}</div>
        ))}
      </div>

      {/* Code Area Wrapper */}
      <div className="relative flex-1 h-full overflow-hidden">
        <textarea
            ref={textareaRef}
            value={code}
            onChange={handleInput}
            onScroll={syncScroll}
            spellCheck={false}
            className="editor-layer editor-textarea p-4 pb-40 w-full h-full focus:ring-0 border-none pl-4"
        />
        <pre
            ref={preRef}
            aria-hidden="true"
            className="editor-layer editor-highlight p-4 pb-40 w-full h-full m-0 pointer-events-none pl-4"
        >
            <code
                className={`language-${getGrammar()}`}
                dangerouslySetInnerHTML={{ __html: highlight(code) }} 
            />
        </pre>
      </div>
    </div>
  );
};

export default CodeEditor;