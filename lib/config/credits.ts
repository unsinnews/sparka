import type { AvailableModels } from '../ai/providers';
import { type YourToolName, toolsDefinitions } from '../ai/tools/tools';

export const modelCosts: Record<AvailableModels, number> = {
  'gpt-4o': 1,
  'dall-e-3': 60,
  'gpt-o1-preview': 50,
};

/**
 * Filters a list of tool names to include only those affordable given the user's credits
 * and the base cost of the selected model. Used for pre-generation filtering.
 * @param allTools - Array of all possible tool names for the model.
 * @param userCredits - The user's current credit balance.
 * @param baseModelCost - The cost of the selected AI model for this request.
 * @returns An array of tool names the user can potentially afford.
 */
export function filterAffordableTools(
  allTools: YourToolName[],
  userCredits: number,
  baseModelCost: number,
): YourToolName[] {
  // If the user can't even afford the base model, they can't use any tools.
  if (userCredits < baseModelCost) {
    return [];
  }

  const affordableTools = allTools.filter((toolName) => {
    const minCost = toolsDefinitions[toolName].cost;
    // Check if the user has enough credits for the model cost + this tool's minimum cost
    return userCredits >= baseModelCost + minCost;
  });

  return affordableTools;
}
