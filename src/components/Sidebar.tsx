import React from 'react';
import { ChatSession } from '../types';
import { motion } from 'motion/react';
import { MessageSquare, Plus, Trash2, Download, Sun, Moon, Settings, Zap } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onExport: () => void;
  onClearAll: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewSession, 
  onDeleteSession, 
  onExport,
  onClearAll,
  theme, 
  onToggleTheme,
  isOpen,
  setIsOpen 
}: SidebarProps) {

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <motion.aside 
        initial={false}
        animate={{ 
          x: isOpen ? 0 : '-100%',
          width: 280
        }}
        className={twMerge(
          "fixed md:relative z-50 h-full shrink-0 flex flex-col",
          "glass border-r !bg-slate-50/90 dark:!bg-slate-900/90 border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out md:translate-x-0"
        )}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/50">
          <button
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2 mt-2">
            Recent Chats
          </div>
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={twMerge(
                "w-full flex items-center justify-between p-2.5 rounded-lg text-sm text-left transition-colors group",
                currentSessionId === session.id 
                  ? "bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium" 
                  : "hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className={currentSessionId === session.id ? 'text-blue-500' : 'text-slate-400'} />
                <span className="truncate">{session.title}</span>
              </div>
              
              <div 
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
              >
                <Trash2 size={14} />
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <div className="text-center text-sm text-slate-500 mt-4 italic">
              No chats yet.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 space-y-1">
           <button
            onClick={onExport}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Download size={16} className="text-slate-400" />
            <span>Export Chat</span>
          </button>
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors"
          >
             <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={16} className="text-slate-400" /> : <Sun size={16} className="text-slate-400" />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
             </div>
             <div className={twMerge(
               "w-8 h-4 rounded-full flex items-center p-0.5 transition-colors",
               theme === 'dark' ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"
             )}>
               <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
             </div>
          </button>
          <button
            onClick={onClearAll}
            className="w-full flex items-center gap-3 px-3 py-2 mt-2 border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-sm transition-colors"
          >
            <Trash2 size={16} />
            <span>Clear All History</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
