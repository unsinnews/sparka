'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { Attachment } from 'ai';
import type { ChatRequestToolsConfig } from '@/app/(chat)/api/chat/route';
import { useLocalStorage } from 'usehooks-ts';

interface ChatInputContextType {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  data: ChatRequestToolsConfig;
  setData: Dispatch<SetStateAction<ChatRequestToolsConfig>>;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  clearInput: () => void;
  resetData: () => void;
  clearAttachments: () => void;
}

const ChatInputContext = createContext<ChatInputContextType | undefined>(
  undefined,
);

interface ChatInputProviderProps {
  children: ReactNode;
  initialInput?: string;
  initialData?: ChatRequestToolsConfig;
  initialAttachments?: Array<Attachment>;
  localStorageEnabled?: boolean;
}

export function ChatInputProvider({
  children,
  initialInput = '',
  initialData = {
    deepResearch: false,
    webSearch: false,
    reason: false,
  },
  initialAttachments = [],
  localStorageEnabled = true,
}: ChatInputProviderProps) {
  const [localStorageInput, setLocalStorageInput] = useLocalStorage<string>(
    'input',
    '',
  );

  // Use localStorage value if enabled and no initial input provided, otherwise use initialInput
  const [input, setInputState] = useState(() => {
    if (!useLocalStorage) return initialInput;
    return initialInput || localStorageInput;
  });

  const [data, setData] = useState<ChatRequestToolsConfig>(initialData);
  const [attachments, setAttachments] =
    useState<Array<Attachment>>(initialAttachments);

  const setInput = useCallback(
    (value: SetStateAction<string>) => {
      const newValue = typeof value === 'function' ? value(input) : value;
      setInputState(newValue);

      // Only update localStorage if enabled
      if (localStorageEnabled) {
        setLocalStorageInput(newValue);
      }
    },
    [input, setLocalStorageInput, localStorageEnabled],
  );

  const clearInput = useCallback(() => {
    setInputState('');
    if (localStorageEnabled) {
      setLocalStorageInput('');
    }
  }, [setLocalStorageInput, localStorageEnabled]);

  const resetData = useCallback(() => {
    setData(initialData);
  }, [initialData]);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  return (
    <ChatInputContext.Provider
      value={{
        input,
        setInput,
        data,
        setData,
        attachments,
        setAttachments,
        clearInput,
        resetData,
        clearAttachments,
      }}
    >
      {children}
    </ChatInputContext.Provider>
  );
}

export function useChatInput() {
  const context = useContext(ChatInputContext);
  if (context === undefined) {
    throw new Error('useChatInput must be used within a ChatInputProvider');
  }
  return context;
}
