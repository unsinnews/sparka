import { cookies } from 'next/headers';
import { generateUUID } from '@/lib/utils';
import type { AnonymousSession } from '@/lib/types/anonymous';
import { ANONYMOUS_LIMITS } from '@/lib/types/anonymous';
import { ANONYMOUS_SESSION_COOKIES_KEY } from './constants';

export function createAnonymousSession(): AnonymousSession {
  return {
    id: generateUUID(),
    messageCount: 0,
    createdAt: new Date(),
    maxMessages: ANONYMOUS_LIMITS.MAX_MESSAGES,
  };
}

export async function getAnonymousSession(): Promise<AnonymousSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionData = cookieStore.get(ANONYMOUS_SESSION_COOKIES_KEY);

    if (!sessionData?.value) return null;

    const session = JSON.parse(sessionData.value) as AnonymousSession;

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

export async function setAnonymousSession(
  session: AnonymousSession,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ANONYMOUS_SESSION_COOKIES_KEY, JSON.stringify(session), {
    path: '/',
    maxAge: ANONYMOUS_LIMITS.SESSION_DURATION / 1000, // Convert to seconds
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearAnonymousSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ANONYMOUS_SESSION_COOKIES_KEY);
}
