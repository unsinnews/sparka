import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Brain, Zap, Eye, Calendar, Building, CheckCircle } from 'lucide-react';
import type { ModelDefinition } from '@/lib/ai/all-models';
import { AnthropicIcon, OpenAIIcon, XAIIcon } from './icons';

const PlaceholderIcon = () => <Building className="w-6 h-6" />;

interface ModelCardProps {
  model: ModelDefinition;
  isSelected?: boolean;
  onClick?: () => void;
}

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
    default:
      return <PlaceholderIcon />;
  }
}

export function ModelCard({ model, isSelected, onClick }: ModelCardProps) {
  const { features, pricing, shortDescription } = model;
  const provider = model.specification.provider;

  return (
    <TooltipProvider>
      <div
        className={`
          group p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md
          ${
            isSelected
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-primary/50'
          }
        `}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="transition-transform bg-muted rounded-lg p-1 group-hover:rotate-12">
              {getProviderIcon(provider)}
            </div>
            <div>
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
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {shortDescription}
          </p>
        )}

        {/* Key Features Row */}
        <div className="flex flex-wrap gap-1 mb-3">
          {features?.reasoning && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  <Brain className="w-3 h-3 mr-1" />
                  Reasoning
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Advanced reasoning capabilities</p>
              </TooltipContent>
            </Tooltip>
          )}

          {features?.functionCalling && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  <Zap className="w-3 h-3 mr-1" />
                  Tools
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tool calling support</p>
              </TooltipContent>
            </Tooltip>
          )}

          {features?.input?.image && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  <Eye className="w-3 h-3 mr-1" />
                  Vision
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Supports image input</p>
              </TooltipContent>
            </Tooltip>
          )}
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
    </TooltipProvider>
  );
}
