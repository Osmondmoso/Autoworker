/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';

interface GeminiInputDockProps {
  onSendMessage: (text: string) => void;
  onOpenAddModal: () => void;
  isSending?: boolean;
}

export const GeminiInputDock: React.FC<GeminiInputDockProps> = ({
  onSendMessage,
  onOpenAddModal,
  isSending = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isSending) return;
    const text = inputValue.trim();
    setInputValue('');
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Web Speech API Voice search support
  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is supported in Chrome, Edge, and Android WebViews.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue((prev) => (prev ? prev + ' ' + transcript : transcript));
          inputRef.current?.focus();
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <section 
      className="w-full px-4 pt-1 pb-2 sm:pb-3 z-20 flex flex-col items-center shrink-0" 
      data-purpose="input-dock"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
    >
      {/* Floating Pill Bar */}
      <div 
        className={`w-full bg-white rounded-full pill-shadow border border-neutral-200/90 p-1.5 pl-3.5 pr-1.5 flex items-center justify-between gap-2.5 min-h-[58px] transition-all duration-200 ${
          isFocused ? 'ring-2 ring-blue-400/50' : ''
        }`}
      >
        {/* Add / Plus Button */}
        <button 
          onClick={onOpenAddModal}
          aria-label="Add context or file" 
          className="text-neutral-700 hover:text-neutral-900 active:scale-90 transition-transform p-1 cursor-pointer shrink-0" 
          type="button"
        >
          <svg className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>

        {/* Input / Placeholder Text */}
        <div 
          className="flex-1 cursor-text py-1" 
          onClick={() => inputRef.current?.focus()}
        >
          <input 
            ref={inputRef}
            id="mobileQueryInput"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isSending}
            className="w-full border-none bg-transparent p-0 text-[16px] text-neutral-800 placeholder-neutral-500 font-normal focus:ring-0 focus:outline-none" 
            placeholder="Reply or instruct agent..." 
            type="text"
          />
        </div>

        {/* Right Side Actions: Mic and Live Voice Mode */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Voice Input Microphone */}
          <button 
            onClick={handleToggleVoice}
            aria-label="Voice search" 
            className={`p-2 active:scale-90 transition-transform cursor-pointer rounded-full ${
              isListening ? 'text-blue-600 bg-blue-50 animate-pulse' : 'text-neutral-800 hover:text-neutral-950'
            }`} 
            type="button"
          >
            <svg className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15a3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3v6a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>

          {/* Live Audio Waveform Session Button / Send trigger */}
          <button 
            onClick={() => handleSubmit()}
            disabled={isSending}
            aria-label={inputValue.trim() ? 'Send instruction' : 'Start Live Gemini audio conversation'} 
            className={`w-10.5 h-10.5 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-60 ${
              inputValue.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                : 'bg-[#dbe8f6] hover:bg-[#cfdff1] text-neutral-900'
            }`} 
            type="button"
            title={inputValue.trim() ? 'Send instruction' : 'Live Agent Run'}
          >
            {inputValue.trim() ? (
              <svg className="w-5 h-5 stroke-[2.2] translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            ) : (
              /* Distinct Gemini 4-bar waveform icon */
              <div className="flex items-center justify-center gap-[3px] h-5">
                <span className={`w-[2.5px] rounded-full transition-all duration-300 ${
                  isSending ? 'h-5 bg-blue-600 animate-pulse' : 'h-2 bg-neutral-900'
                }`}></span>
                <span className={`w-[2.5px] rounded-full transition-all duration-300 ${
                  isSending ? 'h-3 bg-blue-600 animate-bounce' : 'h-4.5 bg-neutral-900'
                }`}></span>
                <span className={`w-[2.5px] rounded-full transition-all duration-300 ${
                  isSending ? 'h-4 bg-blue-600 animate-pulse' : 'h-3 bg-neutral-900'
                }`}></span>
                <span className={`w-[2.5px] rounded-full transition-all duration-300 ${
                  isSending ? 'h-2 bg-blue-600 animate-bounce' : 'h-1.5 bg-neutral-900'
                }`}></span>
              </div>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
