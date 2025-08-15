import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import {
  AbstractChat,
  type ChatInit,
  type ChatState,
  type ChatStatus,
  type UIMessage,
} from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/ai/types';
import { throttle } from '@/components/throttle';
import { marked } from 'marked';

// Helper types to safely derive the message part and part.type types from UI_MESSAGE
type UIMessageParts<UI_MSG> = UI_MSG extends { parts: infer P } ? P : never;
type UIMessagePart<UI_MSG> = UIMessageParts<UI_MSG> extends Array<infer I>
  ? I
  : never;
type UIMessagePartType<UI_MSG> = UIMessagePart<UI_MSG> extends { type: infer T }
  ? T
  : never;

function extractPartTypes<UI_MESSAGE extends UIMessage>(
  message: UI_MESSAGE,
): {
  partsRef: UIMessageParts<UI_MESSAGE>;
  types: Array<UIMessagePartType<UI_MESSAGE>>;
} {
  const partsRef = (message as unknown as { parts: unknown[] })
    .parts as UIMessageParts<UI_MESSAGE>;
  const types = (partsRef as Array<UIMessagePart<UI_MESSAGE>>).map(
    (part) =>
      (
        part as UIMessagePart<UI_MESSAGE> & {
          type: UIMessagePartType<UI_MESSAGE>;
        }
      ).type,
  ) as Array<UIMessagePartType<UI_MESSAGE>>;
  return { partsRef, types };
}

function areArraysShallowEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Helper to sanitize incomplete streaming markdown for block tokenization
function parseIncompleteMarkdownForStreaming(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  const linkImagePattern = /(!?\[)([^\]]*?)$/;
  const linkMatch = result.match(linkImagePattern);
  if (linkMatch) {
    const startIndex = result.lastIndexOf(linkMatch[1]);
    result = result.substring(0, startIndex);
  }
  const boldPattern = /(\*\*)([^*]*?)$/;
  const boldMatch = result.match(boldPattern);
  if (boldMatch) {
    const asteriskPairs = (result.match(/\*\*/g) || []).length;
    if (asteriskPairs % 2 === 1) result = `${result}**`;
  }
  const italicPattern = /(__)([^_]*?)$/;
  const italicMatch = result.match(italicPattern);
  if (italicMatch) {
    const underscorePairs = (result.match(/__/g) || []).length;
    if (underscorePairs % 2 === 1) result = `${result}__`;
  }
  const singleAsteriskPattern = /(\*)([^*]*?)$/;
  const singleAsteriskMatch = result.match(singleAsteriskPattern);
  if (singleAsteriskMatch) {
    const singleAsterisks = result.split('').reduce((acc, char, index) => {
      if (char === '*') {
        const prevChar = result[index - 1];
        const nextChar = result[index + 1];
        if (prevChar !== '*' && nextChar !== '*') return acc + 1;
      }
      return acc;
    }, 0);
    if (singleAsterisks % 2 === 1) result = `${result}*`;
  }
  const singleUnderscorePattern = /(_)([^_]*?)$/;
  const singleUnderscoreMatch = result.match(singleUnderscorePattern);
  if (singleUnderscoreMatch) {
    const singleUnderscores = result.split('').reduce((acc, char, index) => {
      if (char === '_') {
        const prevChar = result[index - 1];
        const nextChar = result[index + 1];
        if (prevChar !== '_' && nextChar !== '_') return acc + 1;
      }
      return acc;
    }, 0);
    if (singleUnderscores % 2 === 1) result = `${result}_`;
  }
  const inlineCodePattern = /(`)([^`]*?)$/;
  const inlineCodeMatch = result.match(inlineCodePattern);
  if (inlineCodeMatch) {
    const allTripleBackticks = (result.match(/```/g) || []).length;
    const insideIncompleteCodeBlock = allTripleBackticks % 2 === 1;
    if (!insideIncompleteCodeBlock) {
      let singleBacktickCount = 0;
      for (let i = 0; i < result.length; i++) {
        if (result[i] === '`') {
          const isTripleStart = result.substring(i, i + 3) === '```';
          const isTripleMiddle =
            i > 0 && result.substring(i - 1, i + 2) === '```';
          const isTripleEnd = i > 1 && result.substring(i - 2, i + 1) === '```';
          if (!isTripleStart && !isTripleMiddle && !isTripleEnd) {
            singleBacktickCount++;
          }
        }
      }
      if (singleBacktickCount % 2 === 1) result = `${result}\``;
    }
  }
  const strikethroughPattern = /(~~)([^~]*?)$/;
  const strikethroughMatch = result.match(strikethroughPattern);
  if (strikethroughMatch) {
    const tildePairs = (result.match(/~~/g) || []).length;
    if (tildePairs % 2 === 1) result = `${result}~~`;
  }
  return result;
}

