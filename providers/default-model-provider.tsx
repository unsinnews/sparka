'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { AvailableProviderModels } from '@/lib/ai/all-models';
import { ANONYMOUS_LIMITS } from '@/lib/types/anonymous';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/all-models';

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
  const { data: session, status } = useSession();

  const value = useMemo(
    () => ({
      defaultModel:
        session?.user ||
        // @ts-expect-error - Problem with as const
        ANONYMOUS_LIMITS.AVAILABLE_MODELS.includes(defaultModel)
          ? defaultModel
          : DEFAULT_CHAT_MODEL,
    }),
    [defaultModel, session],
  );

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
