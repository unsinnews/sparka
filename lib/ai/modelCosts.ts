import type { AvailableModels } from '../ai/providers';

export const modelCosts: Record<AvailableModels, number> = {
  'gpt-4o': 1,
  'dall-e-3': 60,
  'gpt-o1-preview': 50,
};
