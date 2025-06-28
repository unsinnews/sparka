'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageName ?? 'Expanded image'}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
      </DialogContent>
    </Dialog>
  );
}