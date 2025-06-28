'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CrossIcon } from './icons';
import { Button } from '@/components/ui/button';
import type React from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
}

export function ImageModal({ isOpen, onClose, imageUrl, imageName }: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-none bg-transparent shadow-none">
        <div className="relative">
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            className="absolute -top-12 right-0 z-10 rounded-full p-2 bg-black/50 hover:bg-black/70 text-white border-none"
          >
            <CrossIcon size={16} />
            <span className="sr-only">Close</span>
          </Button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageName ?? 'Expanded image'}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}