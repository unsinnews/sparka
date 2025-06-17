import Script from 'next/script';
import { AnonymousSessionInit } from '@/components/anonymous-session-init';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SessionProvider } from 'next-auth/react';
import { auth } from '../(auth)/auth';
import { cookies } from 'next/headers';
import { DefaultModelProvider } from '@/providers/default-model-provider';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/all-models';
import { ANONYMOUS_LIMITS } from '@/lib/types/anonymous';

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  const cookieModel = cookieStore.get('chat-model')?.value;
  const isAnonymous = !session?.user;

  // Check if the model from cookie is available for anonymous users
  let defaultModel = cookieModel ?? DEFAULT_CHAT_MODEL;

  if (isAnonymous && cookieModel) {
    const isModelAvailable = ANONYMOUS_LIMITS.AVAILABLE_MODELS.includes(
      cookieModel as any,
    );
    if (!isModelAvailable) {
      // Switch to default model if current model is not available for anonymous users
      defaultModel = DEFAULT_CHAT_MODEL;
    }
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SessionProvider session={session}>
        <AnonymousSessionInit />

        <SidebarProvider defaultOpen={!isCollapsed}>
          <DefaultModelProvider defaultModel={defaultModel}>
            {children}
          </DefaultModelProvider>
        </SidebarProvider>
      </SessionProvider>
    </>
  );
}
