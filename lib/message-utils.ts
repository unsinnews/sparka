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
  if (allMessages.length === 0) return null;

  // Sort by createdAt descending and return the first one
  const sorted = [...allMessages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return sorted[0];
}

// Build thread from leaf message using all messages
export function buildThreadFromLeaf<T extends MessageNode>(
  allMessages: T[],
  leafMessageId: string,
): T[] {
  const messageMap = new Map<string, T>();
  allMessages.forEach((msg) => messageMap.set(msg.id, msg));

  const thread: T[] = [];
  let currentMessageId: string | null = leafMessageId;

  while (currentMessageId) {
    const currentMessage = messageMap.get(currentMessageId);
    if (!currentMessage) break;

    thread.unshift(currentMessage);
    currentMessageId = currentMessage.parentMessageId;
  }

  return thread;
}

// Get default thread (combination of the above two)
export function getDefaultThread<T extends MessageNode>(allMessages: T[]): T[] {
  const defaultLeaf = getDefaultLeafMessage(allMessages);
  if (!defaultLeaf) return [];

  return buildThreadFromLeaf(allMessages, defaultLeaf.id);
}
