import { extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import type { LanguageModelV2 } from '@ai-sdk/provider';

import { openai, type OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { xai } from '@ai-sdk/xai';
import { google, type GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { type AvailableProviderModels, getModelDefinition } from './all-models';
import { gateway } from '@ai-sdk/gateway';

const telemetryConfig = {
  telemetry: {
    isEnabled: true,
    functionId: 'get-language-model',
  },
};

function extractModelIdShort(gatewayModelId: string): string {
  // Extract the short model ID from gateway format (e.g., "openai/gpt-4o-mini" -> "gpt-4o-mini")
  const parts = gatewayModelId.split('/');
  return parts.length > 1 ? parts[1] : gatewayModelId;
}

export const getLanguageModel = (modelId: AvailableProviderModels) => {
  const model = getModelDefinition(modelId);
  const provider = model.owned_by;
  const modelIdShort = extractModelIdShort(model.id);

  let languageProvider: LanguageModelV2;
  if (provider === 'openai') {
    languageProvider = openai.responses(modelIdShort);
  } else if (provider === 'anthropic') {
    // provider = anthropic(modelIdShort);
    languageProvider = gateway(model.id);
  } else if (provider === 'xai') {
    languageProvider = xai(modelIdShort);
  } else if (provider === 'google') {
    languageProvider = google(modelIdShort);
  } else {
    languageProvider = gateway(model.id);
  }

  // Wrap with reasoning middleware if the model supports reasoning
  if (model.features?.reasoning && provider === 'xai') {
    console.log('Wrapping reasoning middleware for', model.id);
    return wrapLanguageModel({
      model: languageProvider,
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  }

  return languageProvider;
};

export const getImageModel = (modelId: AvailableProviderModels) => {
  const model = getModelDefinition(modelId);
  const provider = model.owned_by;
  const modelIdShort = extractModelIdShort(model.id);

  if (provider === 'openai') {
    return openai.image(modelIdShort);
  }
  throw new Error(`Provider ${provider} not supported`);
};

const MODEL_ALIASES = {
  'chat-model': getLanguageModel('openai/gpt-4o-mini'),
  'title-model': getLanguageModel('openai/gpt-4o-mini'),
  'artifact-model': getLanguageModel('openai/gpt-4o-mini'),
  'chat-model-reasoning': getLanguageModel('openai/o3-mini'),
};

export const getModelProviderOptions = (
  providerModelId: AvailableProviderModels,
):
  | {
      openai: OpenAIResponsesProviderOptions;
    }
  | {
      anthropic: AnthropicProviderOptions;
    }
  | {
      xai: Record<string, never>;
    }
  | {
      google: GoogleGenerativeAIProviderOptions;
    }
  | Record<string, never> => {
  const model = getModelDefinition(providerModelId);
  const provider = model.owned_by;
  const modelIdShort = extractModelIdShort(model.id);

  if (provider === 'openai') {
    if (
      modelIdShort === 'o4-mini' ||
      modelIdShort === 'o3' ||
      modelIdShort === 'o3-mini'
    ) {
      return {
        openai: {
          reasoningSummary: 'auto',
        } satisfies OpenAIResponsesProviderOptions,
      };
    } else {
      return { openai: {} };
    }
  } else if (provider === 'anthropic') {
    if (model.features?.reasoning) {
      return {
        anthropic: {
          thinking: {
            type: 'enabled',
            budgetTokens: 4096,
          },
        } satisfies AnthropicProviderOptions,
      };
    } else {
      return { anthropic: {} };
    }
  } else if (provider === 'xai') {
    return {
      xai: {},
    };
  } else if (provider === 'google') {
    if (model.features?.reasoning) {
      return {
        google: {
          thinkingConfig: {
            thinkingBudget: 10000,
          },
        },
      };
    } else {
      return { google: {} };
    }
  } else {
    return {};
  }
};
