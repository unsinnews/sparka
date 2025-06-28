'use client';

import type { User } from 'next-auth';
import { LogIn } from 'lucide-react';

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
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Link, useNavigate } from 'react-router';
import { useRouter } from 'next/navigation';
import { useChatId } from '@/providers/chat-id-provider';

export function AppSidebar({ user }: { user: User | undefined }) {
  const navigate = useNavigate();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { refreshChatID } = useChatId();

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
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                Sparka ✨
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={() => {
                    setOpenMobile(false);
                    refreshChatID();
                    navigate('/');
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>

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
        {user ? (
          <SidebarUserNav user={user} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground justify-start gap-3 h-10"
                onClick={() => {
                  setOpenMobile(false);
                  router.push('/login');
                  router.refresh();
                }}
              >
                <LogIn className="size-4" />
                <span>Login</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
