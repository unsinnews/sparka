'use client';

import type { Dispatch, SetStateAction } from 'react';
import { GlobeIcon, Lightbulb, Telescope, Settings2 } from 'lucide-react';

import { Toggle } from './ui/toggle';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import type { ChatRequestData } from '@/app/(chat)/api/chat/route';

export function WebSearchToggle({
  enabled,
  setEnabled,
}: { enabled: boolean; setEnabled: (enabled: boolean) => void }) {
  return (
    <Toggle
      pressed={enabled}
      onPressedChange={setEnabled}
      variant="outline"
      size="sm"
      className="gap-2 p-1.5 px-2.5 h-fit border-zinc-700 rounded-full items-center"
    >
      <GlobeIcon size={14} />
      Web search
    </Toggle>
  );
}

export function DeepResearchToggle({
  enabled,
  setEnabled,
}: { enabled: boolean; setEnabled: (enabled: boolean) => void }) {
  return (
    <Toggle
      pressed={enabled}
      onPressedChange={setEnabled}
      variant="outline"
      size="sm"
      className="gap-2 p-1.5 px-2.5 h-fit border-zinc-700 rounded-full items-center"
    >
      <Telescope size={14} />
      Deep research
    </Toggle>
  );
}

export function ReasonSearchToggle({
  enabled,
  setEnabled,
}: { enabled: boolean; setEnabled: (enabled: boolean) => void }) {
  return (
    <Toggle
      pressed={enabled}
      onPressedChange={setEnabled}
      variant="outline"
      size="sm"
      className="gap-2 p-1.5 px-2.5 h-fit border-zinc-700 rounded-full items-center"
    >
      <Lightbulb size={14} />
      Reason
    </Toggle>
  );
}

export function ResponsiveToggles({
  data,
  setData,
}: {
  data: ChatRequestData;
  setData: Dispatch<SetStateAction<ChatRequestData>>;
}) {
  const activeTool = data.webSearch
    ? 'webSearch'
    : data.deepResearch
      ? 'deepResearch'
      : data.reason
        ? 'reason'
        : null;

  const setTool = (tool: 'webSearch' | 'deepResearch' | 'reason' | null) => {
    setData({
      webSearch: tool === 'webSearch',
      deepResearch: tool === 'deepResearch',
      reason: tool === 'reason',
    });
  };

  return (
    <>
      {/* Compact layout for narrow containers */}
      <div className="flex items-center gap-2 @[500px]:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 p-1.5 px-2.5 h-fit rounded-full"
            >
              <Settings2 size={14} />
              <span className="hidden @[400px]:inline">Tools</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-48"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setTool(data.webSearch ? null : 'webSearch');
              }}
              className="flex items-center gap-2"
            >
              <GlobeIcon size={14} />
              <span>Web search</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setTool(data.deepResearch ? null : 'deepResearch');
              }}
              className="flex items-center gap-2"
            >
              <Telescope size={14} />
              <span>Deep research</span>
            </DropdownMenuItem>
            {/* <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setTool(data.reason ? null : 'reason');
              }}
              className="flex items-center gap-2"
            >
              <Lightbulb size={14} />
              <span>Reason</span>
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Show active tool as dismissable pill */}
        {activeTool && (
          <>
            <Separator
              orientation="vertical"
              className="bg-muted-foreground/50 h-4"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTool(null)}
              className="gap-2 p-1.5 px-2.5 h-fit rounded-full"
            >
              {activeTool === 'webSearch' && <GlobeIcon size={14} />}
              {activeTool === 'deepResearch' && <Telescope size={14} />}
              {activeTool === 'reason' && <Lightbulb size={14} />}
              <span className="hidden @[400px]:inline">
                {activeTool === 'webSearch' && 'Web search'}
                {activeTool === 'deepResearch' && 'Deep research'}
                {activeTool === 'reason' && 'Reason'}
              </span>
              <span className="text-xs opacity-70">×</span>
            </Button>
          </>
        )}
      </div>

      {/* Full layout for wider containers */}
      <div className="hidden @[500px]:flex items-center gap-2">
        <WebSearchToggle
          enabled={data.webSearch}
          setEnabled={(enabled) => setTool(enabled ? 'webSearch' : null)}
        />
        <DeepResearchToggle
          enabled={data.deepResearch}
          setEnabled={(enabled) => setTool(enabled ? 'deepResearch' : null)}
        />
        {/* <ReasonSearchToggle
          enabled={data.reason}
          setEnabled={(enabled) => setTool(enabled ? 'reason' : null)}
        /> */}
      </div>
    </>
  );
}