interface ChatStoreState<UI_MESSAGE extends UIMessage> {
  id: string | undefined;
  messages: UI_MESSAGE[];
  status: ChatStatus;
  error: Error | undefined;

  // Cached selectors to prevent infinite loops
  _cachedMessageIds: string[] | null;
  // Throttled messages cache
  _throttledMessages: UI_MESSAGE[] | null;
  // Cache for derived part types per message id to keep selector snapshots stable
  _cachedPartTypesById: Record<
    string,
    {
      partsRef: UIMessageParts<UI_MESSAGE>;
      types: Array<UIMessagePartType<UI_MESSAGE>>;
    }
  >;
  // Cache for contiguous part ranges to stabilize selector snapshots
  _cachedPartRangesById: Record<
    string,
    {
      partsRef: UIMessageParts<UI_MESSAGE>;
      ranges: Record<string, UIMessageParts<UI_MESSAGE>>;
    }
  >;

  // Cache for markdown blocks per message id, keyed by part index and last-flag
  _cachedMarkdownBlocksById: Record<
    string,
    {
      partsRef: UIMessageParts<UI_MESSAGE>;
      entries: Record<string, string[]>; // key: `${partIdx}|${isLast?1:0}`
    }
  >;

  // Cache for single part selection by part index per message id
  _cachedPartByIdxById: Record<
    string,
    {
      partsRef: UIMessageParts<UI_MESSAGE>;
      entries: Record<number, UIMessageParts<UI_MESSAGE>[number]>;
    }
  >;

  // Actions
  setId: (id: string | undefined) => void;
  setMessages: (messages: UI_MESSAGE[]) => void;
  setStatus: (status: ChatStatus) => void;
  setError: (error: Error | undefined) => void;
  setNewChat: (id: string, messages: UI_MESSAGE[]) => void;
  pushMessage: (message: UI_MESSAGE) => void;
  popMessage: () => void;
  replaceMessage: (index: number, message: UI_MESSAGE) => void;

  // Getters
  getLastMessageId: () => string | null;
  getMessageIds: () => string[];
  getThrottledMessages: () => UI_MESSAGE[];
  getInternalMessages: () => UI_MESSAGE[];
  getMessagePartTypesById: (
    messageId: string,
  ) => Array<UIMessagePartType<UI_MESSAGE>>;
  getMessagePartsRangeCached: (
    messageId: string,
    startIdx: number,
    endIdx: number,
    type?: string,
  ) => UIMessageParts<UI_MESSAGE>;
  getMarkdownBlocksForPart: (messageId: string, partIdx: number) => string[];
  getMarkdownBlockCountForPart: (messageId: string, partIdx: number) => number;
  getMarkdownBlockByIndex: (
    messageId: string,
    partIdx: number,
    blockIdx: number,
  ) => string | null;
  getMessagePartByIdxCached: (
    messageId: string,
    partIdx: number,
  ) => UIMessageParts<UI_MESSAGE>[number];

  // Helpers (moved from globals into the store)
  currentChatHelpers: Pick<
    UseChatHelpers<UI_MESSAGE>,
    'stop' | 'sendMessage' | 'regenerate'
  > | null;
  setCurrentChatHelpers: (
    helpers: Pick<
      UseChatHelpers<UI_MESSAGE>,
      'stop' | 'sendMessage' | 'regenerate'
    >,
  ) => void;
}

// Throttling configuration
const MESSAGES_THROTTLE_MS = 100;

