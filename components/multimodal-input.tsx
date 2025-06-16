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
import { useSession } from 'next-auth/react';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { AttachmentList } from './attachment-list';
import { Button } from './ui/button';
import {
  ChatInputContainer,
  ChatInputTopRow,
  ChatInputTextArea,
  ChatInputBottomRow,
  type ChatInputTextAreaRef,
} from './ui/chat-input';
import { SuggestedActions } from './suggested-actions';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { YourUIMessage } from '@/lib/types/ui';
import type { ChatRequestData } from '@/app/(chat)/api/chat/route';
import { ModelSelector } from './model-selector';
import { ResponsiveToggles } from './chat-toggles';
import { ScrollArea } from './ui/scroll-area';
import {
  getModelDefinition,
  DEFAULT_PDF_MODEL,
  DEFAULT_IMAGE_MODEL,
} from '@/lib/ai/all-models';
import { MessageLimitDisplay } from './upgrade-cta/message-limit-display';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { LoginPrompt } from './upgrade-cta/login-prompt';

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
  onModelChange,
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
  onModelChange?: (modelId: string) => void;
}) {
  const textareaRef = useRef<ChatInputTextAreaRef>(null);
  const { width } = useWindowSize();

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration, but only use localStorage if not in edit mode
      const finalValue =
        domValue || (!isEditMode ? localStorageInput : '') || '';
      setInput(finalValue);
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Only save to localStorage if not in edit mode
    if (!isEditMode) {
      setLocalStorageInput(input);
    }

    // Reset height when input is cleared
    if (input === '' && textareaRef.current?.adjustHeight) {
      setTimeout(() => {
        textareaRef.current?.adjustHeight();
      }, 0);
    }
  }, [input, setLocalStorageInput, isEditMode]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  // Handle model changes and disable deep research if switching to reasoning model
  const handleModelChange = useCallback(
    (modelId: string) => {
      const modelDef = getModelDefinition(modelId as any);
      const hasReasoning = modelDef.features?.reasoning === true;

      // If switching to a reasoning model and deep research is enabled, disable it
      if (hasReasoning && data.deepResearch) {
        setData((prev) => ({
          ...prev,
          deepResearch: false,
        }));
      }

      // Call the original model change handler
      onModelChange?.(modelId);
    },
    [data.deepResearch, setData, onModelChange],
  );

  // Helper function to auto-switch to PDF-compatible model
  const switchToPdfCompatibleModel = useCallback(() => {
    const defaultPdfModelDef = getModelDefinition(DEFAULT_PDF_MODEL);
    toast.success(`Switched to ${defaultPdfModelDef.name} (supports PDF)`);
    onModelChange?.(DEFAULT_PDF_MODEL);
    return defaultPdfModelDef;
  }, [onModelChange]);

  // Helper function to auto-switch to image-compatible model
  const switchToImageCompatibleModel = useCallback(() => {
    const defaultImageModelDef = getModelDefinition(DEFAULT_IMAGE_MODEL);
    toast.success(`Switched to ${defaultImageModelDef.name} (supports images)`);
    onModelChange?.(DEFAULT_IMAGE_MODEL);
    return defaultImageModelDef;
  }, [onModelChange]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  // Helper function to process and validate files
  const processFiles = useCallback(
    (files: File[]) => {
      const imageFiles: File[] = [];
      const pdfFiles: File[] = [];
      const oversizedFiles: File[] = [];
      const unsupportedFiles: File[] = [];
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

      files.forEach((file) => {
        // Check file size first
        if (file.size > MAX_FILE_SIZE) {
          oversizedFiles.push(file);
          return;
        }

        // Then check file type
        if (file.type.startsWith('image/')) {
          imageFiles.push(file);
        } else if (file.type === 'application/pdf') {
          pdfFiles.push(file);
        } else {
          unsupportedFiles.push(file);
        }
      });

      // Show error messages for invalid files
      if (oversizedFiles.length > 0) {
        toast.error(`${oversizedFiles.length} file(s) exceed 5MB limit`);
      }
      if (unsupportedFiles.length > 0) {
        toast.error(
          `${unsupportedFiles.length} unsupported file type(s). Only images and PDFs are allowed`,
        );
      }

      // Auto-switch model based on file types
      if (pdfFiles.length > 0 || imageFiles.length > 0) {
        let currentModelDef = getModelDefinition(selectedModelId);

        // First check PDF support if PDFs are present
        if (pdfFiles.length > 0 && !currentModelDef.features?.input?.pdf) {
          currentModelDef = switchToPdfCompatibleModel();
        }

        // Then check image support if images are present (using potentially updated model)
        if (imageFiles.length > 0 && !currentModelDef.features?.input?.image) {
          currentModelDef = switchToImageCompatibleModel();
        }
      }

      return [...imageFiles, ...pdfFiles];
    },
    [selectedModelId, switchToPdfCompatibleModel, switchToImageCompatibleModel],
  );

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
      data,
    });

    setAttachments([]);
    if (!isEditMode) {
      setLocalStorageInput('');
    }
    setData({
      deepResearch: false,
      webSearch: false,
      reason: false,
    });

    // Reset textarea height after form submission
    setTimeout(() => {
      textareaRef.current?.adjustHeight();
    }, 0);

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
    isEditMode,
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
      const validFiles = processFiles(files);

      if (validFiles.length === 0) return;

      setUploadQueue(validFiles.map((file) => file.name));

      try {
        const uploadPromises = validFiles.map((file) => uploadFile(file));
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
    [setAttachments, processFiles],
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

      const validFiles = processFiles(acceptedFiles);
      if (validFiles.length === 0) return;

      setUploadQueue(validFiles.map((file) => file.name));

      try {
        const uploadPromises = validFiles.map((file) => uploadFile(file));
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
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
    },
  });

  return (
    <div className="relative w-full flex flex-col gap-4">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 &&
        !isEditMode && <SuggestedActions append={append} chatId={chatId} />}

      {!isEditMode && <MessageLimitDisplay />}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        accept="image/*,.pdf"
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
                Drop images or PDFs here to attach
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

          <ScrollArea className="max-h-[70vh]">
            <ChatInputTextArea
              data-testid="multimodal-input"
              ref={textareaRef}
              placeholder="Send a message..."
              value={input}
              onChange={handleInput}
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
          </ScrollArea>

          <ChatInputBottomRow className="@container flex flex-row justify-between">
            <div className="flex items-center gap-2">
              <ModelSelector
                selectedModelId={selectedModelId}
                className="h-fit"
                onModelChange={handleModelChange}
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

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  const { data: session } = useSession();
  const isAnonymous = !session?.user;
  const [showLoginPopover, setShowLoginPopover] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isAnonymous) {
      setShowLoginPopover(true);
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <Popover open={showLoginPopover} onOpenChange={setShowLoginPopover}>
      <PopoverTrigger asChild>
        <Button
          data-testid="attachments-button"
          className="rounded-md p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
          onClick={handleClick}
          disabled={status !== 'ready'}
          variant="ghost"
        >
          <PaperclipIcon size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <LoginPrompt
          title="Sign in to attach files"
          description="You can attach images and PDFs to your messages for the AI to analyze."
        />
      </PopoverContent>
    </Popover>
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

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.data !== nextProps.data) return false;
    if (prevProps.isEditMode !== nextProps.isEditMode) return false;
    if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
    if (prevProps.onModelChange !== nextProps.onModelChange) return false;
    return true;
  },
);
