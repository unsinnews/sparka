'use client';

import * as React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TRPCReactProvider } from '@/trpc/react';
import { ArtifactProvider } from '@/hooks/use-artifact';
import { DataStreamProvider } from '@/components/data-stream-provider';

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TRPCReactProvider>
        <TooltipProvider>
          <ArtifactProvider>
            <DataStreamProvider>
              <Toaster position="top-center" />
              {children}
            </DataStreamProvider>
          </ArtifactProvider>
        </TooltipProvider>
      </TRPCReactProvider>
    </ThemeProvider>
  );
}
