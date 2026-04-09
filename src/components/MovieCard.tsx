import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Share2 } from 'lucide-react';
import { Movie } from '../types';
import ShareModal from './ShareModal';

interface MovieCardProps {
  movie: Movie;
  key?: string | number;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  return (
    <>
      <Link 
        to={`/watch/${movie.id}`}
        className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 transition-all hover:scale-[1.02] hover:border-indigo-500/50"
      >
        <div className="aspect-[2/3] relative overflow-hidden">
          <img
            src={movie.thumbnail}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
          
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="absolute top-2 right-2 p-2 bg-slate-950/60 backdrop-blur-md rounded-lg text-slate-400 hover:text-white hover:bg-indigo-600 transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
              <Play className="w-6 h-6 text-white fill-current" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-slate-100 truncate group-hover:text-indigo-400 transition-colors">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-400">{movie.category}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 uppercase tracking-wider">
              {movie.country}
            </span>
          </div>
        </div>
      </Link>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={movie.title}
        url={`${window.location.origin}/watch/${movie.id}`}
      />
    </>
  );
}
