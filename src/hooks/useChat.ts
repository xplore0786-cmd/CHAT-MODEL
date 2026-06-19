import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatSession, Message } from '../types';

const STORAGE_KEY = 'gemini-chat-sessions';
const THEME_KEY = 'gemini-chat-theme';

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    } else {
      createNewSession();
    }

    const storedTheme = localStorage.getItem(THEME_KEY) as 'light' | 'dark';
    if (storedTheme) {
      setTheme(storedTheme);
      if (storedTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    }
  }, []);

  // Save to local storage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      updatedAt: Date.now(),
      messages: [],
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, []);

  const clearHistory = useCallback(() => {
    setSessions([]);
    localStorage.removeItem(STORAGE_KEY);
    createNewSession();
  }, [createNewSession]);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        setTimeout(createNewSession, 0);
        return [];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  }, [currentSessionId, createNewSession]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isGenerating || !currentSessionId) return;

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Optimistically update UI with user message and an empty AI response
    let activeSessionId = currentSessionId;
    const aiMessageId = crypto.randomUUID();
    
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const isFirstMessage = s.messages.length === 0;
        return {
          ...s,
          title: isFirstMessage ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : s.title,
          updatedAt: Date.now(),
          messages: [...s.messages, newMessage, {
            id: aiMessageId,
            role: 'ai',
            content: '',
            timestamp: Date.now() + 1,
          }]
        };
      }
      return s;
    }));

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const sessionForApi = sessions.find(s => s.id === activeSessionId);
      const messagesToSend = [...(sessionForApi?.messages || []), newMessage];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesToSend }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamData = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                streamData = data.error;
              } else if (data.text) {
                streamData += data.text;
              }
              
              // Update the AI message content
              setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                  const newMessages = [...s.messages];
                  const aiMsgIndex = newMessages.findIndex(m => m.id === aiMessageId);
                  if (aiMsgIndex !== -1) {
                    newMessages[aiMsgIndex] = { ...newMessages[aiMsgIndex], content: streamData };
                  }
                  return { ...s, messages: newMessages, updatedAt: Date.now() };
                }
                return s;
              }));
            } catch (e) {
              // Ignore parse errors from partial chunks
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            const newMessages = [...s.messages];
            const aiMsgIndex = newMessages.findIndex(m => m.id === aiMessageId);
            if (aiMsgIndex !== -1) {
              newMessages[aiMsgIndex] = { ...newMessages[aiMsgIndex], content: "Sorry, I encountered an error. Please try again." };
            }
            return { ...s, messages: newMessages, updatedAt: Date.now() };
          }
          return s;
        }));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const exportChat = useCallback(() => {
    if (!currentSession) return;
    
    let text = `Chat Export: ${currentSession.title}\nDate: ${new Date(currentSession.updatedAt).toLocaleString()}\n\n`;
    
    currentSession.messages.forEach(msg => {
      const role = msg.role === 'user' ? 'You' : 'AI';
      text += `[${role}] - ${new Date(msg.timestamp).toLocaleTimeString()}\n${msg.content}\n\n`;
    });
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentSession]);

  return {
    sessions,
    currentSession,
    currentSessionId,
    setCurrentSessionId,
    sendMessage,
    isGenerating,
    createNewSession,
    clearHistory,
    deleteSession,
    theme,
    toggleTheme,
    exportChat
  };
}
