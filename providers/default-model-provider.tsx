'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AvailableProviderModels } from '@/lib/ai/all-models';

interface DefaultModelContextType {
  defaultModel: AvailableProviderModels;
}

const DefaultModelContext = createContext<DefaultModelContextType | undefined>(
  undefined,
);

interface DefaultModelClientProviderProps {
  children: ReactNode;
  defaultModel: AvailableProviderModels;
}

export function DefaultModelProvider({
  children,
  defaultModel,
}: DefaultModelClientProviderProps) {
  const value = useMemo(() => ({ defaultModel }), [defaultModel]);
  return (
    <DefaultModelContext.Provider value={value}>
      {children}
    </DefaultModelContext.Provider>
  );
}

export function useDefaultModel() {
  const context = useContext(DefaultModelContext);
  if (context === undefined) {
    throw new Error(
      'useDefaultModel must be used within a DefaultModelProvider',
    );
  }
  return context.defaultModel;
}
