import { generateObject, generateText, type ModelMessage } from 'ai';
import { getLanguageModel } from '@/lib/ai/providers';
import type { ModelId } from '@/lib/ai/model-id';
import type { DeepResearchConfig } from './configuration';
import {
  type AgentState,
  type AgentInputState,
  type SupervisorState,
  type ResearcherState,
  type ResearcherOutputState,
  ClarifyWithUserSchema,
  ResearchQuestionSchema,
  leadResearcherTools,
  type ResponseMessage,
  type ClarifyWithUserInput,
  type WriteResearchBriefInput,
  type WriteResearchBriefOutput,
  type SupervisorInput,
  type SupervisorOutput,
  type SupervisorToolsInput,
  type SupervisorToolsOutput,
  type ResearcherInput,
  type CompressResearchInput,
  type EndState,
} from './state';
import {
  clarifyWithUserInstructions,
  transformMessagesIntoResearchTopicPrompt,
  researchSystemPrompt,
  compressResearchSystemPrompt,
  compressResearchSimpleHumanMessage,
  finalReportGenerationPrompt,
  leadResearcherPrompt,
} from './prompts';
import {
  getTodayStr,
  isTokenLimitExceeded,
  getModelTokenLimit,
  getAllTools,
  removeUpToLastAiMessage,
  getNotesFromToolCalls,
} from './utils';
import type { StreamWriter } from '../../types';
import { generateUUID, getTextContentFromModelMessage } from '@/lib/utils';

// Command type equivalent (simplified for TS)
type Command =
  | { goto: 'write_research_brief'; data?: undefined }
  | { goto: '__end__'; data: EndState }
  | { goto: 'research_supervisor'; data: WriteResearchBriefOutput }
  | { goto: 'supervisor_tools'; data: SupervisorOutput }
  | { goto: 'supervisor'; data: SupervisorToolsOutput }
  | { goto: 'compress_research'; data: CompressResearchInput };

// Researcher-specific command type
type ResearcherCommand = {
  goto: 'compress_research';
  data: CompressResearchInput;
};

function createCommand<
  T extends Command['goto'],
  U extends Extract<Command, { goto: T }>['data'],
>(goto: T, data: U): Extract<Command, { goto: T }> {
  return { goto, data } as Extract<Command, { goto: T }>;
}

// Helper function to get message buffer string
function getBufferString(messages: ModelMessage[]): string {
  return messages.map((m) => `${m.role}: ${m.content}`).join('\n');
}

// Helper function to filter messages by type
function filterMessages(
  messages: ModelMessage[],
  includeTypes: string[],
): ModelMessage[] {
  return messages.filter((m) => includeTypes.includes(m.role));
}

async function clarifyWithUser(
  state: ClarifyWithUserInput,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
): Promise<Extract<Command, { goto: 'write_research_brief' | '__end__' }>> {
  if (!config.allow_clarification) {
    return createCommand('write_research_brief', undefined);
  }

  const messages = state.messages;
  const model = getLanguageModel(config.research_model as ModelId);

  try {
    const response = await generateObject({
      model,
      schema: ClarifyWithUserSchema,
      messages: [
        {
          role: 'user',
          content: clarifyWithUserInstructions({
            messages: getBufferString(messages),
            date: getTodayStr(),
          }),
        },
      ],
      maxOutputTokens: config.research_model_max_tokens,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'clarifyWithUser',
        metadata: {
          requestId: state.id || '',
        },
      },
    });

    if (response.object.need_clarification) {
      return createCommand('__end__', {
        end_type: 'clarification_needed',
        messages: [
          ...state.messages,
          { role: 'assistant' as const, content: response.object.question },
        ],
      });
    } else {
      return createCommand('write_research_brief', undefined);
    }
  } catch (error) {
    console.error('Error in clarifyWithUser:', error);
    return createCommand('write_research_brief', undefined);
  }
}

