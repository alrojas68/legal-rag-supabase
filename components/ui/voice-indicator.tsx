import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceIndicatorProps {
  isListening: boolean;
  className?: string;
}

export function VoiceIndicator({ isListening, className = '' }: VoiceIndicatorProps) {
  if (!isListening) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse ${className}`}>
      <div className="relative">
        <Mic className="w-5 h-5" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></div>
      </div>
      <span className="text-sm font-medium">Grabando...</span>
    </div>
  );
} 