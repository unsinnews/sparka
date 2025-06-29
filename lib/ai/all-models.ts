export interface ModelSpecification {
  specificationVersion: string;
  provider: string;
  modelId: string;
  modelIdShort: string;
}

export interface Pricing {
  inputMTok: number; // per 1M tokens
  outputMTok: number; // per 1M tokens
}

interface ModelDefinitionInternal {
  id: string;
  name: string;
  enabled: boolean;
  specification: ModelSpecification;
  pricing?: Pricing;
  shortDescription?: string;
  features?: {
    reasoning: boolean;
    functionCalling: boolean;
    contextWindow: {
      input: number;
      output: number;
    };
    knowledgeCutoff?: Date;
    input: {
      image: boolean;
      text: boolean;
      pdf: boolean;
      audio: boolean;
    };
    output: {
      image: boolean;
      text: boolean;
      audio: boolean;
    };
    fixedTemperature?: number;
  };
}

export const allModels = [
  {
    id: 'anthropic/claude-v3-opus',
    name: 'Claude 3 Opus',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'anthropic',
      modelId: 'anthropic/claude-3-opus-latest',
      modelIdShort: 'claude-3-opus-latest',
    },
    pricing: {
      inputMTok: 15,
      outputMTok: 75,
    },
    shortDescription: 'Powerful model for complex tasks',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 200000,
        output: 4096,
      },
      knowledgeCutoff: new Date('2023-08-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'anthropic/claude-v3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'anthropic',
      modelId: 'anthropic/claude-3-5-sonnet-latest',
      modelIdShort: 'claude-3-5-sonnet-latest',
    },
    pricing: {
      inputMTok: 3,
      outputMTok: 15,
    },
    shortDescription: 'Our previous intelligent model',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 200000,
        output: 8192,
      },
      knowledgeCutoff: new Date('2024-04-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'anthropic',
      modelId: 'anthropic/claude-3-5-haiku-latest',
      modelIdShort: 'claude-3-5-haiku-latest',
    },
    pricing: {
      inputMTok: 0.8,
      outputMTok: 4,
    },
    shortDescription: 'Our fastest model',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 200000,
        output: 8192,
      },
      knowledgeCutoff: new Date('2024-07-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'anthropic',
      modelId: 'anthropic/claude-3-7-sonnet-latest',
      modelIdShort: 'claude-3-7-sonnet-latest',
    },
    pricing: {
      inputMTok: 3,
      outputMTok: 15,
    },
    shortDescription: 'High-performance model with early extended thinking',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 200000,
        output: 64000,
      },
      knowledgeCutoff: new Date('2024-11-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'anthropic/claude-3.7-sonnet-reasoning',
    name: 'Claude 3.7 Sonnet Reasoning',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'anthropic',
      modelId: 'anthropic/claude-3-7-sonnet-latest',
      modelIdShort: 'claude-3-7-sonnet-latest',
    },
    pricing: {
      inputMTok: 3,
      outputMTok: 15,
    },
    shortDescription:
      'High-performance model with toggleable extended thinking',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 200000,
        output: 64000,
      },
      knowledgeCutoff: new Date('2024-11-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'anthropic/claude-4-opus-20250514',
    name: 'Claude 4 Opus',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'anthropic',
      modelId: 'anthropic/claude-opus-4-0',
      modelIdShort: 'claude-opus-4-0',
    },
    pricing: {
      inputMTok: 15,
      outputMTok: 75,
    },
    shortDescription: 'Our most capable model',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 200000,
        output: 32000,
      },
      knowledgeCutoff: new Date('2025-03-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'anthropic/claude-4-sonnet-20250514',
    name: 'Claude 4 Sonnet',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'anthropic',
      modelId: 'anthropic/claude-sonnet-4-0',
      modelIdShort: 'claude-sonnet-4-0',
    },
    pricing: {
      inputMTok: 3,
      outputMTok: 15,
    },
    shortDescription: 'High-performance model',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 200000,
        output: 64000,
      },
      knowledgeCutoff: new Date('2025-03-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'bedrock/amazon.nova-pro-v1:0',
    name: 'Nova Pro',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/amazon.nova-pro-v1:0',
      modelIdShort: 'amazon.nova-pro-v1:0',
    },
  },
  {
    id: 'bedrock/amazon.nova-lite-v1:0',
    name: 'Nova Lite',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/amazon.nova-lite-v1:0',
      modelIdShort: 'amazon.nova-lite-v1:0',
    },
  },
  {
    id: 'bedrock/amazon.nova-micro-v1:0',
    name: 'Nova Micro',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/amazon.nova-micro-v1:0',
      modelIdShort: 'amazon.nova-micro-v1:0',
    },
  },
  {
    id: 'bedrock/claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/claude-3-7-sonnet-20250219',
      modelIdShort: 'claude-3-7-sonnet-20250219',
    },
  },
  {
    id: 'bedrock/claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/claude-3-5-haiku-20241022',
      modelIdShort: 'claude-3-5-haiku-20241022',
    },
  },
  {
    id: 'bedrock/claude-3-5-sonnet-20241022-v2',
    name: 'Claude 3.5 Sonnet v2 (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/claude-3-5-sonnet-20241022-v2',
      modelIdShort: 'claude-3-5-sonnet-20241022-v2',
    },
  },
  {
    id: 'bedrock/claude-3-5-sonnet-20240620-v1',
    name: 'Claude 3.5 Sonnet (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/claude-3-5-sonnet-20240620-v1',
      modelIdShort: 'claude-3-5-sonnet-20240620-v1',
    },
  },
  {
    id: 'bedrock/claude-3-opus-20240229-v1',
    name: 'Claude 3 Opus (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/claude-3-opus-20240229-v1',
      modelIdShort: 'claude-3-opus-20240229-v1',
    },
  },
  {
    id: 'bedrock/claude-4-opus-20250514-v1',
    name: 'Claude 4 Opus (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/claude-4-opus-20250514-v1',
      modelIdShort: 'claude-4-opus-20250514-v1',
    },
  },
  {
    id: 'bedrock/claude-4-sonnet-20250514-v1',
    name: 'Claude 4 Sonnet (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/claude-4-sonnet-20250514-v1',
      modelIdShort: 'claude-4-sonnet-20250514-v1',
    },
  },
  {
    id: 'bedrock/claude-3-haiku-20240307-v1',
    name: 'Claude 3 Haiku (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/claude-3-haiku-20240307-v1',
      modelIdShort: 'claude-3-haiku-20240307-v1',
    },
  },
  {
    id: 'bedrock/meta.llama4-maverick-17b-instruct-v1',
    name: 'Llama 4 Maverick 17B Instruct (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/meta.llama4-maverick-17b-instruct-v1',
      modelIdShort: 'meta.llama4-maverick-17b-instruct-v1',
    },
  },
  {
    id: 'bedrock/meta.llama4-scout-17b-instruct-v1',
    name: 'Llama 4 Scout 17B Instruct (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/meta.llama4-scout-17b-instruct-v1',
      modelIdShort: 'meta.llama4-scout-17b-instruct-v1',
    },
  },
  {
    id: 'bedrock/meta.llama3-3-70b-instruct-v1',
    name: 'Llama 3.3 70B Instruct (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/meta.llama3-3-70b-instruct-v1',
      modelIdShort: 'meta.llama3-3-70b-instruct-v1',
    },
  },
  {
    id: 'bedrock/meta.llama3-2-11b-instruct-v1',
    name: 'Llama 3.2 11B Vision Instruct (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/meta.llama3-2-11b-instruct-v1',
      modelIdShort: 'meta.llama3-2-11b-instruct-v1',
    },
  },
  {
    id: 'bedrock/meta.llama3-2-1b-instruct-v1',
    name: 'Llama 3.2 1B Instruct (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/meta.llama3-2-1b-instruct-v1',
      modelIdShort: 'meta.llama3-2-1b-instruct-v1',
    },
  },
  {
    id: 'bedrock/meta.llama3-2-3b-instruct-v1',
    name: 'Llama 3.2 3B Instruct (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/meta.llama3-2-3b-instruct-v1',
      modelIdShort: 'meta.llama3-2-3b-instruct-v1',
    },
  },
  {
    id: 'bedrock/meta.llama3-2-90b-instruct-v1',
    name: 'Llama 3.2 90B Vision Instruct (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/meta.llama3-2-90b-instruct-v1',
      modelIdShort: 'meta.llama3-2-90b-instruct-v1',
    },
  },
  {
    id: 'bedrock/meta.llama3-1-70b-instruct-v1',
    name: 'Llama 3.1 70B Instruct (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/meta.llama3-1-70b-instruct-v1',
      modelIdShort: 'meta.llama3-1-70b-instruct-v1',
    },
  },
  {
    id: 'bedrock/meta.llama3-1-8b-instruct-v1',
    name: 'Llama 3.1 8B Instruct (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/meta.llama3-1-8b-instruct-v1',
      modelIdShort: 'meta.llama3-1-8b-instruct-v1',
    },
  },
  {
    id: 'bedrock/deepseek.r1-v1',
    name: 'DeepSeek-R1 (Bedrock)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'bedrock',
      modelId: 'bedrock/deepseek.r1-v1',
      modelIdShort: 'deepseek.r1-v1',
    },
  },
  {
    id: 'cerebras/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'cerebras',
      modelId: 'cerebras/llama-4-scout-17b-16e-instruct',
      modelIdShort: 'llama-4-scout-17b-16e-instruct',
    },
  },
  {
    id: 'cerebras/llama3.1-8b',
    name: 'Llama 3.1 8B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'cerebras',
      modelId: 'cerebras/llama3.1-8b',
      modelIdShort: 'llama3.1-8b',
    },
  },
  {
    id: 'cerebras/llama-3.3-70b',
    name: 'Llama 3.3 70B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'cerebras',
      modelId: 'cerebras/llama-3.3-70b',
      modelIdShort: 'llama-3.3-70b',
    },
  },
  {
    id: 'cerebras/deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill Llama 70B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'cerebras',
      modelId: 'cerebras/deepseek-r1-distill-llama-70b',
      modelIdShort: 'deepseek-r1-distill-llama-70b',
    },
  },
  {
    id: 'cerebras/qwen-3-32b',
    name: 'Qwen 3.32B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'cerebras',
      modelId: 'cerebras/qwen-3-32b',
      modelIdShort: 'qwen-3-32b',
    },
  },
  {
    id: 'cohere/command-a',
    name: 'Command A',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'cohere',
      modelId: 'cohere/command-a',
      modelIdShort: 'command-a',
    },
  },
  {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'cohere',
      modelId: 'cohere/command-r-plus',
      modelIdShort: 'command-r-plus',
    },
  },
  {
    id: 'cohere/command-r',
    name: 'Command R',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'cohere',
      modelId: 'cohere/command-r',
      modelIdShort: 'command-r',
    },
  },
  {
    id: 'deepinfra/llama-4-maverick-17b-128e-instruct-fp8',
    name: 'Llama 4 Maverick 17B 128E Instruct FP8',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'deepinfra',
      modelId: 'deepinfra/llama-4-maverick-17b-128e-instruct-fp8',
      modelIdShort: 'llama-4-maverick-17b-128e-instruct-fp8',
    },
  },
  {
    id: 'deepinfra/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B 16E Instruct',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'deepinfra',
      modelId: 'deepinfra/llama-4-scout-17b-16e-instruct',
      modelIdShort: 'llama-4-scout-17b-16e-instruct',
    },
  },
  {
    id: 'deepinfra/qwen3-235b-a22b',
    name: 'Qwen3-235B-A22B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'deepinfra',
      modelId: 'deepinfra/qwen3-235b-a22b',
      modelIdShort: 'qwen3-235b-a22b',
    },
  },
  {
    id: 'deepinfra/qwen3-30b-a3b',
    name: 'Qwen3-30B-A3B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'deepinfra',
      modelId: 'deepinfra/qwen3-30b-a3b',
      modelIdShort: 'qwen3-30b-a3b',
    },
  },
  {
    id: 'deepinfra/qwen3-32b',
    name: 'Qwen3-32B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'deepinfra',
      modelId: 'deepinfra/qwen3-32b',
      modelIdShort: 'qwen3-32b',
    },
  },
  {
    id: 'deepinfra/qwen3-14b',
    name: 'Qwen3-14B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'deepinfra',
      modelId: 'deepinfra/qwen3-14b',
      modelIdShort: 'qwen3-14b',
    },
  },
  {
    id: 'deepseek/chat',
    name: 'DeepSeek-V3',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'fireworks',
      modelId: 'deepseek/chat',
      modelIdShort: 'chat',
    },
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'fireworks',
      modelId: 'deepseek/deepseek-r1',
      modelIdShort: 'deepseek-r1',
    },
  },
  {
    id: 'fireworks/firefunction-v1',
    name: 'FireFunction V1',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'fireworks',
      modelId: 'fireworks/firefunction-v1',
      modelIdShort: 'firefunction-v1',
    },
  },
  {
    id: 'fireworks/mixtral-8x22b-instruct',
    name: 'Mixtral MoE 8x22B Instruct',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'fireworks',
      modelId: 'fireworks/mixtral-8x22b-instruct',
      modelIdShort: 'mixtral-8x22b-instruct',
    },
  },
  {
    id: 'fireworks/mixtral-8x7b-instruct',
    name: 'Mixtral MoE 8x7B Instruct',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'fireworks',
      modelId: 'fireworks/mixtral-8x7b-instruct',
      modelIdShort: 'mixtral-8x7b-instruct',
    },
  },
  {
    id: 'fireworks/qwq-32b',
    name: 'QwQ-32B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'fireworks',
      modelId: 'fireworks/qwq-32b',
      modelIdShort: 'qwq-32b',
    },
  },
  {
    id: 'fireworks/qwen3-235b-a22b',
    name: 'Qwen3-235B-A22B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'fireworks',
      modelId: 'fireworks/qwen3-235b-a22b',
      modelIdShort: 'qwen3-235b-a22b',
    },
  },
  {
    id: 'google/gemini-2.5-flash-preview-05-20',
    name: 'Gemini 2.5 Flash Preview',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'google',
      modelId: 'google/gemini-2.5-flash-preview-05-20',
      modelIdShort: 'gemini-2.5-flash-preview-05-20',
    },
    pricing: {
      inputMTok: 0.15,
      outputMTok: 0.6, // Non-thinking tokens: $0.60 Thinking tokens: $3.50
    },
    shortDescription: 'Best price-performance model with adaptive thinking',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 1048576,
        output: 65536,
      },
      knowledgeCutoff: new Date('2025-01-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: true,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'google/gemini-2.5-pro-preview-06-05',
    name: 'Gemini 2.5 Pro Preview',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'google',
      modelId: 'google/gemini-2.5-pro-preview-06-05',
      modelIdShort: 'gemini-2.5-pro-preview-06-05',
    },
    pricing: {
      inputMTok: 1.25,
      outputMTok: 10.0,
    },
    shortDescription:
      'Most advanced thinking model for complex reasoning tasks',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 200000, // 1048576 at another tier pricing
        output: 65536,
      },
      knowledgeCutoff: new Date('2025-01-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: true,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'google/gemini-2.5-flash-native-audio-05-20',
    name: 'Gemini 2.5 Flash Native Audio',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'google',
      modelId: 'google/gemini-2.5-flash-native-audio-05-20',
      modelIdShort: 'gemini-2.5-flash-native-audio-05-20',
    },
    pricing: {
      inputMTok: 0.5, // text input
      outputMTok: 2.0, // text output, audio is $12/M tokens
    },
    shortDescription:
      'Native audio model for natural conversational experiences',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 128000,
        output: 8000,
      },
      knowledgeCutoff: new Date('2025-01-01'),
      input: {
        image: false,
        text: true,
        pdf: false,
        audio: true,
      },
      output: {
        image: false,
        text: true,
        audio: true,
      },
    },
  },
  {
    id: 'google/gemini-2.5-flash-preview-tts',
    name: 'Gemini 2.5 Flash Preview TTS',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'google',
      modelId: 'google/gemini-2.5-flash-preview-tts',
      modelIdShort: 'gemini-2.5-flash-preview-tts',
    },
    pricing: {
      inputMTok: 0.5,
      outputMTok: 10.0, // audio output
    },
    shortDescription: 'Text-to-speech model for controllable audio generation',
    features: {
      reasoning: false,
      functionCalling: false,
      contextWindow: {
        input: 8000,
        output: 16000,
      },
      knowledgeCutoff: new Date('2025-01-01'),
      input: {
        image: false,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: false,
        audio: true,
      },
    },
  },
  {
    id: 'google/gemini-2.5-pro-preview-tts',
    name: 'Gemini 2.5 Pro Preview TTS',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'google',
      modelId: 'google/gemini-2.5-pro-preview-tts',
      modelIdShort: 'gemini-2.5-pro-preview-tts',
    },
    pricing: {
      inputMTok: 1.0,
      outputMTok: 20.0, // audio output
    },
    shortDescription: 'Most powerful text-to-speech model for natural outputs',
    features: {
      reasoning: false,
      functionCalling: false,
      contextWindow: {
        input: 8000,
        output: 16000,
      },
      knowledgeCutoff: new Date('2025-01-01'),
      input: {
        image: false,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: false,
        audio: true,
      },
    },
  },
  {
    id: 'google/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'google',
      modelId: 'google/gemini-2.0-flash',
      modelIdShort: 'gemini-2.0-flash',
    },
    pricing: {
      inputMTok: 0.075,
      outputMTok: 0.3,
    },
    shortDescription:
      'Next-generation multimodal model with enhanced capabilities',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 1048576,
        output: 8192,
      },
      knowledgeCutoff: new Date('2024-08-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: true,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'google/gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'google',
      modelId: 'google/gemini-2.0-flash-lite',
      modelIdShort: 'gemini-2.0-flash-lite',
    },
    pricing: {
      inputMTok: 0.037, // Estimated lower price for lite version
      outputMTok: 0.15,
    },
    shortDescription: 'Cost-efficient version optimized for low latency',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 1048576,
        output: 8192,
      },
      knowledgeCutoff: new Date('2024-08-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: true,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'google/gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'google',
      modelId: 'google/gemini-1.5-pro',
      modelIdShort: 'gemini-1.5-pro',
    },
    pricing: {
      inputMTok: 1.25,
      outputMTok: 5.0,
    },
    shortDescription: 'Mid-size multimodal model with 2M token context window',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 2097152,
        output: 8192,
      },
      knowledgeCutoff: new Date('2024-09-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: true,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'google/gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'google',
      modelId: 'google/gemini-1.5-flash',
      modelIdShort: 'gemini-1.5-flash',
    },
    pricing: {
      inputMTok: 0.075,
      outputMTok: 0.3,
    },
    shortDescription: 'Fast and versatile multimodal model for diverse tasks',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 1048576,
        output: 8192,
      },
      knowledgeCutoff: new Date('2024-09-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: true,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'google/gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash-8B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'google',
      modelId: 'google/gemini-1.5-flash-8b',
      modelIdShort: 'gemini-1.5-flash-8b',
    },
    pricing: {
      inputMTok: 0.0375,
      outputMTok: 0.15,
    },
    shortDescription: 'Smallest model for lower intelligence tasks',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 1048576,
        output: 8192,
      },
      knowledgeCutoff: new Date('2024-10-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: true,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },

  {
    id: 'groq/llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'groq',
      modelId: 'groq/llama-3.3-70b-versatile',
      modelIdShort: 'llama-3.3-70b-versatile',
    },
  },
  {
    id: 'groq/llama-3.1-8b',
    name: 'Llama 3.1 8B Instant',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'groq',
      modelId: 'groq/llama-3.1-8b',
      modelIdShort: 'llama-3.1-8b',
    },
  },
  {
    id: 'groq/llama-3-8b-instruct',
    name: 'Llama 3 8B Instruct',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'groq',
      modelId: 'groq/llama-3-8b-instruct',
      modelIdShort: 'llama-3-8b-instruct',
    },
  },
  {
    id: 'groq/llama-3-70b-instruct',
    name: 'Llama 3 70B Instruct',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'groq',
      modelId: 'groq/llama-3-70b-instruct',
      modelIdShort: 'llama-3-70b-instruct',
    },
  },
  {
    id: 'groq/gemma2-9b-it',
    name: 'Gemma 2 9B IT',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'groq',
      modelId: 'groq/gemma2-9b-it',
      modelIdShort: 'gemma2-9b-it',
    },
  },
  {
    id: 'groq/deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill Llama 70B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'groq',
      modelId: 'groq/deepseek-r1-distill-llama-70b',
      modelIdShort: 'deepseek-r1-distill-llama-70b',
    },
  },
  {
    id: 'groq/mistral-saba-24b',
    name: 'Mistral Saba 24B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'groq',
      modelId: 'groq/mistral-saba-24b',
      modelIdShort: 'mistral-saba-24b',
    },
  },
  {
    id: 'groq/qwen-qwq-32b',
    name: 'QWQ-32B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'groq',
      modelId: 'groq/qwen-qwq-32b',
      modelIdShort: 'qwen-qwq-32b',
    },
  },
  {
    id: 'groq/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B 16E Instruct',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'groq',
      modelId: 'groq/llama-4-scout-17b-16e-instruct',
      modelIdShort: 'llama-4-scout-17b-16e-instruct',
    },
  },
  {
    id: 'inception/mercury-coder-small',
    name: 'Mercury Coder Small Beta',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'inception',
      modelId: 'inception/mercury-coder-small',
      modelIdShort: 'mercury-coder-small',
    },
  },
  {
    id: 'mistral/mistral-large',
    name: 'Mistral Large',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'mistral',
      modelId: 'mistral/mistral-large',
      modelIdShort: 'mistral-large',
    },
  },
  {
    id: 'mistral/mistral-small',
    name: 'Mistral Small',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'mistral',
      modelId: 'mistral/mistral-small',
      modelIdShort: 'mistral-small',
    },
  },
  {
    id: 'mistral/codestral-2501',
    name: 'Mistral Codestral 25.01',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'mistral',
      modelId: 'mistral/codestral-2501',
      modelIdShort: 'codestral-2501',
    },
  },
  {
    id: 'mistral/pixtral-12b-2409',
    name: 'Pixtral 12B 2409',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'mistral',
      modelId: 'mistral/pixtral-12b-2409',
      modelIdShort: 'pixtral-12b-2409',
    },
  },
  {
    id: 'mistral/ministral-3b-latest',
    name: 'Ministral 3B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'mistral',
      modelId: 'mistral/ministral-3b-latest',
      modelIdShort: 'ministral-3b-latest',
    },
  },
  {
    id: 'mistral/ministral-8b-latest',
    name: 'Ministral 8B',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'mistral',
      modelId: 'mistral/ministral-8b-latest',
      modelIdShort: 'ministral-8b-latest',
    },
  },
  {
    id: 'mistral/pixtral-large-latest',
    name: 'Pixtral Large',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'mistral',
      modelId: 'mistral/pixtral-large-latest',
      modelIdShort: 'pixtral-large-latest',
    },
  },
  {
    id: 'mistral/mistral-small-2503',
    name: 'Mistral Small 2503',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'mistral',
      modelId: 'mistral/mistral-small-2503',
      modelIdShort: 'mistral-small-2503',
    },
  },
  {
    id: 'openai/o3-mini',
    name: 'o3-mini',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'openai',
      modelId: 'openai/o3-mini',
      modelIdShort: 'o3-mini',
    },
    pricing: {
      inputMTok: 1.1,
      outputMTok: 4.4,
    },
    shortDescription:
      'Small, cost-efficient reasoning model optimized for coding, math, and science',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 200000,
        output: 100000,
      },
      knowledgeCutoff: new Date('2023-10-01'),
      input: {
        image: false,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'openai/o3',
    name: 'o3',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'openai',
      modelId: 'openai/o3',
      modelIdShort: 'o3',
    },
    pricing: {
      inputMTok: 10.0,
      outputMTok: 40.0,
    },
    shortDescription:
      'Advanced reasoning model for complex problem-solving tasks',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 200000,
        output: 100000,
      },
      knowledgeCutoff: new Date('2025-03-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    name: 'o4-mini',
    id: 'openai/o4-mini',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'openai',
      modelId: 'openai/o4-mini',
      modelIdShort: 'o4-mini',
    },
    pricing: {
      inputMTok: 1.1,
      outputMTok: 4.4,
    },
    shortDescription:
      'Enhanced reasoning model with multimodal capabilities and improved performance',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 200000,
        output: 100000,
      },
      knowledgeCutoff: new Date('2024-05-31'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
      fixedTemperature: 1,
    },
  },
  {
    id: 'openai/gpt-4.1',
    name: 'GPT-4.1',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'openai',
      modelId: 'openai/gpt-4.1',
      modelIdShort: 'gpt-4.1',
    },
    pricing: {
      inputMTok: 2.0,
      outputMTok: 8.0,
    },
    shortDescription:
      'Latest flagship model with 1M token context and superior coding capabilities',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 1047576,
        output: 32768,
      },
      knowledgeCutoff: new Date('2024-06-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'openai/gpt-4.1-mini',
    name: 'GPT-4.1 mini',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'openai',
      modelId: 'openai/gpt-4.1-mini',
      modelIdShort: 'gpt-4.1-mini',
    },
    pricing: {
      inputMTok: 0.4,
      outputMTok: 1.6,
    },
    shortDescription:
      'Cost-efficient model with 1M context that matches GPT-4o performance',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 1047576,
        output: 32768,
      },
      knowledgeCutoff: new Date('2024-06-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'openai/gpt-4.1-nano',
    name: 'GPT-4.1 nano',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'openai',
      modelId: 'openai/gpt-4.1-nano',
      modelIdShort: 'gpt-4.1-nano',
    },
    pricing: {
      inputMTok: 0.1,
      outputMTok: 0.4,
    },
    shortDescription:
      'Fastest GPT-4.1 model optimized for speed and efficiency',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 1047576,
        output: 32768,
      },
      knowledgeCutoff: new Date('2024-06-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'openai',
      modelId: 'openai/gpt-4o',
      modelIdShort: 'gpt-4o',
    },
    pricing: {
      inputMTok: 2.5,
      outputMTok: 10.0,
    },
    shortDescription:
      'Flagship multimodal model with enhanced accuracy and responsiveness',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 128000,
        output: 16384,
      },
      knowledgeCutoff: new Date('2023-10-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o mini',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'openai',
      modelId: 'openai/gpt-4o-mini',
      modelIdShort: 'gpt-4o-mini',
    },
    pricing: {
      inputMTok: 0.15,
      outputMTok: 0.6,
    },
    shortDescription:
      'Fast, inexpensive, capable model ideal for replacing GPT-3.5 Turbo',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 128000,
        output: 16384,
      },
      knowledgeCutoff: new Date('2023-10-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'openai',
      modelId: 'openai/gpt-4-turbo',
      modelIdShort: 'gpt-4-turbo',
    },
    pricing: {
      inputMTok: 10.0,
      outputMTok: 30.0,
    },
    shortDescription:
      'Large multimodal model with vision capabilities and improved performance',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 128000,
        output: 4096,
      },
      knowledgeCutoff: new Date('2023-12-01'),
      input: {
        image: true,
        text: true,
        pdf: true,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'openai',
      modelId: 'openai/gpt-3.5-turbo',
      modelIdShort: 'gpt-3.5-turbo',
    },
    pricing: {
      inputMTok: 0.5,
      outputMTok: 1.5,
    },
    shortDescription:
      'Most capable and cost-effective model in the GPT-3.5 family',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 16385,
        output: 4096,
      },
      knowledgeCutoff: new Date('2021-09-01'),
      input: {
        image: false,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'openai/gpt-3.5-turbo-instruct',
    name: 'GPT-3.5 Turbo Instruct',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'openai',
      modelId: 'openai/gpt-3.5-turbo-instruct',
      modelIdShort: 'gpt-3.5-turbo-instruct',
    },
    pricing: {
      inputMTok: 1.5,
      outputMTok: 2.0,
    },
    shortDescription: 'Legacy GPT model for cheaper chat and non-chat tasks',
    features: {
      reasoning: false,
      functionCalling: false,
      contextWindow: {
        input: 4096,
        output: 4096,
      },
      knowledgeCutoff: new Date('2021-09-01'),
      input: {
        image: false,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'openai/gpt-image-1',
    name: 'GPT-Image-1',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'openai',
      modelId: 'openai/gpt-image-1',
      modelIdShort: 'gpt-image-1',
    },
    pricing: {
      inputMTok: 5.0, // Text input: $5.00 / 1M tokens, Image input: $10.00 / 1M tokens
      outputMTok: 40.0, // Output image tokens: $40.00 / 1M tokens
    },
    shortDescription:
      'Advanced image generation model with superior accuracy and diverse visual styles',
    features: {
      reasoning: false,
      functionCalling: false,
      contextWindow: {
        input: 128000, // Estimated based on typical OpenAI models
        output: 4096, // Image output tokens vary by quality/resolution
      },
      knowledgeCutoff: new Date('2025-04-01'),
      input: {
        image: true,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: true,
        text: false,
        audio: false,
      },
    },
  },
  {
    id: 'perplexity/sonar',
    name: 'Sonar',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'perplexity',
      modelId: 'perplexity/sonar',
      modelIdShort: 'sonar',
    },
  },
  {
    id: 'perplexity/sonar-pro',
    name: 'Sonar Pro',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'perplexity',
      modelId: 'perplexity/sonar-pro',
      modelIdShort: 'sonar-pro',
    },
  },
  {
    id: 'perplexity/sonar-reasoning',
    name: 'Sonar Reasoning',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'perplexity',
      modelId: 'perplexity/sonar-reasoning',
      modelIdShort: 'sonar-reasoning',
    },
  },
  {
    id: 'perplexity/sonar-reasoning-pro',
    name: 'Sonar Reasoning Pro',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'perplexity',
      modelId: 'perplexity/sonar-reasoning-pro',
      modelIdShort: 'sonar-reasoning-pro',
    },
  },
  {
    id: 'vertex/claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet (Vertex)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'vertexAnthropic',
      modelId: 'vertex/claude-3-7-sonnet-20250219',
      modelIdShort: 'claude-3-7-sonnet-20250219',
    },
  },
  {
    id: 'vertex/claude-3-5-sonnet-v2-20241022',
    name: 'Claude 3.5 Sonnet v2 (Vertex)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'vertexAnthropic',
      modelId: 'vertex/claude-3-5-sonnet-v2-20241022',
      modelIdShort: 'claude-3-5-sonnet-v2-20241022',
    },
  },
  {
    id: 'vertex/claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku (Vertex)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'vertexAnthropic',
      modelId: 'vertex/claude-3-5-haiku-20241022',
      modelIdShort: 'claude-3-5-haiku-20241022',
    },
  },
  {
    id: 'vertex/claude-3-opus-20240229',
    name: 'Claude 3 Opus (Vertex)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'vertexAnthropic',
      modelId: 'vertex/claude-3-opus-20240229',
      modelIdShort: 'claude-3-opus-20240229',
    },
  },
  {
    id: 'vertex/claude-4-opus-20250514',
    name: 'Claude 4 Opus (Vertex)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'vertexAnthropic',
      modelId: 'vertex/claude-4-opus-20250514',
      modelIdShort: 'claude-4-opus-20250514',
    },
  },
  {
    id: 'vertex/claude-4-sonnet-20250514',
    name: 'Claude 4 Sonnet (Vertex)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'vertexAnthropic',
      modelId: 'vertex/claude-4-sonnet-20250514',
      modelIdShort: 'claude-4-sonnet-20250514',
    },
  },
  {
    id: 'vertex/claude-3-haiku-20240307',
    name: 'Claude 3 Haiku (Vertex)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'vertexAnthropic',
      modelId: 'vertex/claude-3-haiku-20240307',
      modelIdShort: 'claude-3-haiku-20240307',
    },
  },
  {
    id: 'vertex/claude-3-5-sonnet-20240620',
    name: 'Claude 3.5 Sonnet (Vertex)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'vertexAnthropic',
      modelId: 'vertex/claude-3-5-sonnet-20240620',
      modelIdShort: 'claude-3-5-sonnet-20240620',
    },
  },
  {
    id: 'vertex/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash (Vertex)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'vertex',
      modelId: 'vertex/gemini-2.0-flash-001',
      modelIdShort: 'gemini-2.0-flash-001',
    },
  },
  {
    id: 'vertex/gemini-2.0-flash-lite-001',
    name: 'Gemini 2.0 Flash Lite (Vertex)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'vertex',
      modelId: 'vertex/gemini-2.0-flash-lite-001',
      modelIdShort: 'gemini-2.0-flash-lite-001',
    },
  },
  {
    id: 'vertex/llama-4-scout-17b-16e-instruct-maas',
    name: 'Llama 4 Scout 17B 16E Instruct (Vertex)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'vertex',
      modelId: 'vertex/llama-4-scout-17b-16e-instruct-maas',
      modelIdShort: 'llama-4-scout-17b-16e-instruct-maas',
    },
  },
  {
    id: 'vertex/llama-4-maverick-17b-128e-instruct-maas',
    name: 'Llama 4 Maverick 17B 128E Instruct (Vertex)',
    enabled: false,
    specification: {
      specificationVersion: 'v2',
      provider: 'vertex',
      modelId: 'vertex/llama-4-maverick-17b-128e-instruct-maas',
      modelIdShort: 'llama-4-maverick-17b-128e-instruct-maas',
    },
  },
  {
    id: 'xai/grok-beta',
    name: 'Grok Beta',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'xai',
      modelId: 'xai/grok-beta',
      modelIdShort: 'grok-beta',
    },
    pricing: {
      inputMTok: 5,
      outputMTok: 15,
    },
    shortDescription: 'Legacy Grok model with strong reasoning capabilities',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 131072,
        output: 4096,
      },
      input: {
        image: false,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'xai/grok-vision-beta',
    name: 'Grok Vision Beta',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'xai',
      modelId: 'xai/grok-vision-beta',
      modelIdShort: 'grok-vision-beta',
    },
    pricing: {
      inputMTok: 5,
      outputMTok: 15,
    },
    shortDescription: 'Legacy multimodal Grok model with vision capabilities',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 8192,
        output: 4096,
      },
      input: {
        image: true,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'xai/grok-2-1212',
    name: 'Grok 2',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'xai',
      modelId: 'xai/grok-2-1212',
      modelIdShort: 'grok-2-1212',
    },
    pricing: {
      inputMTok: 2,
      outputMTok: 10,
    },
    shortDescription:
      'Frontier language model with state-of-the-art reasoning capabilities',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 131072,
        output: 4096,
      },
      input: {
        image: false,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'xai/grok-2-vision-1212',
    name: 'Grok 2 Vision',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'xai',
      modelId: 'xai/grok-2-vision-1212',
      modelIdShort: 'grok-2-vision-1212',
    },
    pricing: {
      inputMTok: 2,
      outputMTok: 10,
    },
    shortDescription:
      'Advanced multimodal model with text and vision understanding',
    features: {
      reasoning: false,
      functionCalling: true,
      contextWindow: {
        input: 32768,
        output: 4096,
      },
      input: {
        image: true,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'xai/grok-3-beta',
    name: 'Grok 3 Beta',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'xai',
      modelId: 'xai/grok-3-beta',
      modelIdShort: 'grok-3-beta',
    },
    pricing: {
      inputMTok: 3,
      outputMTok: 15,
    },
    shortDescription:
      'Most advanced Grok model with extended reasoning and 1M context',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 1000000,
        output: 128000,
      },
      input: {
        image: false,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'xai/grok-3-fast-beta',
    name: 'Grok 3 Fast Beta',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'xai',
      modelId: 'xai/grok-3-fast-beta',
      modelIdShort: 'grok-3-fast-beta',
    },
    pricing: {
      inputMTok: 5,
      outputMTok: 25,
    },
    shortDescription:
      'Optimized for speed while maintaining advanced reasoning capabilities',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 131072,
        output: 4096,
      },
      input: {
        image: false,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'xai/grok-3-mini-beta',
    name: 'Grok 3 Mini Beta',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'xai',
      modelId: 'xai/grok-3-mini-beta',
      modelIdShort: 'grok-3-mini-beta',
    },
    pricing: {
      inputMTok: 0.3,
      outputMTok: 0.5,
    },
    shortDescription:
      'Cost-efficient reasoning model optimized for everyday tasks',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 131072,
        output: 4096,
      },
      input: {
        image: false,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
  {
    id: 'xai/grok-3-mini-fast-beta',
    name: 'Grok 3 Mini Fast Beta',
    enabled: true,
    specification: {
      specificationVersion: 'v2',
      provider: 'xai',
      modelId: 'xai/grok-3-mini-fast-beta',
      modelIdShort: 'grok-3-mini-fast-beta',
    },
    pricing: {
      inputMTok: 0.6,
      outputMTok: 4,
    },
    shortDescription:
      'Fastest Grok 3 mini variant for rapid response applications',
    features: {
      reasoning: true,
      functionCalling: true,
      contextWindow: {
        input: 131072,
        output: 4096,
      },
      input: {
        image: false,
        text: true,
        pdf: false,
        audio: false,
      },
      output: {
        image: false,
        text: true,
        audio: false,
      },
    },
  },
] satisfies ModelDefinitionInternal[];

