import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
  type LanguageModelV1,
} from 'ai';
import { openai, type OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { anthropic, type AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { xai } from '@ai-sdk/xai';

import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { siteConfig } from '../config';
import { type AvailableProviderModels, getModelDefinition } from './all-models';

const telemetryConfig = {
  experimental_telemetry: {
    isEnabled: true,
    functionId: siteConfig.appPrefix,
  },
};

export const models = {
  'gpt-4o': {
    provider: openai('gpt-4o'),
    text: true,
    tools: true,
    image: false,
  },
  'dall-e-3': {
    provider: openai.image('dall-e-3'),
    text: false,
    tools: false,
    image: true,
  },
  'gpt-o1-preview': {
    provider: openai('gpt-o1-preview'),
    text: true,
    tools: true,
    image: false,
  },
};

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'gpt-4o': models['gpt-4o'].provider,
        'chat-model': models['gpt-4o'].provider,
        'chat-model-reasoning': wrapLanguageModel({
          model: models['gpt-4o'].provider,
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': models['gpt-4o'].provider,
        'artifact-model': models['gpt-4o'].provider,
      },
      imageModels: {
        'small-model': models['dall-e-3'].provider,
      },
      ...telemetryConfig,
    });

export const getModelProvider = (modelId: AvailableProviderModels) => {
  const model = getModelDefinition(modelId);

  const spec = model.specification;

  let provider: LanguageModelV1;
  if (spec.provider === 'openai') {
    provider = openai.responses(spec.modelIdShort);
  } else if (spec.provider === 'anthropic') {
    provider = anthropic(spec.modelIdShort);
  } else if (spec.provider === 'xai') {
    provider = xai(spec.modelIdShort);
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
  } else {
    throw new Error(`Provider ${model.specification.provider} not supported`);
  }
};
