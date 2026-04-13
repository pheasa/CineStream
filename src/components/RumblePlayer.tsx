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
  return (
    <iframe 
      src={`https://rumble.com/embed/${videoId}/`}
      className="w-full h-full border-0"
      allowFullScreen
      title="Rumble Video Player"
    />
  );
}
