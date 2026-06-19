import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, Bot } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

interface ChatInterfaceProps {
  onMenuClick: () => void;
  chatHook: ReturnType<typeof useChat>;
}

export function ChatInterface({ onMenuClick, chatHook }: ChatInterfaceProps) {
  const { currentSession, sendMessage, isGenerating } = chatHook;
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isGenerating]);

  // Expand textarea dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating) return;
    sendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative">
      
      {/* Header */}
      <header className="h-[60px] glass !bg-white/80 dark:!bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between px-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Bot size={18} />
            </div>
            <h1 className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Gemini Assistant</h1>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
          gemini-2.5-flash
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto select-text px-4 sm:px-6 md:px-8 py-6">
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto opacity-100 mt-20">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-3xl mb-6 shadow-2xl shadow-blue-500/20 flex items-center justify-center rotate-3"
              >
                 <Bot size={40} className="text-white -rotate-3" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-tight">How can I help you today?</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
                I'm powered by Google's Gemini API. Ask me anything, tell me to write code, or just chat.
              </p>
              
              {/* Sample prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[
                  "Write a React component for a card...",
                  "Explain quantum computing simply...",
                  "Summarize the plot of Inception...",
                  "Help me debug this JavaScript error..."
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(prompt);
                      if (textareaRef.current) textareaRef.current.focus();
                    }}
                    className="p-3 text-sm text-left glass rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all text-slate-600 dark:text-slate-300"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pb-4">
              <AnimatePresence initial={false}>
                {currentSession.messages.map((message) => (
                  <MessageBubble 
                    key={message.id} 
                    message={message} 
                    isGenerating={isGenerating && message.id === currentSession.messages[currentSession.messages.length - 1].id}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-900 dark:via-slate-900 border-t border-slate-200 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 glass !bg-white dark:!bg-slate-800 rounded-2xl md:rounded-3xl p-2 shadow-lg focus-within:ring-2 focus-within:ring-blue-500/50 transition-all border border-slate-200 dark:border-slate-700"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Gemini..."
              className="w-full max-h-[150px] bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-4 py-3 sm:py-4 resize-none focus:outline-none overflow-y-auto min-h-[56px] text-base"
              rows={1}
            />
            <div className="absolute left-x right-4 bottom-2.5 sm:bottom-3 flex justify-end">
               <button
                  type="submit"
                  disabled={!input.trim() || isGenerating}
                  className={twMerge(
                    "p-2 sm:p-3 rounded-full md:rounded-xl flex items-center justify-center transition-all",
                    input.trim() && !isGenerating
                      ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5" 
                      : "bg-slate-100 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed"
                  )}
                >
                  <Send size={18} className={input.trim() && !isGenerating ? "translate-x-0.5 -translate-y-0.5" : ""} />
                </button>
            </div>
          </form>
          <div className="text-center mt-3 text-xs text-slate-400 dark:text-slate-500 font-medium">
            Shift + Enter for new line • Gemini may make mistakes
          </div>
        </div>
      </div>
    </div>
  );
}
