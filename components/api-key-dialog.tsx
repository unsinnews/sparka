'use client';

import { useState } from 'react';
import { LockIcon, Loader2Icon, ShieldCheckIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SecureKeysDisclaimer } from './secure-keys-disclaimer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface ApiKeyDialogProps {
  show: boolean;
  onClose: (open: boolean) => void;
  onSuccess: () => void;
}

interface ApiKeyInputProps {
  id: string;
  label: string;
  placeholder: string;
  description: string;
  linkText: string;
  linkUrl: string;
  control: any;
  name: string;
}

const API_KEY_CONFIGS = [
  {
    id: 'openaiKey',
    label: 'OpenAI API Key',
    placeholder: 'sk-...',
    description:
      'Powers our advanced language models for research analysis and synthesis.',
    linkText: 'Get your OpenAI key',
    linkUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'firecrawlKey',
    label: 'FireCrawl API Key',
    placeholder: 'fc-...',
    description:
      'Enables real-time web crawling and data gathering capabilities.',
    linkText: 'Get your FireCrawl key',
    linkUrl: 'https://www.firecrawl.dev/app/api-keys',
  },
];

// Define form schema with Zod
const formSchema = z.object({
  openaiKey: z.string().min(1, { message: 'OpenAI API key is required' }),
  firecrawlKey: z.string().min(1, { message: 'FireCrawl API key is required' }),
});

type FormValues = z.infer<typeof formSchema>;

const ApiKeyInput = ({
  id,
  label,
  placeholder,
  description,
  linkText,
  linkUrl,
  control,
  name,
}: ApiKeyInputProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex justify-between items-center">
            <FormLabel className="text-sm font-medium text-foreground">
              {label}
            </FormLabel>
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent-foreground hover:text-accent-foreground/80 underline"
            >
              {linkText} →
            </a>
          </div>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type="password"
                placeholder={placeholder}
                className="pr-10 font-mono text-sm bg-background/50 border-border focus:border-ring focus:ring-ring h-9 sm:h-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <LockIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </FormControl>
          <p className="text-xs text-muted-foreground">{description}</p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export function ApiKeyDialog({ show, onClose, onSuccess }: ApiKeyDialogProps) {
  const [loading, setLoading] = useState(false);

  // Initialize React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      openaiKey: '',
      firecrawlKey: '',
    },
  });

  const handleApiKeySubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        onClose(false);
        onSuccess();
      } else {
        const errorData = await res.json();
        // Handle validation errors from the server
        if (errorData.errors) {
          Object.entries(errorData.errors).forEach(([field, message]) => {
            form.setError(field as keyof FormValues, {
              message: message as string,
            });
          });
        }
      }
    } catch (error) {
      console.error('Error saving API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[95%] h-[90vh] sm:h-auto overflow-y-auto bg-background/80 backdrop-blur-xl border border-border shadow-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl mb-2 sm:mb-4 font-bold text-foreground">
            Open Deep Research
          </DialogTitle>
          <DialogDescription className="text-muted-foreground space-y-3 sm:space-y-4 mt-2 sm:mt-4">
            <SecureKeysDisclaimer />
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleApiKeySubmit)}
            className="space-y-4 sm:space-y-6 py-2 sm:py-4"
          >
            <div className="space-y-4">
              <ApiKeyInput
                id="openaiKey"
                name="openaiKey"
                label={API_KEY_CONFIGS[0].label}
                placeholder={API_KEY_CONFIGS[0].placeholder}
                description={API_KEY_CONFIGS[0].description}
                linkText={API_KEY_CONFIGS[0].linkText}
                linkUrl={API_KEY_CONFIGS[0].linkUrl}
                control={form.control}
              />
              <ApiKeyInput
                id="firecrawlKey"
                name="firecrawlKey"
                label={API_KEY_CONFIGS[1].label}
                placeholder={API_KEY_CONFIGS[1].placeholder}
                description={API_KEY_CONFIGS[1].description}
                linkText={API_KEY_CONFIGS[1].linkText}
                linkUrl={API_KEY_CONFIGS[1].linkUrl}
                control={form.control}
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3 sm:justify-between mt-4">
              <div className="flex items-center text-xs text-muted-foreground justify-center sm:justify-start">
                <ShieldCheckIcon className="w-4 h-4 mr-1 text-muted-foreground" />
                Your keys are stored securely
              </div>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </div>
                ) : (
                  'Start Researching'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
