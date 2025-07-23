import type { ModelData } from '@/providers/model-data';
import { modelsData } from '@/providers/models-generated';
import { modelFeatures, type ModelFeatures } from './model-features';
import type { GatewayModelId } from '@ai-sdk/gateway';

const disabledModels: Partial<Record<GatewayModelId, boolean>> = {
  'claude-4-opus': true,
};

export type ModelDefinition = ModelData & {
  features?: ModelFeatures;
  disabled?: boolean;
};

export const allModels = modelsData
  .map((model) => {
    const features = modelFeatures[model.id];
    const disabled = disabledModels[model.id];
    return {
      ...model,
      features,
      disabled,
    };
  })
  .filter((model) => model.disabled === false);

// Extract types from the allModels array

export type AvailableProviderModels = (typeof allModels)[number]['id'];

// Preferred provider order
const PROVIDER_ORDER = ['openai', 'google', 'anthropic', 'xai'];

export const allImplementedModels = allModels
  .filter((model) => model.disabled && model.features?.output?.text === true)
  .sort((a, b) => {
    const aProviderIndex = PROVIDER_ORDER.indexOf(a.owned_by);
    const bProviderIndex = PROVIDER_ORDER.indexOf(b.owned_by);

    // If provider is not in the preferred list, put it at the end
    const aIndex =
      aProviderIndex === -1 ? PROVIDER_ORDER.length : aProviderIndex;
    const bIndex =
      bProviderIndex === -1 ? PROVIDER_ORDER.length : bProviderIndex;

    // Sort by provider order first
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    // Within same provider, maintain original order from allModels array
    return 0;
  });

// Memoized dictionary of models by ID for efficient lookups
const _modelsByIdCache = new Map<string, ModelDefinition>();

function getModelsByIdDict(): Map<string, ModelDefinition> {
  if (_modelsByIdCache.size === 0) {
    allModels.forEach((model) => {
      _modelsByIdCache.set(model.id, model);
    });
  }
  return _modelsByIdCache;
}

export function getModelDefinition(
  modelId: AvailableProviderModels,
): ModelDefinition {
  const modelsByIdDict = getModelsByIdDict();
  const model = modelsByIdDict.get(modelId);
  if (!model) {
    throw new Error(`Model ${modelId} not found`);
  }
  return model;
}

export const DEFAULT_CHAT_MODEL: GatewayModelId = 'openai/gpt-4o-mini';
export const DEFAULT_PDF_MODEL: GatewayModelId = 'openai/gpt-4o-mini';
export const DEFAULT_IMAGE_MODEL: GatewayModelId = 'openai/gpt-image-1';
export const DEFAULT_TITLE_MODEL: GatewayModelId = 'openai/gpt-4o-mini';
export const DEFAULT_ARTIFACT_MODEL: GatewayModelId = 'openai/gpt-4.1-nano';
export const DEFAULT_ARTIFACT_SUGGESTION_MODEL: GatewayModelId =
  'openai/gpt-4o-mini';
