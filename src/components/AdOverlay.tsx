import React from 'react';
import { X } from 'lucide-react';
import AdSense from './AdSense';
import { cn } from '../lib/utils';

interface AdOverlayProps {
  slot: string;
  type: 'popup' | 'interstitial';
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  delay?: number; // Delay in ms before showing
}

export default function AdOverlay({ slot, type, isOpen, onClose, title, delay = 0 }: AdOverlayProps) {
  const [shouldShow, setShouldShow] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setShouldShow(true);
        document.body.style.overflow = 'hidden';
      }, delay);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
      };
    } else {
      setShouldShow(false);
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, delay]);

  if (!shouldShow) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={cn(
          "relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col",
          type === 'popup' ? "max-w-md w-full" : "max-w-5xl w-full max-h-[90vh]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">{title || (type === 'popup' ? 'Special Offer' : 'Advertisement')}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Ad Content */}
        <div className="flex-1 p-6 flex items-center justify-center min-h-[300px] bg-slate-950/50 overflow-auto">
          <div className="w-full">
            <AdSense 
              slot={slot} 
              format={type === 'popup' ? 'rectangle' : 'auto'} 
              className="w-full" 
            />
          </div>
        </div>

        {/* Footer for Interstitial */}
        {type === 'interstitial' && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm flex justify-center">
            <button 
              onClick={onClose}
              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20"
            >
              Skip Ad & Watch Movie
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
