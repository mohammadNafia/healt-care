'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DiagnosticCanvasProps {
  imageUrl: string | null;
  isAnalyzing: boolean;
  className?: string;
}

export function DiagnosticCanvas({
  imageUrl,
  isAnalyzing,
  className,
}: DiagnosticCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanLinePosition, setScanLinePosition] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setScanLinePosition(0);
      return;
    }

    const interval = setInterval(() => {
      setScanLinePosition((prev) => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  if (!imageUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-secondary rounded-lg',
          className
        )}
      >
        <p className="text-muted-foreground">No image uploaded</p>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      <img
        src={imageUrl}
        alt="Skin scan"
        className="w-full h-full object-cover"
      />
      {isAnalyzing && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to right, transparent 0%, rgba(13, 148, 136, 0.3) ${scanLinePosition}%, transparent ${scanLinePosition + 5}%)`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  );
}
