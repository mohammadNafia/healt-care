'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QualityAlertProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function QualityAlert({ message, onRetry, className }: QualityAlertProps) {
  return (
    <div className={cn('backdrop-blur-xl bg-yellow-50/80 rounded-2xl p-5 shadow-xl border-2 border-yellow-200/60', className)}>
      <div className="flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-base font-semibold text-gray-900 mb-2">
            Image Quality Alert
          </p>
          <p className="text-sm text-gray-800 mb-4 font-light leading-relaxed">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Retry Scan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
