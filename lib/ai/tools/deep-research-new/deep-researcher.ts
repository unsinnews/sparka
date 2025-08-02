import { generateObject, generateText, type ModelMessage } from 'ai';
import { getLanguageModel } from '@/lib/ai/providers';
import { truncateMessages } from '@/lib/ai/token-utils';
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
  getModelContextWindow,
  getAllTools,
  getNotesFromToolCalls,
} from './utils';
import type { StreamWriter } from '../../types';
import { generateUUID, getTextContentFromModelMessage } from '@/lib/utils';

// Agent result types (instead of commands)
type ClarificationResult =
  | { needsClarification: true; messages: ModelMessage[] }
  | { needsClarification: false };

type SupervisorResult = {
  status: 'complete';
  data: { notes: string[] };
};

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
): Promise<ClarificationResult> {
  if (!config.allow_clarification) {
    return { needsClarification: false };
  }

  const messages = state.messages;
  const model = getLanguageModel(config.research_model as ModelId);

  // Get model token limit and reserve space for output tokens
  const clarifyModelContextWindow = getModelContextWindow(
    config.research_model as ModelId,
  );

  // Create messages and truncate to fit within token limit
  const clarifyMessages = [
    {
      role: 'user' as const,
      content: clarifyWithUserInstructions({
        messages: getBufferString(messages),
        date: getTodayStr(),
      }),
    },
  ];
  const truncatedClarifyMessages = truncateMessages(
    clarifyMessages,
    clarifyModelContextWindow,
  );

  const response = await generateObject({
    model,
    schema: ClarifyWithUserSchema,
    messages: truncatedClarifyMessages,
    maxOutputTokens: config.research_model_max_tokens,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'clarifyWithUser',
      metadata: {
        requestId: state.requestId || '',
      },
    },
  });

  if (response.object.need_clarification) {
    return {
      needsClarification: true,
      messages: [
        ...state.messages,
        { role: 'assistant' as const, content: response.object.question },
      ],
    };
  } else {
    return { needsClarification: false };
  }
}

