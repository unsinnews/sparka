import type { GatewayModelId } from '@ai-sdk/gateway';

export function getModelAndProvider(modelId: GatewayModelId) {
  const [provider, model] = modelId.split('/');
  if (!provider || !model) {
    throw new Error(`Invalid model ID: ${modelId}`);
  }
  return { provider, model };
}
