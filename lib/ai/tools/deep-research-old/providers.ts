import { gateway } from '@ai-sdk/gateway';

export function getModel() {
  const model = gateway('openai/o3-mini');
  if (!model) {
    throw new Error('No model found');
  }

  return model;
}
