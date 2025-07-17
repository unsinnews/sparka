'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  useRef,
} from 'react';
import type { Attachment, UiToolName } from '@/lib/ai/types';
import { useDefaultModel, useModelChange } from './default-model-provider';
import { getModelDefinition } from '@/lib/ai/all-models';
import type { LexicalChatInputRef } from '@/components/ui/lexical-chat-input';

interface ChatInputContextType {
  editorRef: React.RefObject<LexicalChatInputRef>;
  selectedTool: UiToolName | null;
  setSelectedTool: Dispatch<SetStateAction<UiToolName | null>>;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  selectedModelId: string;
  handleModelChange: (modelId: string) => Promise<void>;
  clearInput: () => void;
  resetData: () => void;
  clearAttachments: () => void;
  getInputValue: () => string;
  handleInputChange: (value: string) => void;
  getInitialInput: () => string;
}

const ChatInputContext = createContext<ChatInputContextType | undefined>(
  undefined,
);

interface ChatInputProviderProps {
  children: ReactNode;
  initialInput?: string;
  initialTool?: UiToolName | null;
  initialAttachments?: Array<Attachment>;
  overrideModelId?: string; // For message editing where we want to use the original model
  localStorageEnabled?: boolean;
}

export function ChatInputProvider({
  children,
  initialInput = '',
  initialTool = null,
  initialAttachments = [],
  overrideModelId,
  localStorageEnabled = true,
}: ChatInputProviderProps) {
  // Helper functions for localStorage access without state
  const getLocalStorageInput = useCallback(() => {
    if (!localStorageEnabled) return '';
    try {
      return localStorage.getItem('input') || '';
    } catch {
      return '';
    }
  }, [localStorageEnabled]);

  const setLocalStorageInput = useCallback(
    (value: string) => {
      if (!localStorageEnabled) return;
      // Defer localStorage operation to avoid blocking caller
      queueMicrotask(() => {
        try {
          localStorage.setItem('input', value);
        } catch {
          // Silently fail if localStorage is not available
        }
      });
    },
    [localStorageEnabled],
  );

  const defaultModel = useDefaultModel();
  const changeModel = useModelChange();

  // Initialize selectedModelId from override or default model
  const [selectedModelId, setSelectedModelId] = useState<string>(
    overrideModelId || defaultModel,
  );

  const [selectedTool, setSelectedTool] = useState<UiToolName | null>(
    initialTool,
  );
  const [attachments, setAttachments] =
    useState<Array<Attachment>>(initialAttachments);

  // Create ref for lexical editor
  const editorRef = useRef<LexicalChatInputRef>(null);

  // Get the initial input value from localStorage if enabled and no initial input provided
  const getInitialInput = useCallback(() => {
    if (!localStorageEnabled) return initialInput;
    return initialInput || getLocalStorageInput();
  }, [initialInput, getLocalStorageInput, localStorageEnabled]);

  const handleModelChange = useCallback(
    async (modelId: string) => {
      const modelDef = getModelDefinition(modelId as any);
      const hasReasoning = modelDef.features?.reasoning === true;

      // If switching to a reasoning model and deep research is selected, disable it
      if (hasReasoning && selectedTool === 'deepResearch') {
        setSelectedTool(null);
      }

      // Update local state immediately
      setSelectedModelId(modelId);

      // Update global default model (which handles cookie persistence)
      await changeModel(modelId as any);
    },
    [selectedTool, setSelectedTool, changeModel],
  );

  const clearInput = useCallback(() => {
    editorRef.current?.clear();
    setLocalStorageInput('');
  }, [setLocalStorageInput]);

  const resetData = useCallback(() => {
    setSelectedTool(initialTool);
  }, [initialTool]);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const getInputValue = useCallback(() => {
    return editorRef.current?.getValue() || '';
  }, []);

  // Save to localStorage when input changes (will be called by the lexical editor)
  const handleInputChange = useCallback(
    (value: string) => {
      if (localStorageEnabled) {
        setLocalStorageInput(value);
      }
    },
    [setLocalStorageInput, localStorageEnabled],
  );

  return (
    <ChatInputContext.Provider
      value={{
        editorRef,
        selectedTool,
        setSelectedTool,
        attachments,
        setAttachments,
        selectedModelId,
        handleModelChange,
        clearInput,
        resetData,
        clearAttachments,
        getInputValue,
        handleInputChange,
        getInitialInput,
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
