'use client';

import {
  startTransition,
  useMemo,
  useOptimistic,
  useState,
  type ComponentProps,
} from 'react';
import { useQuery } from '@tanstack/react-query';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModelCard } from '@/components/model-card';
import { useTRPC } from '@/trpc/react';
import { cn } from '@/lib/utils';
import { getModelDefinition } from '@/lib/ai/all-models';

import { ChevronUpIcon } from 'lucide-react';

export function ModelSelector({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
} & ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);
  const trpc = useTRPC();

  const { data: chatModels = [], isLoading } = useQuery(
    trpc.models.getAvailableModels.queryOptions(),
  );

  const selectedChatModel = useMemo(
    () => chatModels.find((chatModel) => chatModel.id === optimisticModelId),
    [optimisticModelId, chatModels],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild className={cn('w-fit ', className)}>
        <Button
          data-testid="model-selector"
          variant="ghost"
          className="md:px-2 md:h-[34px]"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : selectedChatModel?.name}
          <ChevronUpIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[600px] max-w-[800px] p-2"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {chatModels.map((chatModel) => {
            const { id } = chatModel;
            const modelDefinition = getModelDefinition(id);

            return (
              <ModelCard
                key={id}
                model={modelDefinition}
                isSelected={id === optimisticModelId}
                onClick={() => {
                  setOpen(false);
                  startTransition(() => {
                    setOptimisticModelId(id);
                    saveChatModelAsCookie(id);
                  });
                }}
              />
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
