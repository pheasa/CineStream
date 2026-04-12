import React from 'react';

interface RumblePlayerProps {
  videoId: string;
}

declare global {
  interface Window {
    Rumble: any;
    _Rumble: any;
  }
}

export default function RumblePlayer({ videoId }: RumblePlayerProps) {
  const containerId = `rumble_${videoId}`;

  React.useEffect(() => {
    // 1. Define the Rumble function if it doesn't exist
    if (!window.Rumble) {
      (function(r: any, u: Document, m: string, b: string) {
        r._Rumble = b;
        r[b] || (r[b] = function() {
          (r[b]._ = r[b]._ || []).push(arguments);
          if (r[b]._.length === 1) {
            const l = u.createElement(m) as HTMLScriptElement;
            const e = u.getElementsByTagName(m)[0];
            l.async = true;
            l.src = "https://rumble.com/embedJS/u4p5yvw" + (arguments[1].video ? '.' + arguments[1].video : '') + "/?url=" + encodeURIComponent(location.href) + "&args=" + encodeURIComponent(JSON.stringify([].slice.apply(arguments)));
            if (e && e.parentNode) {
              e.parentNode.insertBefore(l, e);
            }
          }
        });
      })(window, document, "script", "Rumble");
    }

    // 2. Call the Rumble function to play the video
    if (window.Rumble) {
      window.Rumble("play", { video: videoId, div: containerId });
    }

    // Cleanup logic if needed (Rumble script doesn't usually need explicit cleanup for the div)
  }, [videoId, containerId]);

  return (
    <div 
      id={containerId} 
      className="w-full h-full flex items-center justify-center bg-black"
    />
  );
}
