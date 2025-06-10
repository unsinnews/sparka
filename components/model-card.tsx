import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar, Building, CheckCircle } from 'lucide-react';
import type { ModelDefinition } from '@/lib/ai/all-models';
import { AnthropicIcon, GoogleIcon, OpenAIIcon, XAIIcon } from './icons';
import { cn } from '@/lib/utils';
import { getFeatureConfig, isFeatureEnabled } from '@/lib/features-config';

const PlaceholderIcon = () => <Building className="w-6 h-6" />;

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K`;
  }
  return tokens.toString();
}

function getProviderIcon(provider: string) {
  switch (provider) {
    case 'openai':
      return <OpenAIIcon size={24} />;
    case 'anthropic':
      return <AnthropicIcon size={24} />;
    case 'xai':
      return <XAIIcon size={24} />;
    case 'google':
      return <GoogleIcon size={24} />;
    default:
      return <PlaceholderIcon />;
  }
}

export function ModelCard({
  model,
  isSelected,
  isDisabled,
  disabledReason,
  className,
}: {
  model: ModelDefinition;
  isSelected?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  className?: string;
}) {
  const { features, pricing, shortDescription } = model;
  const provider = model.specification.provider;

  // Define feature mappings for the model card
  const featureBadges = [
    {
      key: 'reasoning',
      condition: features?.reasoning,
      variant: 'secondary' as const,
    },
    {
      key: 'functionCalling',
      condition: features?.functionCalling,
      variant: 'outline' as const,
    },
    {
      key: 'imageInput',
      condition: features?.input?.image,
      variant: 'outline' as const,
    },
    {
      key: 'pdfInput',
      condition: features?.input?.pdf,
      variant: 'outline' as const,
    },
  ];

  const cardContent = (
    <div
      className={cn(
        'group p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md flex flex-col items-start',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/50',
        isDisabled && 'opacity-50 cursor-not-allowed hover:shadow-none',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 w-full">
        <div className="flex items-center gap-2">
          <div className="transition-transform bg-muted rounded-lg p-1 group-hover:rotate-12">
            {getProviderIcon(provider)}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-sm">{model.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {provider}
            </p>
          </div>
        </div>
        {isSelected && <CheckCircle className="w-4 h-4 text-primary" />}
      </div>

      {/* Description */}
      {shortDescription && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 text-left">
          {shortDescription}
        </p>
      )}

      {/* Key Features Row */}
      <div className="flex flex-row gap-1 mb-3 flex-wrap">
        {featureBadges.map(({ key, condition, variant }) => {
          if (!condition || !isFeatureEnabled(key)) return null;

          const featureConfig = getFeatureConfig(key);
          if (!featureConfig) return null;

          const IconComponent = featureConfig.icon;

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <Badge variant={variant} className="text-xs px-2 py-0.5">
                  <IconComponent className="w-3 h-3 mr-1" />
                  {featureConfig.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent asChild>
                <p>{featureConfig.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Context Window */}
      {features?.contextWindow && (
        <div className="text-xs text-muted-foreground mb-2">
          <span className="font-medium">Context:</span>{' '}
          {formatTokens(features.contextWindow.input)} in /{' '}
          {formatTokens(features.contextWindow.output)} out
        </div>
      )}

      {/* Knowledge Cutoff */}
      {features?.knowledgeCutoff && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <Calendar className="w-3 h-3" />
          <span>
            Knowledge:{' '}
            {features.knowledgeCutoff.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
      )}

      {/* Pricing */}
      {pricing && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Pricing:</span> ${pricing.inputMTok}/M
          in, ${pricing.outputMTok}/M out
        </div>
      )}
    </div>
  );

  if (isDisabled && disabledReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
          <TooltipContent>
            <p>{disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <TooltipProvider>{cardContent}</TooltipProvider>;
}
