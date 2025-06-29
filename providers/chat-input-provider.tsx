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
import { useDefaultModel, useModelChange } from './default-model-provider';
import { getModelDefinition } from '@/lib/ai/all-models';

interface ChatInputContextType {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  data: ChatRequestToolsConfig;
  setData: Dispatch<SetStateAction<ChatRequestToolsConfig>>;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  selectedModelId: string;
  handleModelChange: (modelId: string) => Promise<void>;
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
  overrideModelId?: string; // For message editing where we want to use the original model
  localStorageEnabled?: boolean;
}

export function ChatInputProvider({
  children,
  initialInput = '',
  initialData = {
    deepResearch: false,
    webSearch: false,
    reason: false,
    generateImage: false,
  },
  initialAttachments = [],
  overrideModelId,
  localStorageEnabled = true,
}: ChatInputProviderProps) {
  const [localStorageInput, setLocalStorageInput] = useLocalStorage<string>(
    'input',
    '',
  );

  const defaultModel = useDefaultModel();
  const changeModel = useModelChange();

  // Initialize selectedModelId from override or default model
  const [selectedModelId, setSelectedModelId] = useState<string>(
    overrideModelId || defaultModel,
  );

  // Use localStorage value if enabled and no initial input provided, otherwise use initialInput
  const [input, setInputState] = useState(() => {
    if (!localStorageEnabled) return initialInput;
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

  const handleModelChange = useCallback(
    async (modelId: string) => {
      const modelDef = getModelDefinition(modelId as any);
      const hasReasoning = modelDef.features?.reasoning === true;

      // If switching to a reasoning model and deep research is enabled, disable it
      if (hasReasoning && data.deepResearch) {
        setData((prev) => ({
          ...prev,
          deepResearch: false,
        }));
      }

      // Update local state immediately
      setSelectedModelId(modelId);

      // Update global default model (which handles cookie persistence)
      await changeModel(modelId as any);
    },
    [data.deepResearch, setData, changeModel],
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
        selectedModelId,
        handleModelChange,
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
