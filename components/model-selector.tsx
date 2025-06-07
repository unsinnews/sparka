'use client';

import {
  startTransition,
  useMemo,
  useOptimistic,
  useState,
  type ComponentProps,
} from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModelCard } from '@/components/model-card';
import { cn } from '@/lib/utils';
import { allImplementedModels, getModelDefinition } from '@/lib/ai/all-models';

import { ChevronUpIcon } from 'lucide-react';

export function ModelSelector({
  selectedModelId,
  className,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
} & ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  // const trpc = useTRPC();

  // const { data: chatModels = [], isLoading } = useQuery(
  //   trpc.models.getAvailableModels.queryOptions(),
  // );

  const chatModels = allImplementedModels;

  const selectedChatModel = useMemo(
    () => chatModels.find((chatModel) => chatModel.id === optimisticModelId),
    [optimisticModelId, chatModels],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-testid="model-selector"
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={cn('w-fit justify-between md:px-2 md:h-[34px]', className)}
        >
          {selectedChatModel?.name}
          <ChevronUpIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList className="overflow-y-visible max-h-none">
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {/* flex parent container needed for scroll area to work */}
              <div className="flex">
                <ScrollArea className="max-h-[70vh]" type="scroll">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                    {chatModels.map((chatModel) => {
                      const { id } = chatModel;
                      const modelDefinition = getModelDefinition(id);

                      return (
                        <CommandItem
                          key={id}
                          value={id}
                          onSelect={() => {
                            setOpen(false);
                          }}
                          className="p-0 h-auto"
                        >
                          <ModelCard
                            model={modelDefinition}
                            isSelected={id === optimisticModelId}
                            onClick={(e) => {
                              startTransition(() => {
                                setOptimisticModelId(id);
                                onModelChange?.(id);
                              });
                              e?.stopPropagation();
                            }}
                            className="size-full"
                          />
                        </CommandItem>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
