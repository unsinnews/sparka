'use client';

import type { User } from 'next-auth';
import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ChatIdProvider } from '@/providers/chat-id-provider';
import { MessageTreeProvider } from '@/providers/message-tree-provider';

interface ChatLayoutWrapperProps {
  children: React.ReactNode;
  user: User | undefined;
}

export function ChatLayoutWrapper({ children, user }: ChatLayoutWrapperProps) {
  return (
    <ChatIdProvider>
      <MessageTreeProvider>
        <AppSidebar user={user} />
        <SidebarInset>{children}</SidebarInset>
      </MessageTreeProvider>
    </ChatIdProvider>
  );
}
