import type { GatewayModelId } from '@ai-sdk/gateway';

export interface ModelData {
  id: GatewayModelId;
  object: string;
  created: number;
  owned_by: string;
  name: string;
  description: string;
  context_window: number; // Max input tokens
  max_tokens: number; // Max output tokens
  pricing: {
    input: string; // Input price per token
    output: string; // Output price per token
  };
}
