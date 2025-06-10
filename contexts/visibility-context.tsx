'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { VisibilityType } from '@/components/visibility-selector';
import { toast } from 'sonner';

interface VisibilityContextValue {
  getVisibility: (chatId: string) => VisibilityType;
  setVisibility: (
    chatId: string,
    visibility: VisibilityType,
    initialVisibility: VisibilityType,
  ) => void;
}

const VisibilityContext = createContext<VisibilityContextValue | undefined>(
  undefined,
);

export function VisibilityProvider({
  children,
}: { children: React.ReactNode }) {
  const [visibilityMap, setVisibilityMap] = useState<
    Record<string, VisibilityType>
  >({});

  const getVisibility = useCallback(
    (chatId: string) => {
      return visibilityMap[chatId];
    },
    [visibilityMap],
  );

  const setVisibility = useCallback(
    (
      chatId: string,
      visibility: VisibilityType,
      initialVisibility: VisibilityType,
    ) => {
      setVisibilityMap((prev) => ({
        ...prev,
        [chatId]: visibility,
      }));

      const message =
        visibility === 'public'
          ? 'Chat is now public - anyone with the link can access it'
          : 'Chat is now private - only you can access it';

      toast.success(message);
    },
    [],
  );

  const returnVal = useMemo(
    () => ({
      getVisibility,
      setVisibility,
    }),
    [getVisibility, setVisibility],
  );

  return (
    <VisibilityContext.Provider value={returnVal}>
      {children}
    </VisibilityContext.Provider>
  );
}

export function useVisibilityContext() {
  const context = useContext(VisibilityContext);
  if (context === undefined) {
    throw new Error(
      'useVisibilityContext must be used within a VisibilityProvider',
    );
  }
  return context;
}
