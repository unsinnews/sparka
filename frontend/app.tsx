import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ChatHome } from './components/chat-home';
import { ChatPage } from './components/chat-page';
import { SharedChatPage } from './components/shared-chat-page';
import { AppLayout } from './components/app-layout';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<ChatHome />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/share/:id" element={<SharedChatPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
