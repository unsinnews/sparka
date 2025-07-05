import {
  extractReasoningMiddleware,
  wrapLanguageModel,
  type LanguageModelV1,
} from 'ai';
import { openai, type OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { anthropic, type AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { xai } from '@ai-sdk/xai';
import { google, type GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { type AvailableProviderModels, getModelDefinition } from './all-models';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

const telemetryConfig = {
  telemetry: {
    isEnabled: true,
    functionId: 'get-language-model',
  },
};

export const getLanguageModel = (modelId: AvailableProviderModels) => {
  const model = getModelDefinition(modelId);

  const spec = model.specification;

  let provider: LanguageModelV1;
  if (spec.provider === 'openai') {
    provider = openai.responses(spec.modelIdShort);
  } else if (spec.provider === 'anthropic') {
    provider = anthropic(spec.modelIdShort);
  } else if (spec.provider === 'xai') {
    provider = xai(spec.modelIdShort);
  } else if (spec.provider === 'google') {
    provider = google(spec.modelIdShort);
  } else {
    throw new Error(`Provider ${spec.provider} not supported`);
  }

  // Wrap with reasoning middleware if the model supports reasoning
  if (model.features?.reasoning && model.specification.provider === 'xai') {
    console.log('Wrapping reasoning middleware for', model.id);
    return wrapLanguageModel({
      model: provider,
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  }

  return provider;
};

export const getImageModel = (modelId: AvailableProviderModels) => {
  const model = getModelDefinition(modelId);
  if (model.specification.provider === 'openai') {
    return openai.image(model.specification.modelIdShort);
  }
  throw new Error(`Provider ${model.specification.provider} not supported`);
};

const MODEL_ALIASES = {
  'chat-model': isTestEnvironment
    ? chatModel
    : getLanguageModel('openai/gpt-4o-mini'),
  'title-model': isTestEnvironment
    ? titleModel
    : getLanguageModel('openai/gpt-4o-mini'),
  'artifact-model': isTestEnvironment
    ? artifactModel
    : getLanguageModel('openai/gpt-4o-mini'),
  'chat-model-reasoning': isTestEnvironment
    ? reasoningModel
    : getLanguageModel('openai/o3-mini'),
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
    } => {
  const model = getModelDefinition(providerModelId);

  const spec = model.specification;
  if (spec.provider === 'openai') {
    const mId = spec.modelIdShort;
    if (mId === 'o4-mini' || mId === 'o3' || mId === 'o3-mini') {
      return {
        openai: {
          reasoningSummary: 'auto',
        } satisfies OpenAIResponsesProviderOptions,
      };
    } else {
      mId;
      return { openai: {} };
    }
  } else if (spec.provider === 'anthropic') {
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
  } else if (spec.provider === 'xai') {
    return {
      xai: {},
    };
  } else if (spec.provider === 'google') {
    if (model.features?.reasoning) {
      return {
        google: {
          thinkingConfig: {
            includeThoughts: true,
            thinkingBudget: 10000,
          },
        },
      };
    } else {
      return { google: {} };
    }
  } else {
    throw new Error(`Provider ${model.specification.provider} not supported`);
  }
};