// Create the Zustand store
export function createChatStore<UI_MESSAGE extends UIMessage>(
  initialMessages: UI_MESSAGE[] = [],
) {
  let throttledMessagesUpdater: (() => void) | null = null;

  return create<ChatStoreState<UI_MESSAGE>>()(
    devtools(
      subscribeWithSelector((set, get) => {
        // Initialize throttled messages updater
        if (!throttledMessagesUpdater) {
          throttledMessagesUpdater = throttle(() => {
            const state = get();
            const nextThrottled = [...state.messages];
            const newMessageIds = nextThrottled.map((msg) => msg.id);
            const prevMessageIds = state._cachedMessageIds;
            const idsChanged =
              !prevMessageIds ||
              prevMessageIds.length !== newMessageIds.length ||
              prevMessageIds.some((id, idx) => id !== newMessageIds[idx]);
            const nextCachedMessageIds = idsChanged
              ? newMessageIds
              : prevMessageIds;

            const nextCachedPartTypes: Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                types: Array<UIMessagePartType<UI_MESSAGE>>;
              }
            > = { ...state._cachedPartTypesById };

            const nextCachedPartRanges: Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                ranges: Record<string, UIMessageParts<UI_MESSAGE>>;
              }
            > = { ...state._cachedPartRangesById } as Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                ranges: Record<string, UIMessageParts<UI_MESSAGE>>;
              }
            >;

            const nextCachedMarkdownBlocks: Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                entries: Record<string, string[]>;
              }
            > = { ...state._cachedMarkdownBlocksById } as Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                entries: Record<string, string[]>;
              }
            >;

            const nextCachedPartByIdx: Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                entries: Record<number, UIMessageParts<UI_MESSAGE>[number]>;
              }
            > = { ...state._cachedPartByIdxById } as Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                entries: Record<number, UIMessageParts<UI_MESSAGE>[number]>;
              }
            >;

            for (const existingId of Object.keys(nextCachedPartTypes)) {
              if (!nextThrottled.some((m) => m.id === existingId)) {
                delete nextCachedPartTypes[existingId];
              }
            }

            for (const existingId of Object.keys(nextCachedPartRanges)) {
              if (!nextThrottled.some((m) => m.id === existingId)) {
                delete nextCachedPartRanges[existingId];
              }
            }

            for (const existingId of Object.keys(nextCachedMarkdownBlocks)) {
              if (!nextThrottled.some((m) => m.id === existingId)) {
                delete nextCachedMarkdownBlocks[existingId];
              }
            }
            for (const existingId of Object.keys(nextCachedPartByIdx)) {
              if (!nextThrottled.some((m) => m.id === existingId)) {
                delete nextCachedPartByIdx[existingId];
              }
            }

            for (const msg of nextThrottled) {
              const current = nextCachedPartTypes[msg.id];
              const { partsRef, types } = extractPartTypes<UI_MESSAGE>(msg);
              if (!current) {
                nextCachedPartTypes[msg.id] = { partsRef, types };
              } else if (current.partsRef !== partsRef) {
                nextCachedPartTypes[msg.id] = {
                  partsRef,
                  types: areArraysShallowEqual(current.types, types)
                    ? current.types
                    : types,
                };
              }

              const currentRanges = nextCachedPartRanges[msg.id];
              if (!currentRanges || currentRanges.partsRef !== partsRef) {
                nextCachedPartRanges[msg.id] = { partsRef, ranges: {} };
              }

              const currentMarkdown = nextCachedMarkdownBlocks[msg.id];
              if (!currentMarkdown) {
                nextCachedMarkdownBlocks[msg.id] = { partsRef, entries: {} };
              }

              const currentPartByIdx = nextCachedPartByIdx[msg.id];
              if (!currentPartByIdx) {
                nextCachedPartByIdx[msg.id] = { partsRef, entries: {} };
              }
            }

            set({
              _throttledMessages: nextThrottled,
              _cachedMessageIds: nextCachedMessageIds as string[] | null,
              _cachedPartTypesById: nextCachedPartTypes,
              _cachedPartRangesById: nextCachedPartRanges,
              _cachedMarkdownBlocksById: nextCachedMarkdownBlocks,
              _cachedPartByIdxById: nextCachedPartByIdx,
            });
          }, MESSAGES_THROTTLE_MS);
        }

        return {
          id: undefined,
          messages: initialMessages,
          status: 'ready',
          error: undefined,
          currentChatHelpers: null,

          // Initialize cached values
          _cachedMessageIds: initialMessages.map((m) => m.id),
          _throttledMessages: [...initialMessages],
          _cachedPartTypesById: initialMessages.reduce(
            (
              acc,
              msg,
            ): Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                types: Array<UIMessagePartType<UI_MESSAGE>>;
              }
            > => {
              const { partsRef, types } = extractPartTypes<UI_MESSAGE>(msg);
              acc[msg.id] = { partsRef, types };
              return acc;
            },
            {} as Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                types: Array<UIMessagePartType<UI_MESSAGE>>;
              }
            >,
          ),
          _cachedPartRangesById: initialMessages.reduce(
            (
              acc,
              msg,
            ): Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                ranges: Record<string, UIMessageParts<UI_MESSAGE>>;
              }
            > => {
              const { partsRef } = extractPartTypes<UI_MESSAGE>(msg);
              acc[msg.id] = { partsRef, ranges: {} };
              return acc;
            },
            {} as Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                ranges: Record<string, UIMessageParts<UI_MESSAGE>>;
              }
            >,
          ),

          _cachedMarkdownBlocksById: initialMessages.reduce(
            (
              acc,
              msg,
            ): Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                entries: Record<string, string[]>;
              }
            > => {
              const { partsRef } = extractPartTypes<UI_MESSAGE>(msg);
              acc[msg.id] = { partsRef, entries: {} };
              return acc;
            },
            {} as Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                entries: Record<string, string[]>;
              }
            >,
          ),

          _cachedPartByIdxById: initialMessages.reduce(
            (
              acc,
              msg,
            ): Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                entries: Record<number, UIMessageParts<UI_MESSAGE>[number]>;
              }
            > => {
              const { partsRef } = extractPartTypes<UI_MESSAGE>(msg);
              acc[msg.id] = { partsRef, entries: {} };
              return acc;
            },
            {} as Record<
              string,
              {
                partsRef: UIMessageParts<UI_MESSAGE>;
                entries: Record<number, UIMessageParts<UI_MESSAGE>[number]>;
              }
            >,
          ),

          setId: (id) => set({ id }),
          setMessages: (messages) => {
            set({
              messages: [...messages],
            });
            throttledMessagesUpdater?.();
          },
          setStatus: (status) => set({ status }),
          setError: (error) => set({ error }),
          setNewChat: (id, messages) => {
            set({
              messages: [...messages],
              status: 'ready',
              error: undefined,
              id,
            });
            throttledMessagesUpdater?.();
          },

          pushMessage: (message) => {
            set((state) => ({
              messages: [...state.messages, message],
            }));
            throttledMessagesUpdater?.();
          },

          popMessage: () => {
            set((state) => ({
              messages: state.messages.slice(0, -1),
            }));
            throttledMessagesUpdater?.();
          },

          replaceMessage: (index, message) => {
            set((state) => ({
              messages: [
                ...state.messages.slice(0, index),
                structuredClone(message), // Deep clone for React Compiler compatibility
                ...state.messages.slice(index + 1),
              ],
            }));
            throttledMessagesUpdater?.();
          },

          setCurrentChatHelpers: (helpers) => {
            set({ currentChatHelpers: helpers });
          },

          getLastMessageId: () => {
            const state = get();
            return state.messages.length > 0
              ? state.messages[state.messages.length - 1].id
              : null;
          },

          getMessageIds: () => {
            const state = get();
            return (
              state._cachedMessageIds ||
              (state._throttledMessages || state.messages).map((m) => m.id)
            );
          },

          getThrottledMessages: () => {
            const state = get();
            return state._throttledMessages || state.messages;
          },

          getInternalMessages: () => {
            const state = get();
            return state.messages;
          },

          getMessagePartTypesById: (messageId) => {
            const state = get();
            const currentEntry = state._cachedPartTypesById[messageId];
            const message = (state._throttledMessages || state.messages).find(
              (msg) => msg.id === messageId,
            );
            if (!message)
              throw new Error(`Message not found for id: ${messageId}`);
            const { partsRef, types } = extractPartTypes<UI_MESSAGE>(message);
            if (!currentEntry) {
              (
                state._cachedPartTypesById as ChatStoreState<UI_MESSAGE>['_cachedPartTypesById']
              )[messageId] = {
                partsRef,
                types,
              } as unknown as ChatStoreState<UI_MESSAGE>['_cachedPartTypesById'][string];
              return types as Array<UIMessagePartType<UI_MESSAGE>>;
            }
            if (currentEntry.partsRef === partsRef) {
              return currentEntry.types as Array<UIMessagePartType<UI_MESSAGE>>;
            }
            const nextTypes = areArraysShallowEqual(currentEntry.types, types)
              ? (currentEntry.types as Array<UIMessagePartType<UI_MESSAGE>>)
              : (types as Array<UIMessagePartType<UI_MESSAGE>>);
            (
              state._cachedPartTypesById as ChatStoreState<UI_MESSAGE>['_cachedPartTypesById']
            )[messageId] = {
              partsRef,
              types: nextTypes as unknown as Array<
                UIMessagePartType<UI_MESSAGE>
              >,
            } as unknown as ChatStoreState<UI_MESSAGE>['_cachedPartTypesById'][string];
            return nextTypes;
          },
          getMessagePartsRangeCached: (messageId, startIdx, endIdx, type?) => {
            const state = get();
            const message = (state._throttledMessages || state.messages).find(
              (msg) => msg.id === messageId,
            );
            if (!message)
              throw new Error(`Message not found for id: ${messageId}`);

            const start = Math.max(0, Math.floor(startIdx));
            const end = Math.min(message.parts.length - 1, Math.floor(endIdx));

            const { partsRef } = extractPartTypes<UI_MESSAGE>(message);
            const entry = state._cachedPartRangesById[messageId];
            const key = `${start}:${end}${
              type !== undefined ? `|${String(type)}` : ''
            }`;

            if (entry && entry.partsRef === partsRef) {
              const hit = entry.ranges[key];
              if (hit)
                return hit as unknown as ReturnType<
                  ChatStoreState<UI_MESSAGE>['getMessagePartsRangeCached']
                >;
            }

            if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
              const empty = [] as unknown as UIMessageParts<UI_MESSAGE>;
              const nextRanges = { ...(entry?.ranges || {}) } as Record<
                string,
                UIMessageParts<UI_MESSAGE>
              >;
              nextRanges[key] = empty;
              (
                state._cachedPartRangesById as ChatStoreState<UI_MESSAGE>['_cachedPartRangesById']
              )[messageId] = { partsRef, ranges: nextRanges };
              return empty as unknown as ReturnType<
                ChatStoreState<UI_MESSAGE>['getMessagePartsRangeCached']
              >;
            }

            const baseSlice = message.parts.slice(start, end + 1);
            const result = (
              type === undefined
                ? baseSlice
                : (baseSlice.filter(
                    (p) => p.type === type,
                  ) as unknown as UIMessageParts<UI_MESSAGE>)
            ) as UIMessageParts<UI_MESSAGE>;

            const nextRanges = { ...(entry?.ranges || {}) } as Record<
              string,
              UIMessageParts<UI_MESSAGE>
            >;
            nextRanges[key] = result as UIMessageParts<UI_MESSAGE>;

            (
              state._cachedPartRangesById as ChatStoreState<UI_MESSAGE>['_cachedPartRangesById']
            )[messageId] = {
              partsRef,
              ranges: nextRanges,
            };

            return result as UIMessageParts<UI_MESSAGE>;
          },

          getMarkdownBlocksForPart: (
            messageId: string,
            partIdx: number,
          ): string[] => {
            const state = get();
            const message = (state._throttledMessages || state.messages).find(
              (msg) => msg.id === messageId,
            );
            if (!message)
              throw new Error(`Message not found for id: ${messageId}`);

            const isLast = partIdx === message.parts.length - 1;
            const selected = message.parts[partIdx] as unknown as
              | {
                  type: string;
                  text?: string;
                }
              | undefined;
            if (!selected)
              throw new Error(
                `Part not found for id: ${messageId} at partIdx: ${partIdx}`,
              );
            if (selected.type !== 'text')
              throw new Error(
                `Part type mismatch for id: ${messageId} at partIdx: ${partIdx}. Expected text, got ${String(
                  selected.type,
                )}`,
              );

            const { partsRef } = extractPartTypes<UI_MESSAGE>(message);
            const entry = state._cachedMarkdownBlocksById[messageId];
            const key = `${partIdx}|${isLast ? 1 : 0}`;
            if (entry && entry.partsRef === partsRef) {
              const hit = entry.entries[key];
              if (hit) return hit;
            }

            function parseIncompleteMarkdown(text: string): string {
              if (!text || typeof text !== 'string') return text;
              let result = text;
              const linkImagePattern = /(!?\[)([^\]]*?)$/;
              const linkMatch = result.match(linkImagePattern);
              if (linkMatch) {
                const startIndex = result.lastIndexOf(linkMatch[1]);
                result = result.substring(0, startIndex);
              }
              const boldPattern = /(\*\*)([^*]*?)$/;
              const boldMatch = result.match(boldPattern);
              if (boldMatch) {
                const asteriskPairs = (result.match(/\*\*/g) || []).length;
                if (asteriskPairs % 2 === 1) result = `${result}**`;
              }
              const italicPattern = /(__)([^_]*?)$/;
              const italicMatch = result.match(italicPattern);
              if (italicMatch) {
                const underscorePairs = (result.match(/__/g) || []).length;
                if (underscorePairs % 2 === 1) result = `${result}__`;
              }
              const singleAsteriskPattern = /(\*)([^*]*?)$/;
              const singleAsteriskMatch = result.match(singleAsteriskPattern);
              if (singleAsteriskMatch) {
                const singleAsterisks = result
                  .split('')
                  .reduce((acc, char, index) => {
                    if (char === '*') {
                      const prevChar = result[index - 1];
                      const nextChar = result[index + 1];
                      if (prevChar !== '*' && nextChar !== '*') return acc + 1;
                    }
                    return acc;
                  }, 0);
                if (singleAsterisks % 2 === 1) result = `${result}*`;
              }
              const singleUnderscorePattern = /(_)([^_]*?)$/;
              const singleUnderscoreMatch = result.match(
                singleUnderscorePattern,
              );
              if (singleUnderscoreMatch) {
                const singleUnderscores = result
                  .split('')
                  .reduce((acc, char, index) => {
                    if (char === '_') {
                      const prevChar = result[index - 1];
                      const nextChar = result[index + 1];
                      if (prevChar !== '_' && nextChar !== '_') return acc + 1;
                    }
                    return acc;
                  }, 0);
                if (singleUnderscores % 2 === 1) result = `${result}_`;
              }
              const inlineCodePattern = /(`)([^`]*?)$/;
              const inlineCodeMatch = result.match(inlineCodePattern);
              if (inlineCodeMatch) {
                const allTripleBackticks = (result.match(/```/g) || []).length;
                const insideIncompleteCodeBlock = allTripleBackticks % 2 === 1;
                if (!insideIncompleteCodeBlock) {
                  let singleBacktickCount = 0;
                  for (let i = 0; i < result.length; i++) {
                    if (result[i] === '`') {
                      const isTripleStart =
                        result.substring(i, i + 3) === '```';
                      const isTripleMiddle =
                        i > 0 && result.substring(i - 1, i + 2) === '```';
                      const isTripleEnd =
                        i > 1 && result.substring(i - 2, i + 1) === '```';
                      if (!isTripleStart && !isTripleMiddle && !isTripleEnd) {
                        singleBacktickCount++;
                      }
                    }
                  }
                  if (singleBacktickCount % 2 === 1) result = `${result}\``;
                }
              }
              const strikethroughPattern = /(~~)([^~]*?)$/;
              const strikethroughMatch = result.match(strikethroughPattern);
              if (strikethroughMatch) {
                const tildePairs = (result.match(/~~/g) || []).length;
                if (tildePairs % 2 === 1) result = `${result}~~`;
              }
              return result;
            }

            const text = selected.text || '';
            const prepared = isLast
              ? parseIncompleteMarkdownForStreaming(text)
              : text;
            const tokens = marked.lexer(prepared);
            const blocks = tokens.map((t) => t.raw as string);

            const previous = entry?.entries[key];
            if (previous && areArraysShallowEqual(previous, blocks)) {
              const nextEntriesStable = { ...(entry?.entries || {}) } as Record<
                string,
                string[]
              >;
              nextEntriesStable[key] = previous;
              (
                state._cachedMarkdownBlocksById as ChatStoreState<UI_MESSAGE>['_cachedMarkdownBlocksById']
              )[messageId] = { partsRef, entries: nextEntriesStable };
              return previous as string[];
            }

            const nextEntries = { ...(entry?.entries || {}) } as Record<
              string,
              string[]
            >;
            nextEntries[key] = blocks;
            (
              state._cachedMarkdownBlocksById as ChatStoreState<UI_MESSAGE>['_cachedMarkdownBlocksById']
            )[messageId] = { partsRef, entries: nextEntries };

            return blocks as string[];
          },

          getMarkdownBlockCountForPart: (
            messageId: string,
            partIdx: number,
          ): number => {
            const state = get();
            const message = (state._throttledMessages || state.messages).find(
              (msg) => msg.id === messageId,
            );
            if (!message)
              throw new Error(`Message not found for id: ${messageId}`);

            const isLast = partIdx === message.parts.length - 1;
            const selected = message.parts[partIdx] as unknown as
              | { type: string; text?: string }
              | undefined;
            if (!selected)
              throw new Error(
                `Part not found for id: ${messageId} at partIdx: ${partIdx}`,
              );
            if (selected.type !== 'text')
              throw new Error(
                `Part type mismatch for id: ${messageId} at partIdx: ${partIdx}. Expected text, got ${String(
                  selected.type,
                )}`,
              );

            const text = selected.text || '';
            const prepared = isLast
              ? parseIncompleteMarkdownForStreaming(text)
              : text;
            const tokens = marked.lexer(prepared);
            const blockCount = tokens.length;
            const PREALLOCATED_BLOCKS = 100;
            return Math.max(PREALLOCATED_BLOCKS, blockCount);
          },

          getMarkdownBlockByIndex: (
            messageId: string,
            partIdx: number,
            blockIdx: number,
          ): string | null => {
            const state = get();
            const message = (state._throttledMessages || state.messages).find(
              (msg) => msg.id === messageId,
            );
            if (!message)
              throw new Error(`Message not found for id: ${messageId}`);

            const isLast = partIdx === message.parts.length - 1;
            const selected = message.parts[partIdx] as unknown as
              | { type: string; text?: string }
              | undefined;
            if (!selected)
              throw new Error(
                `Part not found for id: ${messageId} at partIdx: ${partIdx}`,
              );
            if (selected.type !== 'text')
              throw new Error(
                `Part type mismatch for id: ${messageId} at partIdx: ${partIdx}. Expected text, got ${String(
                  selected.type,
                )}`,
              );

            const text = selected.text || '';
            const prepared = isLast
              ? parseIncompleteMarkdownForStreaming(text)
              : text;
            const tokens = marked.lexer(prepared);
            const blocks = tokens.map((t) => t.raw as string);
            if (blockIdx < 0 || blockIdx >= blocks.length) return null;
            return blocks[blockIdx] ?? null;
          },

          getMessagePartByIdxCached: (messageId: string, partIdx: number) => {
            const state = get();
            const message = (state._throttledMessages || state.messages).find(
              (msg) => msg.id === messageId,
            );
            if (!message)
              throw new Error(`Message not found for id: ${messageId}`);

            const { partsRef } = extractPartTypes<UI_MESSAGE>(message);
            const entry = state._cachedPartByIdxById[messageId];
            if (entry && entry.partsRef === partsRef) {
              const hit = entry.entries[partIdx];
              if (hit !== undefined) return hit;
            }

            const selected = message.parts[partIdx];
            if (selected === undefined)
              throw new Error(
                `Part not found for id: ${messageId} at partIdx: ${partIdx}`,
              );

            const nextEntries = { ...(entry?.entries || {}) } as Record<
              number,
              UIMessageParts<UI_MESSAGE>[number]
            >;
            nextEntries[partIdx] =
              selected as UIMessageParts<UI_MESSAGE>[number];
            (
              state._cachedPartByIdxById as ChatStoreState<UI_MESSAGE>['_cachedPartByIdxById']
            )[messageId] = { partsRef, entries: nextEntries };

            return selected as UIMessageParts<UI_MESSAGE>[number];
          },
        };
      }),
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

    // Subscribe to throttled messages changes and notify React callbacks
    this.store.subscribe(
      (state) => state._throttledMessages,
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
    const callback = throttleWaitMs
      ? throttle(onChange, throttleWaitMs)
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

  // Expose store as public property
  get storeInstance() {
    return this.store;
  }
}

