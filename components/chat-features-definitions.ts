import {
  GlobeIcon,
  Telescope,
  Lightbulb,
  type LucideIcon,
  Images,
} from 'lucide-react';

export type ToolName =
  | 'webSearch'
  | 'deepResearch'
  | 'reason'
  | 'generateImage';

export interface ToolDefinition {
  name: string;
  description: string;
  icon: LucideIcon;
  key: ToolName;
}

export const toolDefinitions: Record<ToolName, ToolDefinition> = {
  webSearch: {
    key: 'webSearch',
    name: 'Web Search',
    description: 'Search the web for real-time information.',
    icon: GlobeIcon,
  },
  deepResearch: {
    key: 'deepResearch',
    name: 'Deep Research',
    description: 'Get comprehensive analysis with citations.',
    icon: Telescope,
  },
  reason: {
    key: 'reason',
    name: 'Reasoning',
    description: 'Get step-by-step logical analysis.',
    icon: Lightbulb,
  },
  generateImage: {
    key: 'generateImage',
    name: 'Create an image',
    description: 'Generate images from text descriptions.',
    icon: Images,
  },
};

export const enabledTools: ToolName[] = [
  'webSearch',
  'deepResearch',
  'generateImage',
];
