#!/usr/bin/env bun

/**
 * Deep Research Demo Example
 *
 * This example demonstrates how to use the deep researcher to conduct
 * comprehensive research on a given topic.
 *
 * Usage:
 *   bun tools/deep-research-demo/example.ts
 *
 * Environment Variables (set in .env.local):
 *   OPENAI_API_KEY - Required for OpenAI models
 *   TAVILY_API_KEY - Required for web search
 */

import { config } from 'dotenv';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { runDeepResearcher } from './deep-researcher';
import type { DeepResearchConfig } from './configuration';
import type { AgentInputState } from './state';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
config({ path: envPath });

async function main() {
  console.log('🔬 Deep Research Demo Starting...\n');

  // Hardcoded configuration to use fewer resources
  const researchConfig: DeepResearchConfig = {
    // Use faster, cheaper models for demo
    research_model: 'openai/gpt-4o-mini',
    compression_model: 'openai/gpt-4o-mini',
    final_report_model: 'openai/gpt-4o',
    summarization_model: 'openai/gpt-4o-mini',

    // Limit iterations for faster demo
    max_researcher_iterations: 2,
    max_concurrent_research_units: 2,

    // Search configuration
    search_api: 'tavily',
    search_api_max_queries: 2,

    // Disable clarification for automated demo
    allow_clarification: false,

    // Token limits
    research_model_max_tokens: 4000,
    compression_model_max_tokens: 4000,
    final_report_model_max_tokens: 6000,
    summarization_model_max_tokens: 4000,

    // Other settings
    max_structured_output_retries: 3,
  };

  console.log('📋 Using hardcoded configuration:');
  console.log(`  Search API: ${researchConfig.search_api}`);
  console.log(`  Research Model: ${researchConfig.research_model}`);
  console.log(`  Final Report Model: ${researchConfig.final_report_model}\n`);

  // Validate required environment variables
  const requiredEnvVars = ['OPENAI_API_KEY'];
  if (researchConfig.search_api === 'tavily') {
    requiredEnvVars.push('TAVILY_API_KEY');
  }

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach((varName) => console.error(`  - ${varName}`));
    console.error('\nPlease set these in your .env.local file');
    process.exit(1);
  }

  // Example research topic
  const selectedTopic =
    'Provide a brief overview of the current state of electric vehicle adoption and charging infrastructure in Europe.';

  console.log(`🎯 Research Topic: ${selectedTopic}\n`);

  // Create input state with the research question
  const input: AgentInputState = {
    id: uuidv4(),
    messages: [
      {
        role: 'user',
        content: selectedTopic,
      },
    ],
  };

  try {
    console.log('🚀 Starting research process...\n');

    const dataStreamer = {
      write: (data: any) => {
        // In a real application, you would stream this data to the client.
        // For this demo, we'll just log it to the console.
        if (typeof data === 'string') {
          process.stdout.write(data);
        } else {
          process.stdout.write(JSON.stringify(data));
        }
      },
      merge: (other: any) => {
        console.log('merge called with:', other);
        return dataStreamer;
      },
      error: (error: any) => {
        console.error('error called with:', error);
      },
      // Assuming 'severity' is a property, not a function
      severity: 'info' as const,
      // Adding a dummy onError to satisfy the type if needed
      onError: (error: unknown) => {
        console.error('onError called with:', error);
      },
    };

    // Run the deep researcher
    const result = await runDeepResearcher(input, researchConfig, dataStreamer);

    console.log('✅ Research completed!\n');

    // Display results
    if (result.research_brief) {
      console.log('📝 Research Brief:');
      console.log('='.repeat(50));
      console.log(result.research_brief);
      console.log('\n');
    }

    if (result.final_report) {
      console.log('📊 Final Report:');
      console.log('='.repeat(50));
      console.log(result.final_report);
      console.log('\n');
    }

    if (result.notes && result.notes.length > 0) {
      console.log('📚 Research Notes:');
      console.log('='.repeat(50));
      result.notes.forEach((note, index) => {
        console.log(`Note ${index + 1}:`);
        console.log(note);
        console.log('---');
      });
      console.log('\n');
    }

    // Display conversation messages if they exist
    if (result.inputMessages && result.inputMessages.length > 1) {
      console.log('💬 Conversation History:');
      console.log('='.repeat(50));
      result.inputMessages.forEach((message, index) => {
        console.log(`${index + 1}. [${message.role}]: ${message.content}`);
      });
    }
  } catch (error) {
    console.error('❌ Research failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the example
if ((import.meta as any).main) {
  await main();
}

export { main };
