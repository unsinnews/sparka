// Unified UI types that abstract away storage implementation details

export interface UIChat {
  id: string;
  createdAt: Date;
  title: string;
  visibility: 'private' | 'public';
}

// Helper functions for type conversion
export function dbChatToUIChat(chat: {
  id: string;
  createdAt: Date;
  title: string;
  visibility: 'private' | 'public';
}): UIChat {
  return {
    id: chat.id,
    createdAt: chat.createdAt,
    title: chat.title,
    visibility: chat.visibility,
  };
}