async function writeResearchBrief(
  state: WriteResearchBriefInput,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
): Promise<Extract<Command, { goto: 'research_supervisor' }>> {
  const model = getLanguageModel(config.research_model as ModelId);

  try {
    const dataPartId = generateUUID();
    dataStream.write({
      id: dataPartId,
      type: 'data-researchUpdate',
      data: {
        title: 'Writing research brief',
        message: 'Writing research brief...',
        type: 'thoughts',
        status: 'running',
      },
    });
    const result = await generateObject({
      model,
      schema: ResearchQuestionSchema,
      messages: [
        {
          role: 'user',
          content: transformMessagesIntoResearchTopicPrompt({
            messages: getBufferString(state.messages || []),
            date: getTodayStr(),
          }),
        },
      ],
      maxOutputTokens: config.research_model_max_tokens,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'writeResearchBrief',
        metadata: {
          requestId: state.id || '',
        },
      },
    });

    dataStream.write({
      id: dataPartId,
      type: 'data-researchUpdate',
      data: {
        title: 'Writing research brief',
        message: result.object.research_brief,
        type: 'thoughts',
        status: 'completed',
      },
    });

    return createCommand('research_supervisor', {
      research_brief: result.object.research_brief,
      supervisor_messages: [
        {
          role: 'system' as const,
          content: leadResearcherPrompt({
            date: getTodayStr(),
            max_concurrent_research_units: config.max_concurrent_research_units,
          }),
        },
        {
          role: 'user' as const,
          content: result.object.research_brief,
        },
      ],
    });
  } catch (error) {
    console.error('Error in writeResearchBrief:', error);
    throw error;
  }
}

// TODO: Change some of the deferred tool calls for structured outputs
// TODO: Consider which are the cases to fail when the model has a stop reason != tool-calls

async function supervisor(
  state: SupervisorInput,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
): Promise<Extract<Command, { goto: 'supervisor_tools' }>> {
  console.log('=== SUPERVISOR START ===', {
    research_iterations: state.research_iterations,
    max_iterations: config.max_researcher_iterations,
    messages_count: state.supervisor_messages?.length || 0,
  });

  const model = getLanguageModel(config.research_model as ModelId);

  try {
    const supervisorUpdateId = generateUUID();
    dataStream.write({
      id: supervisorUpdateId,
      type: 'data-researchUpdate',
      data: {
        title: 'Supervisor: Evaluating research needs',
        message:
          'Coordinating investigation efforts and ensuring comprehensive topic coverage',
        type: 'thoughts',
        status: 'running',
      },
    });
    const result = await generateText({
      model,
      messages: state.supervisor_messages,
      tools: leadResearcherTools,
      maxOutputTokens: config.research_model_max_tokens,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'supervisor',
        metadata: {
          requestId: state.id || '',
        },
      },
      // TODO: Do we need a stop when?
      //   stopWhen: ,
    });

    const lastAssistantMessage = result.response.messages.find(
      (m) => m.role === 'assistant',
    );

    const supervisorMessageText =
      lastAssistantMessage &&
      getTextContentFromModelMessage(lastAssistantMessage);
    dataStream.write({
      id: supervisorUpdateId,
      type: 'data-researchUpdate',
      data: {
        title: 'Supervisor: Evaluating research needs',
        message:
          supervisorMessageText ||
          'Coordinating investigation efforts and ensuring comprehensive topic coverage',
        type: 'thoughts',
        status: 'completed',
      },
    });

    const responseMessages = result.response.messages;
    if (result.finishReason !== 'tool-calls') {
      console.dir(result, { depth: null });
      throw new Error(`Expected tool calls, but got: ${result.finishReason}`);
    }
    return createCommand('supervisor_tools', {
      supervisor_messages: [
        ...(state.supervisor_messages || []),
        ...responseMessages,
      ],
      tool_calls: result.toolCalls || [],
      research_iterations: (state.research_iterations || 0) + 1,
    });
  } catch (error) {
    console.error('Error in supervisor:', error);
    throw error;
  }
}

