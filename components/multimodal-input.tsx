'use client';

import type { Attachment } from 'ai';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { AttachmentList } from './attachment-list';
import { Button } from './ui/button';
import {
  ChatInputContainer,
  ChatInputTopRow,
  ChatInputTextArea,
  ChatInputBottomRow,
} from './ui/chat-input';
import { SuggestedActions } from './suggested-actions';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { YourUIMessage } from '@/lib/ai/tools/annotations';
import { Toggle } from './ui/toggle';
import { GlobeIcon, Lightbulb, Telescope, Settings2 } from 'lucide-react';
import type { ChatRequestData } from '@/app/(chat)/api/chat/route';
import { ModelSelector } from './model-selector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Separator } from './ui/separator';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  data,
  setData,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  isEditMode = false,
  selectedModelId,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  data: ChatRequestData;
  setData: Dispatch<SetStateAction<ChatRequestData>>;
  messages: Array<YourUIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
  isEditMode?: boolean;
  selectedModelId: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
      data,
    });

    setAttachments([]);
    setLocalStorageInput('');
    setData({
      deepResearch: false,
      webSearch: false,
      reason: false,
    });

    // TODO: Is it needed to refocus every time this function is called?
    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setData,
    setLocalStorageInput,
    width,
    chatId,
    data,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  const removeAttachment = useCallback(
    (attachmentToRemove: Attachment) => {
      setAttachments((currentAttachments) =>
        currentAttachments.filter(
          (attachment) => attachment.url !== attachmentToRemove.url,
        ),
      );
    },
    [setAttachments],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      setUploadQueue(acceptedFiles.map((file) => file.name));

      try {
        const uploadPromises = acceptedFiles.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    noClick: true, // Prevent click to open file dialog since we have the button
    disabled: status !== 'ready',
  });

  return (
    <div className="relative w-full flex flex-col gap-4">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 &&
        !isEditMode && <SuggestedActions append={append} chatId={chatId} />}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <div className="relative">
        <ChatInputContainer
          className={`${className} transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''
          }`}
          {...getRootProps()}
        >
          <input {...getInputProps()} />

          {isDragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-950/40 border-2 border-dashed border-blue-500 rounded-2xl z-10">
              <div className="text-blue-600 dark:text-blue-400 font-medium">
                Drop files here to attach
              </div>
            </div>
          )}

          <motion.div
            animate={{
              height:
                attachments.length > 0 || uploadQueue.length > 0 ? 'auto' : 0,
              opacity: attachments.length > 0 || uploadQueue.length > 0 ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <ChatInputTopRow>
              {(attachments.length > 0 || uploadQueue.length > 0) && (
                <AttachmentList
                  attachments={attachments}
                  uploadQueue={uploadQueue}
                  onRemove={removeAttachment}
                  testId="attachments-preview"
                  className="px-3 py-2"
                />
              )}
            </ChatInputTopRow>
          </motion.div>

          <ChatInputTextArea
            data-testid="multimodal-input"
            ref={textareaRef}
            placeholder="Send a message..."
            value={input}
            onChange={handleInput}
            maxRows={15}
            autoFocus
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();

                if (status !== 'ready') {
                  toast.error(
                    'Please wait for the model to finish its response!',
                  );
                } else {
                  submitForm();
                }
              }
            }}
          />

          <ChatInputBottomRow className="@container flex flex-row justify-between">
            <div className="flex items-center gap-2">
              <ModelSelector
                selectedModelId={selectedModelId}
                className="h-fit"
              />
              <ResponsiveToggles
                data={data}
                setData={setData}
                selectedModelId={selectedModelId}
              />
            </div>
            <div className="flex items-center gap-2">
              <AttachmentsButton fileInputRef={fileInputRef} status={status} />
              {status === 'submitted' ? (
                <StopButton stop={stop} setMessages={setMessages} />
              ) : (
                <SendButton
                  input={input}
                  submitForm={submitForm}
                  uploadQueue={uploadQueue}
                />
              )}
            </div>
          </ChatInputBottomRow>
        </ChatInputContainer>
      </div>
    </div>
  );
}

