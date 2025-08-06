import type { OpenAIProvider } from '@ai-sdk/openai';
import type { GatewayModelId, GatewayProvider } from '@ai-sdk/gateway';

// Exclude the non-literal model ids
type GatewayLiteralModelId = GatewayModelId extends infer T
  ? T extends string
    ? string extends T
      ? never
      : T
    : never
  : never;

type GatewayEmbeddingModelId = Parameters<
  GatewayProvider['textEmbeddingModel']
>[0];

type GatewayEmbeddingLiteralModelId = GatewayEmbeddingModelId extends infer T
  ? T extends string
    ? string extends T
      ? never
      : T
    : never
  : never;

// Adds models available in gateway but not yet in the gateway package
export type ModelId =
  | GatewayLiteralModelId
  | GatewayEmbeddingLiteralModelId
  | 'anthropic/claude-4.1-opus';

type OpenAIimageModelId = Parameters<OpenAIProvider['imageModel']>[0];

// Exclude the non-literal model ids
type OpenAILiteralImageModelId = OpenAIimageModelId extends infer T
  ? T extends string
    ? string extends T
      ? never
      : T
    : never
  : never;

export type ImageModelId = `openai/${OpenAILiteralImageModelId}`;
