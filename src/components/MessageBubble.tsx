import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { Message } from '../types';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface MessageBubbleProps {
  message: Message;
  isGenerating: boolean;
}

export function MessageBubble({ message, isGenerating }: MessageBubbleProps) {
  const [copied, setCopied] = React.useState(false);
  
  const isUser = message.role === 'user';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = message.content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = message.content.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={twMerge(
        "flex w-full mb-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={twMerge(
        "max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm",
        isUser 
          ? "bg-blue-600 dark:bg-blue-600 text-white rounded-tr-sm" 
          : "glass !bg-white/90 dark:!bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-sm"
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70 flex items-center gap-2">
            {isUser ? 'You' : 'Gemini 2.5 Flash'}
          </span>
          
          <div className="flex items-center gap-2 opacity-70">
            {!isUser && (
              <button 
                onClick={handleCopy} 
                className="hover:text-blue-400 transition-colors"
                title="Copy response"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            )}
            <span className="text-[10px]">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className={twMerge(
          "prose prose-sm md:prose-base max-w-none break-words",
          isUser ? "prose-invert" : "dark:prose-invert"
        )}>
          {message.content ? (
             <div className="markdown-body">
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props) {
                    const {children, className, node, ref, ...rest} = props;
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                      <SyntaxHighlighter
                        {...rest}
                        PreTag="div"
                        children={String(children).replace(/\n$/, '')}
                        language={match[1]}
                        style={vscDarkPlus as any}
                        className="rounded-md my-2"
                      />
                    ) : (
                      <code ref={ref} {...rest} className={twMerge("bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm", className)}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {message.content}
              </Markdown>
             </div>
          ) : (
             isGenerating && !isUser && (
              <div className="flex items-center space-x-1 h-5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )
          )}
        </div>
        
        {!isUser && message.content && (
          <div className="mt-3 pt-2 text-[10px] border-t border-slate-200 dark:border-slate-700/50 flex justify-end text-slate-500 dark:text-slate-400">
            {wordCount} words • {charCount} chars
          </div>
        )}
      </div>
    </motion.div>
  );
}
