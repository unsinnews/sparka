import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { xai } from '@ai-sdk/xai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { siteConfig } from '../config';
import { allModels } from './all-models';
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

export type AvailableModels = (typeof allModels)[number]['id'];

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

export const getModelProvider = (modelId: AvailableModels) => {
  const model = allModels.find((model) => model.id === modelId);
  if (!model) {
    throw new Error(`Model ${modelId} not found`);
  }

  const modelIdWithoutProvider = model.specification.modelId.split('/')[1];
  switch (model.specification.provider) {
    case 'openai':
      return openai(modelIdWithoutProvider);
    case 'anthropic':
      return anthropic(modelIdWithoutProvider);
    case 'xai':
      return xai(modelIdWithoutProvider);
    default:
      throw new Error(`Provider ${model.specification.provider} not supported`);
  }
};
