import { allModels } from '../ai/all-models';
import type { AvailableModels } from '../ai/providers';
import {
  type YourToolName,
  toolsDefinitions,
  allTools,
} from '../ai/tools/tools';
import { reserveAvailableCredits } from '../repositories/credits';

export function filterAffordableTools(
  allTools: YourToolName[],
  toolBudget: number,
  baseModelCost: number,
): YourToolName[] {
  // If the user can't even afford the base model, they can't use any tools.
  if (toolBudget < baseModelCost) {
    return [];
  }

  const affordableTools = allTools.filter((toolName) => {
    const minCost = toolsDefinitions[toolName].cost;
    // Check if the user has enough credits for the model cost + this tool's minimum cost
    return toolBudget >= baseModelCost + minCost;
  });

  return affordableTools;
}

export function getMaxToolCost(tools: YourToolName[]): number {
  return tools.reduce((max, toolName) => {
    return Math.max(max, toolsDefinitions[toolName].cost);
  }, 0);
}

export async function reserveCredits({
  userId,
  baseModelCost,
  maxSteps = 5,
}: {
  userId: string;
  baseModelCost: number;
  maxSteps?: number;
}): Promise<
  | {
      success: true;
      budget: number;
    }
  | {
      success: false;
      error: string;
    }
> {
  const maxToolCost = getMaxToolCost(allTools);
  const totalBudget = baseModelCost + maxToolCost * maxSteps;

  const reservation = await reserveAvailableCredits({
    userId,
    maxAmount: totalBudget,
    minAmount: baseModelCost,
  });

  if (!reservation.success) {
    return {
      success: false,
      error: reservation.error,
    };
  }

  if (reservation.reservedAmount < baseModelCost) {
    return {
      success: false,
      error: 'Insufficient credits for the selected model',
    };
  }
  return {
    success: true,
    budget: reservation.reservedAmount,
  };
}

export function determineStepTools({
  toolBudget,
  explicitlyRequestedTool,
}: {
  toolBudget: number;
  explicitlyRequestedTool: YourToolName | null;
}): {
  success: boolean;
  activeTools: YourToolName[];
  error?: string;
} {
  const affordableTools = allTools.filter((toolName) => {
    const toolCost = toolsDefinitions[toolName].cost;
    return toolBudget >= toolCost;
  });

  if (
    explicitlyRequestedTool &&
    !affordableTools.includes(explicitlyRequestedTool)
  ) {
    return {
      success: false,
      activeTools: [],
      error: `Insufficient budget for requested tool: ${explicitlyRequestedTool}. Need ${toolsDefinitions[explicitlyRequestedTool].cost} credits but only ${toolBudget} available after model cost.`,
    };
  }

  return {
    success: true,
    activeTools: explicitlyRequestedTool
      ? [explicitlyRequestedTool]
      : affordableTools,
  };
}

export function getBaseModelCost(modelId: AvailableModels) {
  const model = allModels.find((model) => model.id === modelId);

  if (!model?.pricing) {
    return 10; // fallback for models without pricing
  }

  const { inputMTok, outputMTok } = model.pricing;

  // Formula: Weighted average assuming typical 1:3 input:output ratio
  // This gives more weight to output since models typically generate more output
  const weightedCost = inputMTok * 0.25 + outputMTok * 0.75;

  // Scale to reasonable credit units (adjust multiplier as needed)
  return Math.ceil(weightedCost);
}
