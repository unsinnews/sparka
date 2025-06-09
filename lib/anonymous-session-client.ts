'use client';

import { generateUUID } from '@/lib/utils';
import type { AnonymousSession } from '@/lib/types/anonymous';
import { ANONYMOUS_LIMITS } from '@/lib/types/anonymous';

const ANONYMOUS_SESSION_KEY = 'anonymous-session';

// Client-side cookie helpers
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift() || null;
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const encodedValue = encodeURIComponent(value);
  document.cookie = `${name}=${encodedValue}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; Path=/; Max-Age=0`;
}

export function createAnonymousSession(): AnonymousSession {
  return {
    id: generateUUID(),
    messageCount: 0,
    createdAt: new Date(),
    maxMessages: ANONYMOUS_LIMITS.MAX_MESSAGES,
  };
}

export function getAnonymousSession(): AnonymousSession | null {
  try {
    const sessionData = getCookie(ANONYMOUS_SESSION_KEY);

    if (!sessionData) return null;

    const session = JSON.parse(sessionData) as AnonymousSession;

    // Convert createdAt back to Date object
    session.createdAt = new Date(session.createdAt);

    const isExpired =
      Date.now() - session.createdAt.getTime() >
      ANONYMOUS_LIMITS.SESSION_DURATION;

    return isExpired ? null : session;
  } catch (error) {
    console.error('Error parsing anonymous session:', error);
    return null;
  }
}

export function setAnonymousSession(session: AnonymousSession): void {
  setCookie(
    ANONYMOUS_SESSION_KEY,
    JSON.stringify(session),
    ANONYMOUS_LIMITS.SESSION_DURATION / 1000, // Convert to seconds
  );
}

export function clearAnonymousSession(): void {
  deleteCookie(ANONYMOUS_SESSION_KEY);
}

// Hook to get or create an anonymous session
export function useAnonymousSession(): AnonymousSession {
  let session = getAnonymousSession();

  if (!session) {
    session = createAnonymousSession();
    setAnonymousSession(session);
  }

  return session;
}