export const chatStore = createChatStore<ChatMessage>();

// Create singleton state instance
export const chatState = new ZustandChatState(chatStore);

// Selector hooks for cleaner API - these use throttled messages
export const useChatMessages = () =>
  chatStore(useShallow((state) => state.getThrottledMessages()));
export const useChatStatus = () => chatStore((state) => state.status);
export const useChatError = () => chatStore((state) => state.error);
export const useChatId = () => chatStore((state) => state.id);

export const useMessageIds = () =>
  chatStore(useShallow((state) => state.getMessageIds()));

export const useMessageById = (messageId: string): ChatMessage =>
  chatStore((state) => {
    const message = state
      .getThrottledMessages()
      .find((msg) => msg.id === messageId);
    if (!message) throw new Error(`Message not found for id: ${messageId}`);
    return message;
  });

// Selector for only the message role; re-renders only when role value changes
export const useMessageRoleById = (messageId: string): ChatMessage['role'] =>
  chatStore((state) => {
    const message = state
      .getThrottledMessages()
      .find((msg) => msg.id === messageId);
    if (!message) throw new Error(`Message not found for id: ${messageId}`);
    return message.role;
  });

export const useMessagePartsById = (messageId: string): ChatMessage['parts'] =>
  chatStore(
    useShallow((state) => {
      const message = state
        .getThrottledMessages()
        .find((msg) => msg.id === messageId);
      if (!message) throw new Error(`Message not found for id: ${messageId}`);
      return message.parts;
    }),
  );