function WebSearchToggle({
  enabled,
  setEnabled,
}: { enabled: boolean; setEnabled: (enabled: boolean) => void }) {
  return (
    <Toggle
      pressed={enabled}
      onPressedChange={setEnabled}
      variant="outline"
      size="sm"
      className="gap-2 p-1.5 px-2.5 h-fit border-zinc-700 rounded-full items-center"
    >
      <GlobeIcon size={14} />
      Web search
    </Toggle>
  );
}

function DeepResearchToggle({
  enabled,
  setEnabled,
}: { enabled: boolean; setEnabled: (enabled: boolean) => void }) {
  return (
    <Toggle
      pressed={enabled}
      onPressedChange={setEnabled}
      variant="outline"
      size="sm"
      className="gap-2 p-1.5 px-2.5 h-fit border-zinc-700 rounded-full items-center"
    >
      <Telescope size={14} />
      Deep research
    </Toggle>
  );
}

function ReasonSearchToggle({
  enabled,
  setEnabled,
}: { enabled: boolean; setEnabled: (enabled: boolean) => void }) {
  return (
    <Toggle
      pressed={enabled}
      onPressedChange={setEnabled}
      variant="outline"
      size="sm"
      className="gap-2 p-1.5 px-2.5 h-fit border-zinc-700 rounded-full items-center"
    >
      <Lightbulb size={14} />
      Reason
    </Toggle>
  );
}

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="rounded-md p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.submitForm !== nextProps.submitForm) return false;
  return true;
});

function ResponsiveToggles({
  data,
  setData,
  selectedModelId,
}: {
  data: ChatRequestData;
  setData: Dispatch<SetStateAction<ChatRequestData>>;
  selectedModelId: string;
}) {
  const activeTool = data.webSearch
    ? 'webSearch'
    : data.deepResearch
      ? 'deepResearch'
      : data.reason
        ? 'reason'
        : null;

  const setTool = (tool: 'webSearch' | 'deepResearch' | 'reason' | null) => {
    setData({
      webSearch: tool === 'webSearch',
      deepResearch: tool === 'deepResearch',
      reason: tool === 'reason',
    });
  };

  return (
    <>
      {/* Compact layout for narrow containers */}
      <div className="flex items-center gap-2 @[500px]:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 p-1.5 px-2.5 h-fit rounded-full"
            >
              <Settings2 size={14} />
              <span className="hidden @[400px]:inline">Tools</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={() => setTool(data.webSearch ? null : 'webSearch')}
              className="flex items-center gap-2"
            >
              <GlobeIcon size={14} />
              <span>Web search</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTool(data.deepResearch ? null : 'deepResearch')}
              className="flex items-center gap-2"
            >
              <Telescope size={14} />
              <span>Deep research</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Show active tool as dismissable pill */}
        {activeTool && (
          <>
            <Separator
              orientation="vertical"
              className="bg-muted-foreground/50 h-4"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTool(null)}
              className="gap-2 p-1.5 px-2.5 h-fit rounded-full"
            >
              {activeTool === 'webSearch' && <GlobeIcon size={14} />}
              {activeTool === 'deepResearch' && <Telescope size={14} />}
              <span className="hidden @[400px]:inline">
                {activeTool === 'webSearch' && 'Web search'}
                {activeTool === 'deepResearch' && 'Deep research'}
              </span>
              <span className="text-xs opacity-70">×</span>
            </Button>
          </>
        )}
      </div>

      {/* Full layout for wider containers */}
      <div className="hidden @[500px]:flex items-center gap-2">
        <WebSearchToggle
          enabled={data.webSearch}
          setEnabled={(enabled) => setTool(enabled ? 'webSearch' : null)}
        />
        <DeepResearchToggle
          enabled={data.deepResearch}
          setEnabled={(enabled) => setTool(enabled ? 'deepResearch' : null)}
        />
        {/* <ReasonSearchToggle
          enabled={data.reason}
          setEnabled={(enabled) => setTool(enabled ? 'reason' : null)}
        /> */}
      </div>
    </>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.data !== nextProps.data) return false;
    if (prevProps.isEditMode !== nextProps.isEditMode) return false;
    if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
    return true;
  },
);
