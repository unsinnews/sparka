import { openai } from '@ai-sdk/openai';
import { type ModelMessage, streamText, tool } from 'ai';
import 'dotenv/config';
import z from 'zod';

const getWeather = async ({ location }: { location: string }) => {
  return `The weather in ${location} is ${Math.floor(Math.random() * 100)} degrees.`;
};

const messages: ModelMessage[] = [
  {
    role: 'user',
    content: 'Get the weather in New York and San Francisco',
  },
];

async function main() {
  while (true) {
    const result = streamText({
      model: openai('gpt-4o'),
      messages,
      tools: {
        getWeather: tool({
          description: 'Get the current weather in a given location',
          inputSchema: z.object({
            location: z.string(),
          }),
        }),
        // add more tools here, omitting the execute function so you handle it yourself
      },
    });

    // Stream the response (only necessary for providing updates to the user)
    for await (const chunk of result.fullStream) {
      if (chunk.type === 'text-delta') {
        process.stdout.write(chunk.text);
      }

      if (chunk.type === 'tool-call') {
        console.log('\\nCalling tool:', chunk.toolName);
      }
    }

    // Add LLM generated messages to the message history
    const responseMessages = (await result.response).messages;
    messages.push(...responseMessages);

    const finishReason = await result.finishReason;

    if (finishReason === 'tool-calls') {
      const toolCalls = await result.toolCalls;

      // Handle all tool call execution here
      for (const toolCall of toolCalls) {
        if (toolCall.toolName === 'getWeather') {
          const toolOutput = await getWeather(
            toolCall.input as { location: string },
          );
          messages.push({
            role: 'tool',
            content: [
              {
                toolName: toolCall.toolName,
                toolCallId: toolCall.toolCallId,
                type: 'tool-result',
                output: { type: 'text', value: toolOutput }, // update depending on the tool's output format
              },
            ],
          });
        }
        // Handle other tool calls
      }
    } else {
      // Exit the loop when the model doesn't request to use any more tools
      console.log('\\n\\nFinal message history:');
      console.dir(messages, { depth: null });
      break;
    }
  }
}

main().catch(console.error);
