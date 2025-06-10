'use client';

import * as React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TRPCReactProvider } from '@/trpc/react';
import { VisibilityProvider } from '@/contexts/visibility-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TRPCReactProvider>
        <VisibilityProvider>
          <TooltipProvider>
            <Toaster position="top-center" />
            {children}
          </TooltipProvider>
        </VisibilityProvider>
      </TRPCReactProvider>
    </ThemeProvider>
  );
}
