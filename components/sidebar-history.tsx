'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useNavigate } from 'react-router';
import type { User } from 'next-auth';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import type { UIChat } from '@/lib/types/ui';
import {
  useDeleteChat,
  useRenameChat,
  usePinChat,
  useGetAllChats,
} from '@/hooks/use-chat-store';
import { useChatId } from '@/providers/chat-id-provider';
import { SidebarChatItem } from './sidebar-chat-item';

type GroupedChats = {
  pinned: UIChat[];
  today: UIChat[];
  yesterday: UIChat[];
  lastWeek: UIChat[];
  lastMonth: UIChat[];
  older: UIChat[];
};

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { chatId, refreshChatID } = useChatId();
  const navigate = useNavigate();

  const { mutate: renameChatMutation } = useRenameChat();
  const { mutate: pinChatMutation } = usePinChat();
  const { deleteChat } = useDeleteChat();

  const { data: chats, isLoading } = useGetAllChats(100);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const renameChat = useCallback(
    (chatId: string, title: string) => {
      renameChatMutation({ chatId, title });
    },
    [renameChatMutation],
  );

  const pinChat = useCallback(
    (chatId: string, isPinned: boolean) => {
      pinChatMutation({ chatId, isPinned });
    },
    [pinChatMutation],
  );

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteChat(deleteId, {
        onSuccess: () => toast.success('Chat deleted successfully'),
        onError: () => toast.error('Failed to delete chat'),
      });
    } catch (error) {
      // Error already handled by onError callback
    }

    setShowDeleteDialog(false);

    if (deleteId === chatId) {
      refreshChatID();
      navigate('/');
    }
  };

  if (!user && !isLoading && chats?.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Start chatting to see your conversation history!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (chats?.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const groupChatsByDate = (chats: UIChat[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    // Separate pinned and non-pinned chats
    const pinnedChats = chats.filter((chat) => chat.isPinned);
    const nonPinnedChats = chats.filter((chat) => !chat.isPinned);

    const groups = nonPinnedChats.reduce(
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
        pinned: [],
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      } as GroupedChats,
    );

    // Add pinned chats (sorted by most recent first)
    groups.pinned = pinnedChats.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return groups;
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {chats &&
              (() => {
                const groupedChats = groupChatsByDate(chats);

                return (
                  <>
                    {groupedChats.pinned.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Pinned
                        </div>
                        {groupedChats.pinned.map((chat) => (
                          <SidebarChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === chatId}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onRename={renameChat}
                            onPin={pinChat}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.today.length > 0 && (
                      <>
                        <div
                          className={`px-2 py-1 text-xs text-sidebar-foreground/50 ${groupedChats.pinned.length > 0 ? 'mt-6' : ''}`}
                        >
                          Today
                        </div>
                        {groupedChats.today.map((chat) => (
                          <SidebarChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === chatId}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onRename={renameChat}
                            onPin={pinChat}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.yesterday.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Yesterday
                        </div>
                        {groupedChats.yesterday.map((chat) => (
                          <SidebarChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === chatId}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onRename={renameChat}
                            onPin={pinChat}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.lastWeek.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Last 7 days
                        </div>
                        {groupedChats.lastWeek.map((chat) => (
                          <SidebarChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === chatId}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onRename={renameChat}
                            onPin={pinChat}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.lastMonth.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Last 30 days
                        </div>
                        {groupedChats.lastMonth.map((chat) => (
                          <SidebarChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === chatId}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onRename={renameChat}
                            onPin={pinChat}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.older.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Older
                        </div>
                        {groupedChats.older.map((chat) => (
                          <SidebarChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === chatId}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            onRename={renameChat}
                            onPin={pinChat}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
