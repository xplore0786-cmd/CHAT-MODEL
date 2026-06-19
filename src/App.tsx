/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';

export default function App() {
  const chatHook = useChat();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-900 font-sans selection:bg-blue-200 dark:selection:bg-blue-900">
      <Sidebar 
        sessions={chatHook.sessions}
        currentSessionId={chatHook.currentSessionId}
        onSelectSession={(id) => {
          chatHook.setCurrentSessionId(id);
          setIsSidebarOpen(false);
        }}
        onNewSession={() => {
          chatHook.createNewSession();
          setIsSidebarOpen(false);
        }}
        onDeleteSession={chatHook.deleteSession}
        onExport={chatHook.exportChat}
        onClearAll={chatHook.clearHistory}
        theme={chatHook.theme}
        onToggleTheme={chatHook.toggleTheme}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <ChatInterface 
        onMenuClick={() => setIsSidebarOpen(true)}
        chatHook={chatHook}
      />
    </div>
  );
}
