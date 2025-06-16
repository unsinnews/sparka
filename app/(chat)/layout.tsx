import { cookies } from 'next/headers';
import { SessionProvider } from 'next-auth/react';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ChatIdProvider } from '@/providers/chat-id-provider';
import { auth } from '../(auth)/auth';
import Script from 'next/script';
import { ActiveThreadProvider } from '@/providers/active-thread-provider';
import { AnonymousSessionInit } from '@/components/anonymous-session-init';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SessionProvider session={session}>
        <AnonymousSessionInit />
        <ChatIdProvider>
          <ActiveThreadProvider>
            <SidebarProvider defaultOpen={!isCollapsed}>
              <AppSidebar user={session?.user} />
              <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
          </ActiveThreadProvider>
        </ChatIdProvider>
      </SessionProvider>
    </>
  );
}
