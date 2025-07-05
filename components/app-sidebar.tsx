'use client';

import type { User } from 'next-auth';
import { LogIn } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { SearchChatsButton } from '@/components/search-chats';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from './ui/separator';
import { Link, useNavigate } from 'react-router';
import { useRouter } from 'next/navigation';
import { useChatId } from '@/providers/chat-id-provider';
import { useGetCredits } from '@/hooks/use-chat-store';
import { useSession } from 'next-auth/react';
import { Coins } from 'lucide-react';

function SidebarCreditsDisplay() {
  const { credits, isLoadingCredits } = useGetCredits();
  const { data: session } = useSession();
  const router = useRouter();
  const isAuthenticated = !!session?.user;

  if (isLoadingCredits) {
    return (
      <div className="px-4 py-3 rounded-lg bg-muted/50 text-muted-foreground text-sm">
        Loading credits...
      </div>
    );
  }

  const remaining = credits ?? 0;

  return (
    <div className="space-y-3">
      <Separator />
      <div className="px-4 py-3 rounded-lg bg-muted/50 text-muted-foreground text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            <span>Credits remaining</span>
          </div>
          <span className="font-semibold">{remaining}</span>
        </div>
      </div>
      
      {!isAuthenticated && (
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => {
            router.push('/login');
            router.refresh();
          }}
        >
          <LogIn className="h-4 w-4" />
          Sign in to reset your limits
        </Button>
      )}
    </div>
  );
}

// Helper function to get platform-specific shortcut text
function getNewChatShortcutText() {
  if (typeof window === 'undefined') return 'Ctrl+Shift+O';
  
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? 'Cmd+Shift+O' : 'Ctrl+Shift+O';
}

export function AppSidebar({ user }: { user: User | undefined }) {
  const navigate = useNavigate();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { refreshChatID } = useChatId();

  // Update shortcut text on mount
  const [shortcutText, setShortcutText] = useState('Ctrl+Shift+O');

  useEffect(() => {
    setShortcutText(getNewChatShortcutText());
  }, []);

  // Keyboard shortcut for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'O' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenMobile(false);
        refreshChatID();
        navigate('/');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setOpenMobile, refreshChatID, navigate]);

  return (
    <Sidebar className="group-data-[side=left]:border-r-0 grid grid-rows-[auto_1fr_auto] max-h-screen">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              to="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer flex items-center gap-2">
                <Image
                  src="/icon.svg"
                  alt="Sparka AI"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                Sparka
              </span>
            </Link>
          </div>

          <SidebarMenuItem className="mt-4">
            <SidebarMenuButton
              onClick={() => {
                setOpenMobile(false);
                refreshChatID();
                navigate('/');
              }}
              className="w-full justify-start"
            >
              <PlusIcon />
              <span>New Chat</span>
              <span className="ml-auto text-xs text-muted-foreground">{shortcutText}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SearchChatsButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <ScrollArea className="h-full">
        <SidebarContent className="max-w-[var(--sidebar-width)] pr-2">
          <SidebarHistory user={user} />
        </SidebarContent>
      </ScrollArea>
      <SidebarFooter>
        <div className="px-2 pb-2">
          <SidebarCreditsDisplay />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
