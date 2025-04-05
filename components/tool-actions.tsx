import React, { useState } from 'react';
import { FileText, BookA } from 'lucide-react';
import { XLogo } from '@phosphor-icons/react';
import {
  ToolActionContainer,
  ToolActionKind,
  ToolActionContent,
} from './tool-action';
import { Tweet } from 'react-tweet';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  WebSearchUpdate,
  AcademicSearchUpdate,
  XSearchUpdate,
} from '@/lib/ai/tools/research-updates-schema';

// Base interface for all tool actions
interface BaseToolActionProps {
  index?: number;
}

// Web tool action with full update object
export const WebToolAction = ({
  update,
  index = 0,
}: BaseToolActionProps & {
  update: WebSearchUpdate;
}) => {
  if (!update.results || update.results.length === 0) return null;

  return (
    <div className="space-y-2">
      {update.results.map((result, idx) => {
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=128`;

        return (
          <ToolActionContainer key={idx} href={result.url} index={index + idx}>
            <ToolActionKind
              icon={<FileText className="h-4 w-4 text-foreground/80" />}
              name="Reading Web"
            />
            <ToolActionContent title={result.title} faviconUrl={faviconUrl} />
          </ToolActionContainer>
        );
      })}
    </div>
  );
};

// Academic tool action with full update object
export const AcademicToolAction = ({
  update,
  index = 0,
}: BaseToolActionProps & {
  update: AcademicSearchUpdate;
}) => {
  if (!update.results || update.results.length === 0) return null;

  return (
    <div className="space-y-2">
      {update.results.map((result, idx) => {
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=128`;

        return (
          <ToolActionContainer key={idx} href={result.url} index={index + idx}>
            <ToolActionKind
              icon={<BookA className="h-4 w-4 text-foreground/80" />}
              name="Reading Academic"
            />
            <ToolActionContent title={result.title} faviconUrl={faviconUrl} />
          </ToolActionContainer>
        );
      })}
    </div>
  );
};

// X tool action with full update object and tweet display on hover/click
export const XToolAction = ({
  update,
  index = 0,
}: BaseToolActionProps & {
  update: XSearchUpdate;
}) => {
  if (!update.results || update.results.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {update.results.map((result, idx) => {
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=128`;

          // If there's a tweetId, wrap in a tooltip
          if (result.tweetId) {
            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <ToolActionContainer
                    href={result.url}
                    index={index + idx}
                    className="cursor-pointer"
                  >
                    <ToolActionKind
                      icon={<XLogo className="h-4 w-4 text-foreground/80" />}
                      name="Reading X"
                    />
                    <ToolActionContent
                      title={result.title}
                      faviconUrl={faviconUrl}
                    />
                  </ToolActionContainer>
                </TooltipTrigger>
                <TooltipContent className="w-80 p-0" sideOffset={5}>
                  <div className="p-2">
                    <Tweet id={result.tweetId} />
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          }

          // Regular X link without tweet
          return (
            <ToolActionContainer
              key={idx}
              href={result.url}
              index={index + idx}
            >
              <ToolActionKind
                icon={<XLogo className="h-4 w-4 text-foreground/80" />}
                name="Reading X"
              />
              <ToolActionContent title={result.title} faviconUrl={faviconUrl} />
            </ToolActionContainer>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
