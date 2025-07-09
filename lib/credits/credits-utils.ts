import {
  getModelDefinition,
  type AvailableProviderModels,
} from '../ai/all-models';
import { toolsDefinitions, allTools } from '../ai/tools/tools';
import type { ToolNames } from '../ai/types';
import { reserveAvailableCredits } from '../repositories/credits';

export function filterAffordableTools(
  tools: ToolNames[],
  toolBudget: number,
): ToolNames[] {
  const affordableTools = tools.filter((toolName) => {
    const toolCost = toolsDefinitions[toolName].cost;
    return toolBudget >= toolCost;
  });

  return affordableTools;
}

export function getMaxToolCost(tools: ToolNames[]): number {
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

export function getBaseModelCost(modelId: AvailableProviderModels) {
  const model = getModelDefinition(modelId);

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