async function writeResearchBrief(
  state: WriteResearchBriefInput,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
): Promise<WriteResearchBriefOutput> {
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

    // Get model token limit and reserve space for output tokens
    const briefModelContextWindow = getModelContextWindow(
      config.research_model as ModelId,
    );

    // Create messages and truncate to fit within token limit
    const briefMessages = [
      {
        role: 'user' as const,
        content: transformMessagesIntoResearchTopicPrompt({
          messages: getBufferString(state.messages || []),
          date: getTodayStr(),
        }),
      },
    ];
    const truncatedBriefMessages = truncateMessages(
      briefMessages,
      briefModelContextWindow,
    );

    const result = await generateObject({
      model,
      schema: ResearchQuestionSchema,
      messages: truncatedBriefMessages,
      maxOutputTokens: config.research_model_max_tokens,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'writeResearchBrief',
        metadata: {
          requestId: state.requestId || '',
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

    return {
      research_brief: result.object.research_brief,
    };
  } catch (error) {
    console.error('Error in writeResearchBrief:', error);
    throw error;
  }
}

// Agent base class
abstract class Agent {
  protected agentId: string;

  constructor(
    protected config: DeepResearchConfig,
    protected dataStream: StreamWriter,
  ) {
    this.agentId = generateUUID();
  }
}

// Researcher Agent class
class ResearcherAgent extends Agent {
  private async research(
    state: ResearcherInput,
  ): Promise<CompressResearchInput> {
    console.log('=== RESEARCHER START ===', {
      research_topic: state.research_topic,
      messages_count: state.researcher_messages?.length || 0,
    });

    const researcherMessages = state.researcher_messages || [];
    const tools = await getAllTools(
      this.config,
      this.dataStream,
      state.requestId,
    );
    if (Object.keys(tools).length === 0) {
      throw new Error(
        'No tools found to conduct research: Please configure either your search API or add MCP tools to your configuration.',
      );
    }

    this.dataStream.write({
      type: 'data-researchUpdate',
      data: {
        title: `Researcher: starting research on topic`,
        message: state.research_topic,
        type: 'thoughts',
        status: 'completed',
      },
    });

    // Get model token limit and reserve space for output tokens
    const researchModelContextWindow = getModelContextWindow(
      this.config.research_model as ModelId,
    );

    // Truncate messages to fit within token limit
    const truncatedResearcherMessages = truncateMessages(
      researcherMessages,
      researchModelContextWindow,
    );

    const result = await generateText({
      model: getLanguageModel(this.config.research_model as ModelId),
      messages: truncatedResearcherMessages,
      tools,
      maxOutputTokens: this.config.research_model_max_tokens,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'researcher',
        metadata: {
          requestId: state.requestId || '',
          agentId: this.agentId,
        },
      },
    });

    this.dataStream.write({
      type: 'data-researchUpdate',
      data: {
        title: 'Researcher: research completed',
        type: 'thoughts',
        message: 'Research phase completed',
        status: 'completed',
      },
    });

    return {
      requestId: state.requestId,
      researcher_messages: [...researcherMessages, ...result.response.messages],
    };
  }

  private async compressResearch(
    state: CompressResearchInput,
  ): Promise<ResearcherOutputState> {
    const model = getLanguageModel(this.config.compression_model as ModelId);

    const researcherMessages = [...(state.researcher_messages || [])];

    // Update the system prompt to focus on compression
    researcherMessages[0] = {
      role: 'system' as const,
      content: compressResearchSystemPrompt({ date: getTodayStr() }),
    };
    researcherMessages.push({
      role: 'user' as const,
      content: compressResearchSimpleHumanMessage,
    });

    const compressUpdateId = generateUUID();
    this.dataStream.write({
      id: compressUpdateId,
      type: 'data-researchUpdate',
      data: {
        title: 'Researcher: Summarizing research',
        type: 'thoughts',
        message: 'Summarizing research...',
        status: 'running',
      },
    });

    // Get model token limit and reserve space for output tokens
    const compressionModelContextWindow = getModelContextWindow(
      this.config.compression_model as ModelId,
    );

    // Truncate messages to fit within token limit
    const truncatedMessages = truncateMessages(
      researcherMessages,
      compressionModelContextWindow,
    );

    const response = await generateText({
      model,
      messages: truncatedMessages,
      maxOutputTokens: this.config.compression_model_max_tokens,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'compressResearch',
        metadata: {
          requestId: state.requestId || '',
          agentId: this.agentId,
        },
      },
      maxRetries: 3,
    });

    this.dataStream.write({
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
      compressed_research: response.response.messages
        .map((m) => getTextContentFromModelMessage(m))
        .join('\n'),
      raw_notes: [
        filterMessages(researcherMessages, ['tool', 'assistant'])
          .map((m) => String(m.content))
          .join('\n'),
      ],
    };
  }

  async executeResearchSubgraph(
    initialState: ResearcherState,
  ): Promise<ResearcherOutputState> {
    const result = await this.research({
      requestId: initialState.requestId,
      researcher_messages: initialState.researcher_messages,
      research_topic: initialState.research_topic,
      tool_call_iterations: initialState.tool_call_iterations,
    });

    return await this.compressResearch({
      requestId: initialState.requestId,
      researcher_messages: result.researcher_messages,
    });
  }
}

// Supervisor Agent class
class SupervisorAgent extends Agent {
  private researcherAgent: ResearcherAgent;

  constructor(config: DeepResearchConfig, dataStream: StreamWriter) {
    super(config, dataStream);
    this.researcherAgent = new ResearcherAgent(config, dataStream);
  }

  private async supervise(state: SupervisorInput): Promise<SupervisorOutput> {
    console.log('=== SUPERVISOR START ===', {
      research_iterations: state.research_iterations,
      max_iterations: this.config.max_researcher_iterations,
      messages_count: state.supervisor_messages?.length || 0,
    });

    const model = getLanguageModel(this.config.research_model as ModelId);

    const supervisorUpdateId = generateUUID();
    this.dataStream.write({
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

    // Get model token limit and reserve space for output tokens
    const supervisorModelContextWindow = getModelContextWindow(
      this.config.research_model as ModelId,
    );

    // Truncate messages to fit within token limit
    const truncatedSupervisorMessages = truncateMessages(
      state.supervisor_messages,
      supervisorModelContextWindow,
    );

    const result = await generateText({
      model,
      messages: truncatedSupervisorMessages,
      tools: leadResearcherTools,
      maxOutputTokens: this.config.research_model_max_tokens,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'supervisor',
        metadata: {
          requestId: state.requestId || '',
          agentId: this.agentId,
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
    this.dataStream.write({
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
    return {
      supervisor_messages: [
        ...(state.supervisor_messages || []),
        ...responseMessages,
      ],
      tool_calls: result.toolCalls || [],
      research_iterations: (state.research_iterations || 0) + 1,
    };
  }

  async runSupervisorGraph(
    initialState: SupervisorState,
  ): Promise<SupervisorResult> {
    let supervisorState: SupervisorInput = {
      requestId: initialState.requestId,
      supervisor_messages: initialState.supervisor_messages,
      research_brief: initialState.research_brief,
      notes: initialState.notes,
      research_iterations: initialState.research_iterations,
      raw_notes: initialState.raw_notes,
      tool_calls: initialState.tool_calls,
    };

    while (true) {
      const supervisorResult = await this.supervise(supervisorState);

      // Create the input for executeTools with all required fields
      const toolsInput: SupervisorToolsInput = {
        requestId: supervisorState.requestId,
        supervisor_messages: supervisorResult.supervisor_messages,
        research_brief: supervisorState.research_brief,
        research_iterations: supervisorResult.research_iterations,
        tool_calls: supervisorResult.tool_calls,
      };

      const toolsResult = await this.executeTools(toolsInput);

      if (toolsResult.status === 'complete') {
        return {
          status: 'complete',
          data: {
            notes: toolsResult.data.notes,
          },
        };
      }

      // Merge the data from toolsResult with the current state to create new SupervisorInput
      supervisorState = {
        requestId: supervisorState.requestId,
        research_brief: supervisorState.research_brief,
        notes: supervisorState.notes,
        supervisor_messages: toolsResult.data.supervisor_messages,
        research_iterations: supervisorResult.research_iterations,
        raw_notes: [
          ...supervisorState.raw_notes,
          ...toolsResult.data.raw_notes,
        ],
        tool_calls: [],
      };
    }
  }

  private async executeTools(
    state: SupervisorToolsInput,
  ): Promise<
    | { status: 'complete'; data: { notes: string[] } }
    | { status: 'continue'; data: SupervisorToolsOutput }
  > {
    console.log('=== SUPERVISOR TOOLS START ===', {
      research_iterations: state.research_iterations,
      max_iterations: this.config.max_researcher_iterations,
      tool_calls_count: state.tool_calls?.length || 0,
      tool_names: state.tool_calls?.map((tc) => tc.toolName) || [],
    });
    const supervisorUpdateId = generateUUID();

    const supervisorMessages = state.supervisor_messages || [];
    const researchIterations = state.research_iterations || 0;

    // Exit Criteria
    const exceededAllowedIterations =
      researchIterations > this.config.max_researcher_iterations;

    const toolCalls = state.tool_calls;
    const noToolCalls = !toolCalls || toolCalls.length === 0;
    const researchCompleteToolCall = toolCalls?.some(
      (toolCall) => toolCall.toolName === 'researchComplete',
    );

    if (exceededAllowedIterations || noToolCalls || researchCompleteToolCall) {
      return {
        status: 'complete',
        data: {
          notes: getNotesFromToolCalls(supervisorMessages),
        },
      };
    }

    // Otherwise, conduct research and gather results
    const allConductResearchCalls =
      toolCalls?.filter(
        (toolCall) => toolCall.toolName === 'conductResearch',
      ) || [];

    const conductResearchCalls = allConductResearchCalls.slice(
      0,
      this.config.max_concurrent_research_units,
    );
    const overflowConductResearchCalls = allConductResearchCalls.slice(
      this.config.max_concurrent_research_units,
    );

    const researcherSystemPromptText = researchSystemPrompt({
      mcp_prompt: this.config.mcp_prompt || '',
      date: getTodayStr(),
      max_search_queries: this.config.search_api_max_queries,
    });

    this.dataStream.write({
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
      const result = await this.researcherAgent.executeResearchSubgraph({
        requestId: state.requestId,
        researcher_messages: [
          { role: 'system' as const, content: researcherSystemPromptText },
          { role: 'user' as const, content: toolCall.input.research_topic },
        ],
        tool_calls: [],
        research_topic: toolCall.input.research_topic,
        tool_call_iterations: 0,
        compressed_research: '',
        raw_notes: [],
      });
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
              value: `Error: Did not run this research as you have already exceeded the maximum number of concurrent research units. Please try again with ${this.config.max_concurrent_research_units} or fewer research units.`,
            }, // update depending on the tool's output format
          },
        ],
      });
    }

    const rawNotesConcat = toolResults
      .map((observation) => observation.raw_notes.join('\n'))
      .join('\n');

    return {
      status: 'continue',
      data: {
        supervisor_messages: [...supervisorMessages, ...toolResultsMessages],
        raw_notes: [rawNotesConcat],
      },
    };
  }
}

async function finalReportGeneration(
  state: AgentState,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
): Promise<Partial<AgentState>> {
  const notes = state.notes || [];
  const clearedState = { notes: [] };

  const model = getLanguageModel(config.final_report_model as ModelId);
  const findings = notes.join('\n');

  const finalReportPromptText = finalReportGenerationPrompt({
    research_brief: state.research_brief || '',
    findings,
    date: getTodayStr(),
  });

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

  // Get model token limit and reserve space for output tokens
  const finalReportModelContextWindow = getModelContextWindow(
    config.final_report_model as ModelId,
  );

  // Truncate messages to fit within token limit
  const finalReportMessages = [
    { role: 'user' as const, content: finalReportPromptText },
  ];
  const truncatedFinalMessages = truncateMessages(
    finalReportMessages,
    finalReportModelContextWindow,
  );

  const finalReport = await generateText({
    model,
    messages: truncatedFinalMessages,
    maxOutputTokens: config.final_report_model_max_tokens,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'finalReportGeneration',
      metadata: {
        requestId: state.requestId || '',
      },
    },
    maxRetries: 3,
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
}

// Main deep researcher workflow
export async function runDeepResearcher(
  input: AgentInputState,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
): Promise<AgentState> {
  let currentState: AgentState = {
    requestId: input.requestId,
    messages: input.messages,
    supervisor_messages: [],
    raw_notes: [],
    notes: [],
    final_report: '',
  };

  // Step 1: Clarify with user
  const clarifyResult = await clarifyWithUser(
    { requestId: currentState.requestId, messages: currentState.messages },
    config,
    dataStream,
  );

  if (clarifyResult.needsClarification) {
    return { ...currentState, messages: clarifyResult.messages };
  }

  dataStream.write({
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
    { requestId: currentState.requestId, messages: currentState.messages },
    config,
    dataStream,
  );
  currentState.research_brief = briefResult.research_brief;

  // Step 3: Research supervisor loop
  const supervisorAgent = new SupervisorAgent(config, dataStream);

  const supervisorResult = await supervisorAgent.runSupervisorGraph({
    requestId: currentState.requestId,
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
        content: briefResult.research_brief,
      },
    ],
    research_brief: currentState.research_brief || '',
    notes: currentState.notes,
    research_iterations: 0,
    raw_notes: currentState.raw_notes,
    tool_calls: [],
  });

  currentState = {
    ...currentState,
    notes: supervisorResult.data.notes,
  };

  // Step 4: Final report generation
  const finalResult = await finalReportGeneration(
    currentState,
    config,
    dataStream,
  );

  dataStream.write({
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