async function supervisorToolsExecutions(
  state: SupervisorToolsInput,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
): Promise<Extract<Command, { goto: 'supervisor' | '__end__' }>> {
  console.log('=== SUPERVISOR TOOLS START ===', {
    research_iterations: state.research_iterations,
    max_iterations: config.max_researcher_iterations,
    tool_calls_count: state.tool_calls?.length || 0,
    tool_names: state.tool_calls?.map((tc) => tc.toolName) || [],
  });
  const supervisorUpdateId = generateUUID();

  const supervisorMessages = state.supervisor_messages || [];
  const researchIterations = state.research_iterations || 0;

  // Exit Criteria
  const exceededAllowedIterations =
    researchIterations > config.max_researcher_iterations;

  const toolCalls = state.tool_calls;
  const noToolCalls = !toolCalls || toolCalls.length === 0;
  const researchCompleteToolCall = toolCalls?.some(
    (toolCall) => toolCall.toolName === 'researchComplete',
  );

  if (exceededAllowedIterations || noToolCalls || researchCompleteToolCall) {
    return createCommand('__end__', {
      end_type: 'research_complete',
      notes: getNotesFromToolCalls(supervisorMessages),
      research_brief: state.research_brief || '',
    });
  }

  // Otherwise, conduct research and gather results
  try {
    const allConductResearchCalls =
      toolCalls?.filter(
        (toolCall) => toolCall.toolName === 'conductResearch',
      ) || [];

    const conductResearchCalls = allConductResearchCalls.slice(
      0,
      config.max_concurrent_research_units,
    );
    const overflowConductResearchCalls = allConductResearchCalls.slice(
      config.max_concurrent_research_units,
    );

    const researcherSystemPromptText = researchSystemPrompt({
      mcp_prompt: config.mcp_prompt || '',
      date: getTodayStr(),
      max_search_queries: config.search_api_max_queries,
    });

    dataStream.write({
      id: supervisorUpdateId,
      type: 'data-researchUpdate',
      data: {
        title: 'Supervisor: Assigning research tasks',
        message:
          conductResearchCalls.length === 1
            ? 'Assigning 1 research task to a researcher.'
            : `Assigning ${conductResearchCalls.length} research tasks to researchers.`,
        type: 'thoughts',
        status: 'completed',
      },
    });
    const toolResults = [];

    // Non parallel execution to avoid streaming race condition and rate limits
    for (const toolCall of conductResearchCalls) {
      const result = await researcherSubgraph(
        {
          id: state.id,
          researcher_messages: [
            { role: 'system' as const, content: researcherSystemPromptText },
            { role: 'user' as const, content: toolCall.input.research_topic },
          ],
          tool_calls: [],
          research_topic: toolCall.input.research_topic,
          tool_call_iterations: 0,
          compressed_research: '',
          raw_notes: [],
        },
        config,
        dataStream,
      );
      toolResults.push(result);
    }

    const toolResultsMessages: ResponseMessage[] = toolResults.map(
      (observation, index) => ({
        role: 'tool' as const,
        content: [
          {
            toolName: 'conductResearch',
            toolCallId: conductResearchCalls[index].toolCallId,
            type: 'tool-result',
            output: {
              type: 'text',
              value:
                observation.compressed_research ||
                'Error synthesizing research report: Maximum retries exceeded',
            },
          },
        ],
      }),
    );

    // Handle overflow tool calls
    for (const overflowCall of overflowConductResearchCalls) {
      toolResultsMessages.push({
        role: 'tool' as const,
        content: [
          {
            toolName: 'conductResearch',
            toolCallId: overflowCall.toolCallId,
            type: 'tool-result',
            output: {
              type: 'text',
              value: `Error: Did not run this research as you have already exceeded the maximum number of concurrent research units. Please try again with ${config.max_concurrent_research_units} or fewer research units.`,
            }, // update depending on the tool's output format
          },
        ],
      });
    }

    const rawNotesConcat = toolResults
      .map((observation) => observation.raw_notes.join('\n'))
      .join('\n');

    return createCommand('supervisor', {
      supervisor_messages: [...supervisorMessages, ...toolResultsMessages],
      raw_notes: [rawNotesConcat],
    });
  } catch (error) {
    if (isTokenLimitExceeded(error as Error, config.research_model)) {
      console.log(`Token limit exceeded while reflecting: ${error}`);
    } else {
      console.log(`Other error in reflection phase: ${error}`);
    }

    return createCommand('__end__', {
      end_type: 'research_complete',
      notes: getNotesFromToolCalls(supervisorMessages),
      research_brief: state.research_brief || '',
    });
  }
}

