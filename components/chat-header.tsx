'use client';
import { useWindowSize } from 'usehooks-ts';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { ShareButton } from './share-button';
import { useNavigate } from 'react-router';
import { Share } from 'lucide-react';

function PureChatHeader({
  chatId,
  selectedModelId,
  isReadonly,
  hasMessages,
}: {
  chatId: string;
  selectedModelId: string;
  isReadonly: boolean;
  hasMessages: boolean;
}) {
  const { open } = useSidebar();
  const navigate = useNavigate();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                navigate('/');
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && hasMessages && (
        <ShareButton chatId={chatId} className="order-1 md:order-3" />
      )}
      {isReadonly && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="order-1 md:order-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-muted-foreground text-sm">
              <Share size={14} className="opacity-70" />
              <span>Shared</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-medium">Shared Chat</div>
              <div className="text-xs text-muted-foreground mt-1">
                This is a shared chat
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.hasMessages === nextProps.hasMessages
  );
});
