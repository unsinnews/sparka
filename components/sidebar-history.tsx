'use client';

import { useRouter } from 'next/navigation';
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
import {
  useDeleteChat,
  useRenameChat,
  usePinChat,
  useGetAllChats,
} from '@/hooks/chat-sync-hooks';
import { useChatId } from '@/providers/chat-id-provider';
import { GroupedChatsList } from './grouped-chats-list';

export function SidebarHistory() {
  const { setOpenMobile } = useSidebar();
  const { chatId, refreshChatID } = useChatId();
  const router = useRouter();

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

  const handleDelete = useCallback(async () => {
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
      router.push('/');
    }
  }, [deleteId, deleteChat, chatId, refreshChatID, router]);

  if (!isLoading && chats?.length === 0) {
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

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {chats && (
              <GroupedChatsList
                chats={chats}
                chatId={chatId}
                onDelete={(chatId) => {
                  setDeleteId(chatId);
                  setShowDeleteDialog(true);
                }}
                onRename={renameChat}
                onPin={pinChat}
                setOpenMobile={setOpenMobile}
              />
            )}
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
