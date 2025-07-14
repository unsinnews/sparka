import {
  getModelDefinition,
  type AvailableProviderModels,
  type ModelDefinition,
} from '../ai/all-models';
import { toolsDefinitions } from '../ai/tools/tools-definitions';
import type { ToolNames } from '../ai/types';

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

export function getBaseModelCostByModelId(modelId: AvailableProviderModels) {
  const model = getModelDefinition(modelId);
  return getBaseModelCost(model);
}
export function getBaseModelCost(model: ModelDefinition) {
  if (!model.pricing) {
    return 10; // fallback for models without pricing
  }

  const { inputMTok, outputMTok } = model.pricing;

  // Formula: Weighted average assuming typical 1:3 input:output ratio
  // This gives more weight to output since models typically generate more output
  const weightedCost = inputMTok * 0.25 + outputMTok * 0.75;

  // Scale to reasonable credit units (adjust multiplier as needed)
  return Math.ceil(weightedCost);
}