export const useMessageMetadataById = (
  messageId: string,
): ChatMessage['metadata'] =>
  chatStore(
    useShallow((state) => {
      const message = state
        .getThrottledMessages()
        .find((msg) => msg.id === messageId);
      if (!message) throw new Error(`Message not found for id: ${messageId}`);
      return message.metadata;
    }),
  );

// Selector for only the part types of a message
export const useMessagePartTypesById = (
  messageId: string,
): Array<ChatMessage['parts'][number]['type']> =>
  chatStore(useShallow((state) => state.getMessagePartTypesById(messageId)));

// Selector for a specific part by its index within the message parts
export function useMessagePartByPartIdx(
  messageId: string,
  partIdx: number,
): ChatMessage['parts'][number];
export function useMessagePartByPartIdx<
  T extends ChatMessage['parts'][number]['type'],
>(
  messageId: string,
  partIdx: number,
  type: T,
): Extract<ChatMessage['parts'][number], { type: T }>;
export function useMessagePartByPartIdx<
  T extends ChatMessage['parts'][number]['type'],
>(messageId: string, partIdx: number, type?: T) {
  const part = chatStore((state) =>
    state.getMessagePartByIdxCached(messageId, partIdx),
  );

  if (type !== undefined) {
    if (part.type !== type) {
      throw new Error(
        `Part type mismatch for id: ${messageId} at partIdx: ${partIdx}. Expected ${String(
          type,
        )}, got ${String(part.type)}`,
      );
    }
  }

  return part as unknown as T extends ChatMessage['parts'][number]['type']
    ? Extract<ChatMessage['parts'][number], { type: T }>
    : ChatMessage['parts'][number];
}

