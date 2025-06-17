'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import {
  CheckCircleFillIcon,
  ChevronDownIcon,
  GlobeIcon,
  LockIcon,
} from './icons';
import { useSession } from 'next-auth/react';
import { LoginPrompt } from './upgrade-cta/login-prompt';
import { useGetAllChats, useSetVisibility } from '@/hooks/use-chat-store';
import { toast } from 'sonner';

export type VisibilityType = 'private' | 'public';

const visibilities: Array<{
  id: VisibilityType;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: 'private',
    label: 'Private',
    description: 'Only you can access this chat',
    icon: <LockIcon />,
  },
  {
    id: 'public',
    label: 'Public',
    description: 'Anyone with the link can access this chat',
    icon: <GlobeIcon />,
  },
];

export function VisibilitySelector({
  chatId,
  className,
  selectedVisibilityType,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const { data: allChats } = useGetAllChats();
  const { mutate: setVisibility } = useSetVisibility();

  const currentChat = useMemo(() => {
    return allChats?.find((chat) => chat.id === chatId);
  }, [allChats, chatId]);

  const currentVisibilityType = currentChat
    ? currentChat.visibility
    : 'private';

  const selectedVisibility = useMemo(
    () =>
      visibilities.find(
        (visibility) => visibility.id === currentVisibilityType,
      ),
    [currentVisibilityType],
  );

  const triggerButton = (
    <Button
      variant="outline"
      className={cn('hidden md:flex md:px-2 md:h-[34px]', className)}
    >
      {selectedVisibility?.icon}
      {selectedVisibility?.label}
      <ChevronDownIcon />
    </Button>
  );

  if (!isAuthenticated) {
    return (
      <Popover>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <LoginPrompt
            title="Sign in to share your chat"
            description="Control who can see your conversations and share them with others."
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
        disabled={!currentChat}
      >
        {triggerButton}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[300px]">
        {visibilities.map((visibility) => (
          <DropdownMenuItem
            key={visibility.id}
            onSelect={() => {
              setVisibility({
                chatId,
                visibility: visibility.id,
              });
              setOpen(false);
            }}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={visibility.id === currentVisibilityType}
          >
            <div className="flex flex-col gap-1 items-start">
              {visibility.label}
              {visibility.description && (
                <div className="text-xs text-muted-foreground">
                  {visibility.description}
                </div>
              )}
            </div>
            <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
        {currentVisibilityType === 'public' && (
          <DropdownMenuItem
            onSelect={() => {
              const shareUrl = `${window.location.origin}/share/${chatId}`;
              navigator.clipboard.writeText(shareUrl);
              toast.success('Share link copied to clipboard');
              setOpen(false);
            }}
            className="gap-4 group/item flex flex-row justify-between items-center"
          >
            <div className="flex flex-col gap-1 items-start">
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="m4 16 2-2v6a2 2 0 0 0 2 2h6l-2-2" />
                </svg>
                Copy Share Link
              </div>
              <div className="text-xs text-muted-foreground">
                Share this chat with others
              </div>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
