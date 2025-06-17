'use client';

import { useSession } from 'next-auth/react';
import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ChatIdProvider } from '@/providers/chat-id-provider';
import { MessageTreeProvider } from '@/providers/message-tree-provider';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession();
  return (
    <>
      <ChatIdProvider>
        <AppSidebar user={session?.user} />
        <SidebarInset>
          <MessageTreeProvider>{children}</MessageTreeProvider>
        </SidebarInset>
      </ChatIdProvider>
    </>
  );
}