async function researcher(
  state: ResearcherInput,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
): Promise<Extract<Command, { goto: 'compress_research' }>> {
  console.log('=== RESEARCHER START ===', {
    research_topic: state.research_topic,
    messages_count: state.researcher_messages?.length || 0,
  });

  const researcherMessages = state.researcher_messages || [];
  const tools = await getAllTools(config, dataStream, state.id);

  if (Object.keys(tools).length === 0) {
    throw new Error(
      'No tools found to conduct research: Please configure either your search API or add MCP tools to your configuration.',
    );
  }

  const model = getLanguageModel(config.research_model as ModelId);

  try {
    dataStream.write({
      type: 'data-researchUpdate',
      data: {
        title: `Researcher: starting research on topic`,
        message: state.research_topic,
        type: 'thoughts',
        status: 'completed',
      },
    });

    const result = await generateText({
      model,
      messages: researcherMessages,
      tools,
      maxOutputTokens: config.research_model_max_tokens,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'researcher',
        metadata: {
          requestId: state.id || '',
        },
      },
    });

    dataStream.write({
      type: 'data-researchUpdate',
      data: {
        title: 'Researcher: research completed',
        type: 'thoughts',
        message: 'Research phase completed',
        status: 'completed',
      },
    });

    return createCommand('compress_research', {
      id: state.id,
      researcher_messages: [...researcherMessages, ...result.response.messages],
    });
  } catch (error) {
    console.error('Error in researcher:', error);
    throw error;
  }
}

async function compressResearch(
  state: CompressResearchInput,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
): Promise<ResearcherOutputState> {
  let synthesisAttempts = 0;
  const model = getLanguageModel(config.compression_model as ModelId);

  let researcherMessages = [...(state.researcher_messages || [])];

  // Update the system prompt to focus on compression
  researcherMessages[0] = {
    role: 'system' as const,
    content: compressResearchSystemPrompt({ date: getTodayStr() }),
  };
  researcherMessages.push({
    role: 'user' as const,
    content: compressResearchSimpleHumanMessage,
  });

  // TODO: Do we need to do this retry?
  while (synthesisAttempts < 3) {
    try {
      const compressUpdateId = generateUUID();
      dataStream.write({
        id: compressUpdateId,
        type: 'data-researchUpdate',
        data: {
          title: 'Researcher: Summarizing research',
          type: 'thoughts',
          message: 'Summarizing research...',
          status: 'running',
        },
      });
      const response = await generateText({
        model,
        messages: researcherMessages,
        maxOutputTokens: config.compression_model_max_tokens,
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'compressResearch',
          metadata: {
            requestId: state.id || '',
          },
        },
      });

      dataStream.write({
        id: compressUpdateId,
        type: 'data-researchUpdate',
        data: {
          title: 'Researcher: Summarizing research',
          type: 'thoughts',
          message: 'Research summarized',
          status: 'completed',
        },
      });

      return {
        compressed_research: response.text,
        raw_notes: [
          filterMessages(researcherMessages, ['tool', 'assistant'])
            .map((m) => String(m.content))
            .join('\n'),
        ],
      };
    } catch (error) {
      synthesisAttempts++;
      if (isTokenLimitExceeded(error as Error, config.research_model)) {
        researcherMessages = removeUpToLastAiMessage(researcherMessages);
        console.log(
          `Token limit exceeded while synthesizing: ${error}. Pruning the messages to try again.`,
        );
        continue;
      }
      console.log(`Error synthesizing research report: ${error}`);
    }
  }

  return {
    compressed_research:
      'Error synthesizing research report: Maximum retries exceeded',
    raw_notes: [
      filterMessages(researcherMessages, ['tool', 'assistant'])
        .map((m) => String(m.content))
        .join('\n'),
    ],
  };
}

// Researcher subgraph function
async function researcherSubgraph(
  initialState: ResearcherState,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
): Promise<ResearcherOutputState> {
  const result = await researcher(
    {
      id: initialState.id,
      researcher_messages: initialState.researcher_messages,
      research_topic: initialState.research_topic,
      tool_call_iterations: initialState.tool_call_iterations,
    },
    config,
    dataStream,
  );

  return await compressResearch(
    {
      id: initialState.id,
      researcher_messages: result.data.researcher_messages,
    },
    config,
    dataStream,
  );
}