// Selector for a contiguous range of parts (inclusive of startIdx and endIdx)
export function useMessagePartsByPartRange(
  messageId: string,
  startIdx: number,
  endIdx: number,
): ChatMessage['parts'];
export function useMessagePartsByPartRange<
  T extends ChatMessage['parts'][number]['type'],
>(
  messageId: string,
  startIdx: number,
  endIdx: number,
  type: T,
): Array<Extract<ChatMessage['parts'][number], { type: T }>>;
export function useMessagePartsByPartRange<
  T extends ChatMessage['parts'][number]['type'],
>(messageId: string, startIdx: number, endIdx: number, type?: T) {
  return chatStore(
    useShallow(
      (state) =>
        state.getMessagePartsRangeCached(
          messageId,
          startIdx,
          endIdx,
          type as unknown as string | undefined,
        ) as unknown as ChatMessage['parts'],
    ),
  ) as unknown as T extends ChatMessage['parts'][number]['type']
    ? Array<Extract<ChatMessage['parts'][number], { type: T }>>
    : ChatMessage['parts'];
}

// Internal messages hook for immediate access (no throttling)
export const useInternalMessages = () =>
  chatStore(useShallow((state) => state.getInternalMessages()));

// Action hooks for cleaner API
export const useChatActions = () =>
  chatStore(
    useShallow((state) => ({
      setMessages: state.setMessages,
      pushMessage: state.pushMessage,
      popMessage: state.popMessage,
      replaceMessage: state.replaceMessage,
      setStatus: state.setStatus,
      setError: state.setError,
      setId: state.setId,
      setNewChat: state.setNewChat,
    })),
  );

// Convenience hook for just setMessages
export const useSetMessages = () => chatStore((state) => state.setMessages);

// Markdown blocks selector hook for Response/other renderers
export const useMarkdownBlocksForPart = (messageId: string, partIdx: number) =>
  chatStore(
    useShallow((state) => state.getMarkdownBlocksForPart(messageId, partIdx)),
  );

export const useMarkdownBlockIndexesForPart = (
  messageId: string,
  partIdx: number,
) =>
  chatStore((state) => state.getMarkdownBlockCountForPart(messageId, partIdx));

export const useMarkdownBlockCountForPart = (
  messageId: string,
  partIdx: number,
) =>
  chatStore((state) => state.getMarkdownBlockCountForPart(messageId, partIdx));

export const useMarkdownBlockByIndex = (
  messageId: string,
  partIdx: number,
  blockIdx: number,
) =>
  chatStore((state) =>
    state.getMarkdownBlockByIndex(messageId, partIdx, blockIdx),
  );

// Selector for sendMessage helper
export const useSendMessage = () =>
  chatStore((state) => state.currentChatHelpers?.sendMessage);

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
    super({ ...init, id, state });
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
