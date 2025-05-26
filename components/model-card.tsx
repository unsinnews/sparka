import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Brain,
  Zap,
  Image,
  FileText,
  Mic,
  Calendar,
  MessageSquare,
  Building,
  CheckCircle,
} from 'lucide-react';
import type { ModelDefinition } from '@/lib/ai/all-models';

// Provider Icons
const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
  </svg>
);

const AnthropicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2L2 22h4l2-5h8l2 5h4L12 2zm-2 13l2-5 2 5H10z" />
  </svg>
);

const XAIIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PlaceholderIcon = () => <Building className="w-4 h-4" />;

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
      return <OpenAIIcon />;
    case 'anthropic':
      return <AnthropicIcon />;
    case 'xai':
      return <XAIIcon />;
    default:
      return <PlaceholderIcon />;
  }
}

function getProviderColor(provider: string) {
  switch (provider) {
    case 'openai':
      return 'text-green-600 dark:text-green-400';
    case 'anthropic':
      return 'text-orange-600 dark:text-orange-400';
    case 'xai':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

export function ModelCard({ model, isSelected, onClick }: ModelCardProps) {
  const { features, pricing, shortDescription } = model;
  const provider = model.specification.provider;

  return (
    <TooltipProvider>
      <div
        className={`
          p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md
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
            <div className={getProviderColor(provider)}>
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
                  Functions
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Function calling support</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Input/Output Capabilities */}
        {features && (
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Input:
              </span>
              <div className="flex gap-1">
                {features.input.text && (
                  <Tooltip>
                    <TooltipTrigger>
                      <FileText className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Text</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {features.input.image && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Image className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Images</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {features.input.audio && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Mic className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Audio</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Output:
              </span>
              <div className="flex gap-1">
                {features.output.text && (
                  <Tooltip>
                    <TooltipTrigger>
                      <MessageSquare className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Text</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {features.output.image && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Image className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Images</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {features.output.audio && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Mic className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Audio</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        )}

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
