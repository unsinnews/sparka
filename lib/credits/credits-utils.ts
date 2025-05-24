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
}): Promise<{
  success: boolean;
  budget: number;
  error?: string;
}> {
  const maxToolCost = getMaxToolCost(allTools);
  const totalBudget = baseModelCost + maxToolCost * maxSteps;

  const reservation = await reserveAvailableCredits({
    userId,
    maxAmount: totalBudget,
  });

  if (!reservation.success || reservation.reservedAmount === 0) {
    return {
      success: false,
      budget: 0,
      error: 'Insufficient credits for any request',
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
