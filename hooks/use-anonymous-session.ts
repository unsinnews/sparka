'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  getAnonymousSession,
  setAnonymousSession as setAnonymousSessionClient,
} from '@/lib/anonymous-session-client';
import type { AnonymousSession } from '@/lib/types/anonymous';

export function useAnonymousSession() {
  const { data: session, status } = useSession();
  const [anonymousSession, setAnonymousSessionState] =
    useState<AnonymousSession | null>(null);

  // Load anonymous session on mount
  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user) return;

    const anonSession = getAnonymousSession();
    if (anonSession) {
      setAnonymousSessionState(anonSession);
    }
  }, [session, status]);

  // Update session and persist to client storage
  const updateAnonymousSession = useCallback(
    (updates: Partial<AnonymousSession>) => {
      if (session?.user) return; // Don't update if user is authenticated

      setAnonymousSessionState((prev) => {
        if (!prev) return null;

        const updated = { ...prev, ...updates };
        setAnonymousSessionClient(updated);
        return updated;
      });
    },
    [session?.user],
  );

  // Increment message count
  const incrementMessageCount = useCallback(() => {
    updateAnonymousSession({
      messageCount: (anonymousSession?.messageCount || 0) + 1,
    });
  }, [anonymousSession?.messageCount, updateAnonymousSession]);

  return {
    anonymousSession,
    updateAnonymousSession,
    incrementMessageCount,
    isAuthenticated: !!session?.user,
  };
}
