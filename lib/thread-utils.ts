// Generic message type that works for both DB and anonymous messages
export interface MessageNode {
  id: string;
  parentMessageId: string | null;
  createdAt: Date;
  [key: string]: any; // Allow other properties
}

// Get the default leaf (most recent message by timestamp)
export function getDefaultLeafMessage<T extends MessageNode>(
  allMessages: T[],
): T | null {
  console.log(
    '[getDefaultLeafMessage] Called with',
    allMessages.length,
    'messages',
  );
  if (allMessages.length === 0) return null;

  // Sort by createdAt descending and return the first one
  const sorted = [...allMessages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  console.log('[getDefaultLeafMessage] Default leaf:', sorted[0]?.id);
  return sorted[0];
}

// Build thread from leaf message using all messages
export function buildThreadFromLeaf<T extends MessageNode>(
  allMessages: T[],
  leafMessageId: string,
): T[] {
  console.log(
    '[buildThreadFromLeaf] Starting with leaf:',
    leafMessageId,
    'total messages:',
    allMessages.length,
  );
  const messageMap = new Map<string, T>();
  allMessages.forEach((msg) => messageMap.set(msg.id, msg));

  const thread: T[] = [];
  let currentMessageId: string | null = leafMessageId;
  let iteration = 0;

  while (currentMessageId) {
    iteration++;
    console.log(
      `[buildThreadFromLeaf] Iteration ${iteration}, currentMessageId:`,
      currentMessageId,
    );

    if (iteration > 100) {
      console.error(
        '[buildThreadFromLeaf] INFINITE LOOP DETECTED - breaking after 100 iterations',
      );
      break;
    }

    const currentMessage = messageMap.get(currentMessageId);
    if (!currentMessage) {
      console.log('[buildThreadFromLeaf] Message not found, breaking');
      break;
    }

    console.log(
      '[buildThreadFromLeaf] Found message:',
      currentMessage.id,
      'parent:',
      currentMessage.parentMessageId,
    );
    thread.unshift(currentMessage);

    // Check for self-reference
    if (currentMessage.parentMessageId === currentMessage.id) {
      console.error(
        '[buildThreadFromLeaf] SELF-REFERENCE DETECTED for message:',
        currentMessage.id,
      );
      break;
    }

    currentMessageId = currentMessage.parentMessageId;
  }

  console.log('[buildThreadFromLeaf] Final thread length:', thread.length);
  return thread;
}

// Get default thread (combination of the above two)
export function getDefaultThread<T extends MessageNode>(allMessages: T[]): T[] {
  console.log('[getDefaultThread] Called with', allMessages.length, 'messages');
  const defaultLeaf = getDefaultLeafMessage(allMessages);
  if (!defaultLeaf) {
    console.log('[getDefaultThread] No default leaf found');
    return [];
  }

  return buildThreadFromLeaf(allMessages, defaultLeaf.id);
}
