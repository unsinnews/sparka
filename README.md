<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Parlagen</h1>
</a>

<p align="center">
  Multi-provider AI chat platform with workflow customization.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a> ·
  <a href="#core-philosophy"><strong>Core Philosophy</strong></a> ·
  <a href="#inspiration"><strong>Inspiration</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports multiple model providers in a single interface
- Multi-Provider AI Access
  - Connect with AI models from various providers without multiple premium subscriptions
  - Model selection and customization options
  - Unified chat interface for different AI capabilities
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - Database integration for saving chat history and user data
  - Efficient file storage capabilities
- Workflow Customization
  - Tools and features for creating custom AI workflows
  - Knowledge access and task performance capabilities
- [NextAuth.js](https://github.com/nextauthjs/next-auth)
  - Simple and secure authentication

## Model Providers

This template ships with [xAI](https://x.ai) `grok-2-1212` as the default chat model. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.


## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
bun install
bun dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

## Cron Jobs

The application includes automated cleanup jobs:

- **Attachment Cleanup**: Runs daily at 2 AM UTC to remove unused file attachments older than 1 hour
- Requires `CRON_SECRET` environment variable for security

To set up the cron job:
1. Add `CRON_SECRET=your-secret-key` to your environment variables (generate with `openssl rand -hex 32`)
2. The cron job is configured in `vercel.json` and will run automatically on Vercel

## Core Philosophy

Parlagen provides a unified platform for accessing the latest AI models and features from multiple providers in a single interface. Our goal is to eliminate the need for multiple premium subscriptions across different AI applications while offering powerful customization options for users to create their own AI workflows.

The platform emphasizes:
- **Unified Access**: Connect with various AI model providers through one interface
- **Cost Efficiency**: Avoid paying for multiple premium subscriptions 
- **Customization**: Power users can create personalized AI workflows
- **Simplicity**: Clean, intuitive interface that's easy to use and maintain

## Inspiration

Parlagen draws inspiration from these excellent projects:

- [vercel/ai-chatbot](https://github.com/vercel/ai-chatbot/)
- [zaidmukaddam/scira](https://github.com/zaidmukaddam/scira/)

## Principles
- Simplicity for the user: The interface should be simple and easy to use.
- Lean code that is easy to maintain and extend.
