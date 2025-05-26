import type { AvailableModels } from '@/lib/ai/providers';
import { allTools, type YourToolName } from '@/lib/ai/tools/tools';
import { filterAffordableTools } from '@/lib/credits/credits-utils';
import { modelCosts } from '@/lib/ai/modelCosts';
import { getModelDefinition } from '../all-models';

type DetermineActiveToolsParams = {
  userCredits: number;
  selectedChatModel: AvailableModels;
  explicitlyRequestedTool: YourToolName | null;
};

/**
 * Determines the active tools based on user credits, selected model, and specific tool requests.
 */
export function determineActiveTools({
  userCredits,
  selectedChatModel,
  explicitlyRequestedTool,
}: DetermineActiveToolsParams): YourToolName[] {
  const baseModelCost = modelCosts[selectedChatModel] ?? 1;

  // Determine ALL tools the user can possibly afford for this model
  const affordableTools = filterAffordableTools(
    allTools,
    userCredits,
    baseModelCost,
  );

  // Validate if the explicitly requested tool is affordable
  if (
    explicitlyRequestedTool &&
    !affordableTools.includes(explicitlyRequestedTool)
  ) {
    // Throwing an error here might be better to handle upstream
    throw new Error(
      `Insufficient credits to use the requested tool: ${explicitlyRequestedTool}`,
    );
  }

  // Build the final list of active tools for this specific request
  let activeTools: YourToolName[];
  const model = getModelDefinition(selectedChatModel);
  if (!model.features?.functionCalling) {
    // TODO: Here verify if the model can use tools
    if (explicitlyRequestedTool) {
      throw new Error(
        `The selected model [${model.id}] does not support tools: ${explicitlyRequestedTool}`,
      );
    }
    activeTools = [];
  } else if (explicitlyRequestedTool) {
    // If an explicit tool is requested and affordable, only use that
    activeTools = [explicitlyRequestedTool];
  } else {
    // Otherwise, filter the default set of tools by affordability
    const defaultTools: YourToolName[] = allTools;
    activeTools = defaultTools.filter((tool) => affordableTools.includes(tool));
  }

  return activeTools;
}
