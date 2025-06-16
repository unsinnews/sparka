'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  getAnonymousSession,
  createAnonymousSession,
  setAnonymousSession,
} from '@/lib/anonymous-session-client';

export function AnonymousSessionInit() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only initialize for non-authenticated users after session is loaded
    if (status === 'loading') return;
    if (session?.user) return;

    // Check if anonymous session exists, if not create one
    const existingSession = getAnonymousSession();
    if (!existingSession) {
      const newSession = createAnonymousSession();
      setAnonymousSession(newSession);
    }
  }, [session, status]);

  return null; // This component doesn't render anything
}
