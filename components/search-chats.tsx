'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MessageSquare, SearchIcon } from 'lucide-react';
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useSidebar } from '@/components/ui/sidebar';
import { useGetAllChats } from '@/hooks/use-chat-store';
import type { UIChat } from '@/lib/types/ui';
import { SidebarMenuButton } from './ui/sidebar';

type GroupedChats = {
  today: UIChat[];
  yesterday: UIChat[];
  lastWeek: UIChat[];
  lastMonth: UIChat[];
  older: UIChat[];
};

const groupChatsByDate = (chats: UIChat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

export function SearchChatsButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const { data: chats, isLoading } = useGetAllChats();

  const groupedChats = useMemo(() => {
    if (!chats) return null;
    return groupChatsByDate(chats);
  }, [chats]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      setOpen(false);
      setOpenMobile(false);
      navigate(`/chat/${chatId}`);
    },
    [navigate, setOpenMobile],
  );

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const renderChatGroup = (
    groupChats: UIChat[],
    groupName: string,
    key: string,
  ) => {
    if (groupChats.length === 0) return null;

    return (
      <CommandGroup heading={groupName} key={key}>
        {groupChats.map((chat) => (
          <CommandItem
            key={chat.id}
            value={`${chat.title} ${chat.id}`}
            onSelect={() => handleSelectChat(chat.id)}
            className="flex items-center gap-2 p-2 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-medium truncate">{chat.title}</span>
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  };

  return (
    <>
      <SidebarMenuButton
        onClick={() => setOpen(true)}
        className="w-full justify-start"
      >
        <SearchIcon className="h-4 w-4" />
        <span>Search chats</span>
        <span className="ml-auto text-xs text-muted-foreground">⌘K</span>
      </SidebarMenuButton>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search your chats..." />
        <CommandList>
          <CommandEmpty>
            {isLoading ? 'Loading chats...' : 'No chats found.'}
          </CommandEmpty>

          {groupedChats && (
            <>
              {renderChatGroup(groupedChats.today, 'Today', 'today')}
              {renderChatGroup(
                groupedChats.yesterday,
                'Yesterday',
                'yesterday',
              )}
              {renderChatGroup(
                groupedChats.lastWeek,
                'Last 7 days',
                'lastWeek',
              )}
              {renderChatGroup(
                groupedChats.lastMonth,
                'Last 30 days',
                'lastMonth',
              )}
              {renderChatGroup(groupedChats.older, 'Older', 'older')}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
