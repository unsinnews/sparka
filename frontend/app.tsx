import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ChatHome } from './components/chat-home';
import { ChatPage } from './components/chat-page';
import { SharedChatPage } from './components/shared-chat-page';
import { AppLayout } from './components/app-layout';
import { ChatIdProvider } from '@/providers/chat-id-provider';
import { MessageTreeProvider } from '@/providers/message-tree-provider';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { useSession } from 'next-auth/react';

export default function App() {
  const { data: session } = useSession();

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route
            path="/"
            element={
              <ChatIdProvider>
                <MessageTreeProvider>
                  <AppSidebar user={session?.user} />
                  <SidebarInset>
                    <ChatHome />
                  </SidebarInset>
                </MessageTreeProvider>
              </ChatIdProvider>
            }
          />
          <Route
            path="/chat/:id"
            element={
              <ChatIdProvider>
                <MessageTreeProvider>
                  <AppSidebar user={session?.user} />
                  <SidebarInset>
                    <ChatPage />
                  </SidebarInset>
                </MessageTreeProvider>
              </ChatIdProvider>
            }
          />
          <Route
            path="/share/:id"
            element={
              <ChatIdProvider>
                <MessageTreeProvider>
                  <AppSidebar user={session?.user} />
                  <SidebarInset>
                    <SharedChatPage />
                  </SidebarInset>
                </MessageTreeProvider>
              </ChatIdProvider>
            }
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
