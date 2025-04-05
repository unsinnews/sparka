'use client';

import { useState } from 'react';
import { LockIcon, KeyIcon, Loader2Icon, ShieldCheckIcon } from 'lucide-react';

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
import { config } from '@/lib/config';

interface ApiKeyDialogProps {
  show: boolean;
  onClose: (open: boolean) => void;
  onSuccess: () => void;
}

interface ApiKeyInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  description: string;
  linkText: string;
  linkUrl: string;
}

function ApiKeyInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  description,
  linkText,
  linkUrl,
}: ApiKeyInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent-foreground hover:text-accent-foreground/80 underline"
        >
          {linkText} →
        </a>
      </div>
      <div className="relative">
        <Input
          id={id}
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10 font-mono text-sm bg-background/50 border-border focus:border-ring focus:ring-ring h-9 sm:h-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <LockIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function ApiKeyDialog({ show, onClose, onSuccess }: ApiKeyDialogProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [firecrawlKey, setFirecrawlKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApiKeySubmit = async () => {
    if (!openaiKey || !firecrawlKey) return;
    setLoading(true);
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openaiKey, firecrawlKey }),
    });
    if (res.ok) {
      onClose(false);
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[95%] h-[90vh] sm:h-auto overflow-y-auto bg-background/80 backdrop-blur-xl border border-border shadow-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl mb-2 sm:mb-4 font-bold text-foreground">
            Open Deep Research
          </DialogTitle>
          <DialogDescription className="text-muted-foreground space-y-3 sm:space-y-4 mt-2 sm:mt-4">
            <div className="bg-muted border border-border rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-foreground mb-2 flex items-center text-sm sm:text-base">
                <KeyIcon className="w-4 h-4 mr-2" />
                Secure API Key Setup
              </h3>
              <p className="text-xs text-muted-foreground">
                To perform research, you'll need to provide your API keys. These
                keys are stored securely using HTTP-only cookies and are never
                exposed to client-side JavaScript.
              </p>
              <div className="mt-3 flex flex-col space-y-2 text-xs">
                <div className="text-muted-foreground">
                  <p>
                    <span className="font-medium">Self-hosting option:</span>{' '}
                    You can clone the repository and host this application on
                    your own infrastructure. This gives you complete control
                    over your data and API key management.
                  </p>
                  <a
                    href={config.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View self-hosting instructions
                    <svg
                      className="w-3 h-3 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApiKeySubmit();
          }}
          className="space-y-4 sm:space-y-6 py-2 sm:py-4"
        >
          <div className="space-y-4">
            <ApiKeyInput
              id="openai-key"
              label="OpenAI API Key"
              value={openaiKey}
              onChange={setOpenaiKey}
              placeholder="sk-..."
              description="Powers our advanced language models for research analysis and synthesis."
              linkText="Get your OpenAI key"
              linkUrl="https://platform.openai.com/api-keys"
            />

            <ApiKeyInput
              id="firecrawl-key"
              label="FireCrawl API Key"
              value={firecrawlKey}
              onChange={setFirecrawlKey}
              placeholder="fc-..."
              description="Enables real-time web crawling and data gathering capabilities."
              linkText="Get your FireCrawl key"
              linkUrl="https://www.firecrawl.dev/app/api-keys"
            />
          </div>
        </form>
        <DialogFooter className="flex-col sm:flex-row gap-3 sm:justify-between mt-4">
          <div className="flex items-center text-xs text-muted-foreground justify-center sm:justify-start">
            <ShieldCheckIcon className="w-4 h-4 mr-1 text-muted-foreground" />
            Your keys are stored securely
          </div>
          <Button
            type="submit"
            onClick={handleApiKeySubmit}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
            disabled={!openaiKey || !firecrawlKey || loading}
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
      </DialogContent>
    </Dialog>
  );
}