// Extract types from the allModels array
export type ModelSpecifications = (typeof allModels)[number]['specification'];

export type AvailableProviderModels = (typeof allModels)[number]['id'];
export type AvailableProviders =
  (typeof allModels)[number]['specification']['provider'];
export type AvailableModelsShortNames =
  (typeof allModels)[number]['specification']['modelIdShort'];

export type ModelDefinition = ModelDefinitionInternal & {
  enabled: boolean;
  specification: ModelSpecifications;
  providerModelId: AvailableProviderModels;
};

// Preferred provider order
const PROVIDER_ORDER = ['openai', 'google', 'anthropic', 'xai'] as const;

export const allImplementedModels = allModels
  .filter((model) => model.enabled)
  .sort((a, b) => {
    const aProviderIndex = PROVIDER_ORDER.indexOf(
      a.specification.provider as any,
    );
    const bProviderIndex = PROVIDER_ORDER.indexOf(
      b.specification.provider as any,
    );

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
const _modelsByIdCache = new Map<string, ModelDefinitionInternal>();

function getModelsByIdDict(): Map<string, ModelDefinitionInternal> {
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
  return { ...model, providerModelId: modelId };
}

export const DEFAULT_CHAT_MODEL: string = 'openai/gpt-4o-mini';
export const DEFAULT_PDF_MODEL: string = 'openai/gpt-4o-mini';
export const DEFAULT_IMAGE_MODEL: string = 'openai/gpt-image-1';
export const DEFAULT_TITLE_MODEL: string = 'openai/gpt-4o-mini';
export const DEFAULT_ARTIFACT_MODEL: string = 'openai/gpt-4.1-nano';
export const DEFAULT_ARTIFACT_SUGGESTION_MODEL: string = 'openai/gpt-4o-mini';
