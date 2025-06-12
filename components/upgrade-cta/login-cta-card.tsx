'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoginCtaCardProps {
  title: string;
  description: string;
  className?: string;
  variant?: 'default' | 'amber' | 'red';
  dismissible?: boolean;
  showIcon?: boolean;
}

export function LoginCtaCard({
  title,
  description,
  className,
  variant = 'default',
  dismissible = false,
  showIcon = true,
}: LoginCtaCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const variantStyles = {
    default:
      'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    amber:
      'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    red: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
  };

  const textStyles = {
    default: 'text-blue-800 dark:text-blue-200',
    amber: 'text-amber-800 dark:text-amber-200',
    red: 'text-red-800 dark:text-red-200',
  };

  const linkStyles = {
    default:
      'text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100',
    amber:
      'text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100',
    red: 'text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={cn(variantStyles[variant], className)}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {showIcon && (
                  <LogIn
                    className={cn(
                      'h-5 w-5 mt-0.5 flex-shrink-0',
                      textStyles[variant],
                    )}
                  />
                )}
                <div className="space-y-1">
                  <h4
                    className={cn('font-medium text-sm', textStyles[variant])}
                  >
                    {title}
                  </h4>
                  <div className="flex items-start gap-2 flex-col">
                    <p className={cn('text-sm', textStyles[variant])}>
                      {description}{' '}
                    </p>
                    <Link
                      href="/login"
                      className={cn(
                        'underline font-medium hover:no-underline',
                        linkStyles[variant],
                      )}
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
              {dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-transparent opacity-70 hover:opacity-100"
                  onClick={() => setDismissed(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