async function finalReportGeneration(
  state: AgentState,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
): Promise<Partial<AgentState>> {
  const notes = state.notes || [];
  const clearedState = { notes: [] };

  const model = getLanguageModel(config.final_report_model as ModelId);
  let findings = notes.join('\n');
  const maxRetries = 3;
  let currentRetry = 0;

  while (currentRetry <= maxRetries) {
    const finalReportPromptText = finalReportGenerationPrompt({
      research_brief: state.research_brief || '',
      findings,
      date: getTodayStr(),
    });

    try {
      const finalReportUpdateId = generateUUID();
      dataStream.write({
        id: finalReportUpdateId,
        type: 'data-researchUpdate',
        data: {
          title: 'Generating final report',
          type: 'thoughts',
          message: 'Generating final report...',
          status: 'running',
        },
      });
      const finalReport = await generateText({
        model,
        messages: [{ role: 'user' as const, content: finalReportPromptText }],
        maxOutputTokens: config.final_report_model_max_tokens,
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'finalReportGeneration',
          metadata: {
            requestId: state.id || '',
          },
        },
      });

      dataStream.write({
        id: finalReportUpdateId,
        type: 'data-researchUpdate',
        data: {
          title: 'Generating final report',
          type: 'thoughts',
          message: 'Final report generated successfully',
          status: 'completed',
        },
      });

      return {
        final_report: finalReport.text,
        messages: [
          ...(state.messages || []),
          { role: 'assistant' as const, content: finalReport.text },
        ],
        ...clearedState,
      };
    } catch (error) {
      if (isTokenLimitExceeded(error as Error, config.final_report_model)) {
        let findingsTokenLimit = 0;

        if (currentRetry === 0) {
          const modelTokenLimit = getModelTokenLimit(
            config.final_report_model as ModelId,
          );
          if (!modelTokenLimit) {
            return {
              final_report: `Error generating final report: Token limit exceeded, however, we could not determine the model's maximum context length. Please update the model map in deep_researcher/utils.ts with this information. ${error}`,
              ...clearedState,
            };
          }
          findingsTokenLimit = modelTokenLimit * 4;
        } else {
          findingsTokenLimit = Math.floor(findingsTokenLimit * 0.9);
        }
        console.log('Reducing the chars to', findingsTokenLimit);
        findings = findings.slice(0, findingsTokenLimit);
        currentRetry++;
      } else {
        return {
          final_report: `Error generating final report: ${error}`,
          ...clearedState,
        };
      }
    }
  }

  return {
    final_report: 'Error generating final report: Maximum retries exceeded',
    ...clearedState,
  };
}

// Main deep researcher workflow
export async function runDeepResearcher(
  input: AgentInputState,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
): Promise<AgentState> {
  let currentState: AgentState = {
    id: input.id,
    messages: input.messages,
    supervisor_messages: [],
    raw_notes: [],
    notes: [],
    final_report: '',
  };

  // Step 1: Clarify with user
  const clarifyResult = await clarifyWithUser(
    { id: currentState.id, messages: currentState.messages },
    config,
    dataStream,
  );

  if (clarifyResult.goto === '__end__') {
    const endState = clarifyResult.data;
    if (endState.end_type === 'clarification_needed') {
      return { ...currentState, messages: endState.messages };
    }
    // This path should not be taken, as clarifyWithUser only ends with 'clarification_needed'
    return currentState;
  }

  dataStream.write({
    id: generateUUID(),
    type: 'data-researchUpdate',
    data: {
      title: 'Research started',
      type: 'progress',
      timestamp: Date.now(),
      status: 'started',
    },
  });

  // Step 2: Write research brief
  const briefResult = await writeResearchBrief(
    { id: currentState.id, messages: currentState.messages },
    config,
    dataStream,
  );
  currentState = { ...currentState, ...briefResult.data };

  // Step 3: Research supervisor loop
  let supervisorState: SupervisorState = {
    id: currentState.id,
    supervisor_messages: currentState.supervisor_messages,
    research_brief: currentState.research_brief || '',
    notes: currentState.notes,
    research_iterations: 0,
    raw_notes: currentState.raw_notes,
    tool_calls: [],
  };

  while (true) {
    const supervisorResult = await supervisor(
      supervisorState,
      config,
      dataStream,
    );
    supervisorState = { ...supervisorState, ...supervisorResult.data };

    const toolsResult = await supervisorToolsExecutions(
      supervisorState,
      config,
      dataStream,
    );

    if (toolsResult.goto === '__end__') {
      const endState = toolsResult.data;
      if (endState.end_type === 'research_complete') {
        currentState = {
          ...currentState,
          notes: endState.notes,
          research_brief: endState.research_brief,
        };
      }
      break;
    }

    supervisorState = { ...supervisorState, ...toolsResult.data };
  }

  // Step 4: Final report generation
  const finalResult = await finalReportGeneration(
    currentState,
    config,
    dataStream,
  );

  dataStream.write({
    id: generateUUID(),
    type: 'data-researchUpdate',
    data: {
      title: 'Research complete',
      type: 'progress',
      timestamp: Date.now(),
      status: 'completed',
    },
  });

  currentState = { ...currentState, ...finalResult };

  return currentState;
}
