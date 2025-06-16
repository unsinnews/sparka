'use client';

import {
  startTransition,
  useMemo,
  useOptimistic,
  useState,
  memo,
  type ComponentProps,
} from 'react';
import { useSession } from 'next-auth/react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getEnabledFeatures } from '@/lib/features-config';
import { ANONYMOUS_LIMITS } from '@/lib/types/anonymous';
import { LoginCtaBanner } from '@/components/upgrade-cta/login-cta-banner';

import { ChevronUpIcon, FilterIcon } from 'lucide-react';

type FeatureFilter = Record<string, boolean>;

export function PureModelSelector({
  selectedModelId,
  className,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
} & ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);
  console.log('Rendering model selector');

  const { data: session } = useSession();
  const isAnonymous = !session?.user;

  // Initialize feature filters with enabled features only
  const enabledFeatures = getEnabledFeatures();
  const initialFilters = enabledFeatures.reduce<FeatureFilter>(
    (acc, feature) => {
      acc[feature.key] = false;
      return acc;
    },
    {},
  );

  const [featureFilters, setFeatureFilters] =
    useState<FeatureFilter>(initialFilters);

  const chatModels = useMemo(() => {
    return allImplementedModels;
  }, []);

  const filteredModels = useMemo(() => {
    const hasActiveFilters = Object.values(featureFilters).some(Boolean);

    if (!hasActiveFilters) {
      return chatModels;
    }

    return chatModels.filter((model) => {
      const modelDef = getModelDefinition(model.id);
      const features = modelDef.features;

      if (!features) return false;

      // Check each active filter
      return Object.entries(featureFilters).every(([key, isActive]) => {
        if (!isActive) return true;

        switch (key) {
          case 'reasoning':
            return features.reasoning;
          case 'functionCalling':
            return features.functionCalling;
          case 'imageInput':
            return features.input.image;
          case 'pdfInput':
            return features.input.pdf;
          case 'audioInput':
            return features.input.audio;
          case 'imageOutput':
            return features.output.image;
          case 'audioOutput':
            return features.output.audio;
          default:
            return true;
        }
      });
    });
  }, [chatModels, featureFilters]);

  // Function to check if a model is available for anonymous users
  const isModelAvailableForAnonymous = (modelId: string) => {
    return ANONYMOUS_LIMITS.AVAILABLE_MODELS.includes(modelId as any);
  };

  // Function to determine if a model is disabled
  const isModelDisabled = (modelId: string) => {
    return isAnonymous && !isModelAvailableForAnonymous(modelId);
  };
  // Check if there are disabled models for anonymous users
  const hasDisabledModels = useMemo(() => {
    if (!isAnonymous) return false;
    return filteredModels.some((model) => isModelDisabled(model.id));
  }, [isAnonymous, filteredModels]);

  const selectedChatModel = useMemo(
    () => chatModels.find((chatModel) => chatModel.id === optimisticModelId),
    [optimisticModelId, chatModels],
  );

  const activeFilterCount =
    Object.values(featureFilters).filter(Boolean).length;

  const clearFilters = () => {
    setFeatureFilters(initialFilters);
  };

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
      <PopoverContent className="max-w-[700px] w-auto p-0" align="start">
        <Command>
          <div className="flex items-center border-b">
            <CommandInput
              placeholder="Search models..."
              className="px-3"
              containerClassName="w-full border-0"
            />
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'mr-3 h-8 w-8 p-0 relative',
                    activeFilterCount > 0 && 'text-primary',
                  )}
                >
                  <FilterIcon className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 text-xs min-w-[16px] h-4 flex items-center justify-center p-0"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="end">
                <div className="p-4">
                  <div className="mb-3 h-7 flex items-center justify-between">
                    <div className="text-sm font-medium">Filter by Tools</div>
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs h-6"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {enabledFeatures.map((feature) => {
                      const IconComponent = feature.icon;

                      return (
                        <div
                          key={feature.key}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={feature.key}
                            checked={featureFilters[feature.key] || false}
                            onCheckedChange={(checked) =>
                              setFeatureFilters((prev) => ({
                                ...prev,
                                [feature.key]: Boolean(checked),
                              }))
                            }
                          />
                          <Label
                            htmlFor={feature.key}
                            className="text-sm flex items-center gap-1.5"
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                            {feature.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {hasDisabledModels && (
            <div className="p-3">
              <LoginCtaBanner
                message="Sign in to unlock all models."
                variant="default"
                compact
              />
            </div>
          )}
          <CommandList
            className="max-h-none min-h-[250px] flex justify-center items-center"
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
          >
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              <div className="flex">
                <ScrollArea className="max-h-[70vh]" type="scroll">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                    {filteredModels.map((chatModel) => {
                      const { id } = chatModel;
                      const modelDefinition = getModelDefinition(id);
                      const disabled = isModelDisabled(id);

                      return (
                        <CommandItem
                          key={id}
                          value={id}
                          onSelect={(event) => {
                            if (disabled) return; // Prevent selection of disabled models

                            startTransition(() => {
                              setOptimisticModelId(id);
                              onModelChange?.(id);
                              setOpen(false);
                            });
                          }}
                          className="p-0 h-auto"
                        >
                          <ModelCard
                            model={modelDefinition}
                            isSelected={id === optimisticModelId}
                            isDisabled={disabled}
                            disabledReason={
                              disabled
                                ? 'Sign in to access this model'
                                : undefined
                            }
                            className="h-full w-[250px]"
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

export const ModelSelector = memo(PureModelSelector, (prevProps, nextProps) => {
  return (
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.className === nextProps.className &&
    prevProps.onModelChange === nextProps.onModelChange
  );
});
