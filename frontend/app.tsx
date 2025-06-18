import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ChatHome } from './components/chat-home';
import { ChatPage } from './components/chat-page';
import { SharedChatPage } from './components/shared-chat-page';
import { AppLayout } from './components/app-layout';
import { MessageTreeProvider } from '@/providers/message-tree-provider';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route
            path="/"
            element={
              <MessageTreeProvider>
                <ChatHome />
              </MessageTreeProvider>
            }
          />
          <Route
            path="/chat/:id"
            element={
              <MessageTreeProvider>
                <ChatPage />
              </MessageTreeProvider>
            }
          />
          <Route
            path="/share/:id"
            element={
              <MessageTreeProvider queryType="public">
                <SharedChatPage />
              </MessageTreeProvider>
            }
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
