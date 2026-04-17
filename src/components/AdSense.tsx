import React from 'react';
import { cn } from '../lib/utils';
import clientConfig from '../config/client';

interface AdSenseProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

export default function AdSense({ slot, format = 'auto', className }: AdSenseProps) {
  const adRef = React.useRef<HTMLDivElement>(null);
  const initialized = React.useRef(false);
  const adClient = clientConfig.VITE_ADSENSE_CLIENT_ID;
  console.log('AdSense Client ID:', adClient);

  React.useEffect(() => {
    if (initialized.current) return;
    
    // Inject AdSense script if not present
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && !initialized.current) {
          try {
            // @ts-ignore
            const adsbygoogle = window.adsbygoogle || [];
            adsbygoogle.push({});
            initialized.current = true;
            observer.disconnect();
          } catch (e) {
            console.error('AdSense error:', e);
          }
        }
      }
    });

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [adClient]);

  return (
    <div ref={adRef} className={cn("relative group", className)}>
      <div className="absolute -top-3 left-2 px-1.5 bg-slate-950 text-[10px] font-bold text-slate-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Advertisement
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
