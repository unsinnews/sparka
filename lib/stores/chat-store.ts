import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import {
  AbstractChat,
  type ChatInit,
  type ChatState,
  type ChatStatus,
  type UIMessage,
} from 'ai';
import type { ChatMessage } from '@/lib/ai/types';

interface ChatStoreState<UI_MESSAGE extends UIMessage> {
  id: string | undefined;
  messages: UI_MESSAGE[];
  status: ChatStatus;
  error: Error | undefined;

  // Actions
  setId: (id: string | undefined) => void;
  setMessages: (messages: UI_MESSAGE[]) => void;
  setStatus: (status: ChatStatus) => void;
  setError: (error: Error | undefined) => void;
  setNewChat: (id: string, messages: UI_MESSAGE[]) => void;
  pushMessage: (message: UI_MESSAGE) => void;
  popMessage: () => void;
  replaceMessage: (index: number, message: UI_MESSAGE) => void;
}

// Create the Zustand store
export function createChatStore<UI_MESSAGE extends UIMessage>(
  initialMessages: UI_MESSAGE[] = [],
) {
  return create<ChatStoreState<UI_MESSAGE>>()(
    devtools(
      subscribeWithSelector((set, get) => ({
        id: undefined,
        messages: initialMessages,
        status: 'ready',
        error: undefined,

        setId: (id) => set({ id }),
        setMessages: (messages) => set({ messages: [...messages] }),
        setStatus: (status) => set({ status }),
        setError: (error) => set({ error }),
        setNewChat: (id, messages) =>
          set({
            messages: [...messages],
            status: 'ready',
            error: undefined,
            id,
          }),

        pushMessage: (message) =>
          set((state) => ({ messages: [...state.messages, message] })),

        popMessage: () =>
          set((state) => ({ messages: state.messages.slice(0, -1) })),

        replaceMessage: (index, message) =>
          set((state) => ({
            messages: [
              ...state.messages.slice(0, index),
              structuredClone(message), // Deep clone for React Compiler compatibility
              ...state.messages.slice(index + 1),
            ],
          })),
      })),
      { name: 'chat-store' },
    ),
  );
}

// Chat state implementation that bridges Zustand to ChatState interface
class ZustandChatState<UI_MESSAGE extends UIMessage>
  implements ChatState<UI_MESSAGE>
{
  private store: ReturnType<typeof createChatStore<UI_MESSAGE>>;
  private messagesCallbacks = new Set<() => void>();
  private statusCallbacks = new Set<() => void>();
  private errorCallbacks = new Set<() => void>();

  constructor(store: ReturnType<typeof createChatStore<UI_MESSAGE>>) {
    this.store = store;

    // Subscribe to Zustand store changes and notify React callbacks
    this.store.subscribe(
      (state) => state.messages,
      () => this.messagesCallbacks.forEach((callback) => callback()),
      { equalityFn: (a, b) => a === b },
    );

    this.store.subscribe(
      (state) => state.status,
      () => this.statusCallbacks.forEach((callback) => callback()),
    );

    this.store.subscribe(
      (state) => state.error,
      () => this.errorCallbacks.forEach((callback) => callback()),
    );
  }

  get messages(): UI_MESSAGE[] {
    return this.store.getState().messages;
  }

  set messages(newMessages: UI_MESSAGE[]) {
    this.store.getState().setMessages(newMessages);
  }

  get status(): ChatStatus {
    return this.store.getState().status;
  }

  set status(newStatus: ChatStatus) {
    this.store.getState().setStatus(newStatus);
  }

  get error(): Error | undefined {
    return this.store.getState().error;
  }

  set error(newError: Error | undefined) {
    this.store.getState().setError(newError);
  }

  pushMessage = (message: UI_MESSAGE) => {
    this.store.getState().pushMessage(message);
  };

  popMessage = () => {
    this.store.getState().popMessage();
  };

  replaceMessage = (index: number, message: UI_MESSAGE) => {
    this.store.getState().replaceMessage(index, message);
  };

  snapshot = <T>(value: T): T => structuredClone(value);

  // React subscription methods (using private names like the original)
  '~registerMessagesCallback' = (
    onChange: () => void,
    throttleWaitMs?: number,
  ): (() => void) => {
    // Note: You could implement throttling here if needed
    const callback = throttleWaitMs
      ? this.throttle(onChange, throttleWaitMs)
      : onChange;

    this.messagesCallbacks.add(callback);
    return () => {
      this.messagesCallbacks.delete(callback);
    };
  };

  '~registerStatusCallback' = (onChange: () => void): (() => void) => {
    this.statusCallbacks.add(onChange);
    return () => {
      this.statusCallbacks.delete(onChange);
    };
  };

  '~registerErrorCallback' = (onChange: () => void): (() => void) => {
    this.errorCallbacks.add(onChange);
    return () => {
      this.errorCallbacks.delete(onChange);
    };
  };

  // Simple throttle implementation
  private throttle = (func: () => void, wait: number) => {
    let timeout: NodeJS.Timeout | null = null;
    return () => {
      if (!timeout) {
        timeout = setTimeout(() => {
          func();
          timeout = null;
        }, wait);
      }
    };
  };

  // Expose store as public property
  get storeInstance() {
    return this.store;
  }
}

export const chatStore = createChatStore<ChatMessage>();

// Create singleton state instance
export const chatState = new ZustandChatState(chatStore);

// Selector hooks for cleaner API
export const useChatMessages = () => chatStore((state) => state.messages);
export const useChatStatus = () => chatStore((state) => state.status);
export const useChatError = () => chatStore((state) => state.error);
export const useChatId = () => chatStore((state) => state.id);

// Action hooks for cleaner API
export const useChatActions = () =>
  chatStore((state) => ({
    setMessages: state.setMessages,
    pushMessage: state.pushMessage,
    popMessage: state.popMessage,
    replaceMessage: state.replaceMessage,
    setStatus: state.setStatus,
    setError: state.setError,
    setId: state.setId,
    setNewChat: state.setNewChat,
  }));

// Convenience hook for just setMessages
export const useSetMessages = () => chatStore((state) => state.setMessages);

export class ZustandChat<
  UI_MESSAGE extends UIMessage,
> extends AbstractChat<UI_MESSAGE> {
  private zustandState: ZustandChatState<UI_MESSAGE>;
  public store: ReturnType<typeof createChatStore<UI_MESSAGE>>;

  constructor({
    messages,
    state,
    id,
    ...init
  }: ChatInit<UI_MESSAGE> & {
    state: ZustandChatState<UI_MESSAGE>;
    id?: string;
  }) {
    super({ ...init, state });
    this.zustandState = state;
    this.store = state.storeInstance;
    console.log(
      'building zustand chat with id',
      id,
      'store id',
      this.store.getState().id,
    );
  }

  // Expose the subscription methods for useChat
  '~registerMessagesCallback' = (
    onChange: () => void,
    throttleWaitMs?: number,
  ): (() => void) =>
    this.zustandState['~registerMessagesCallback'](onChange, throttleWaitMs);

  '~registerStatusCallback' = (onChange: () => void): (() => void) =>
    this.zustandState['~registerStatusCallback'](onChange);

  '~registerErrorCallback' = (onChange: () => void): (() => void) =>
    this.zustandState['~registerErrorCallback'](onChange);
}
