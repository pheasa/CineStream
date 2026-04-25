import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Movie } from '../types';
import { movieService } from '../services/api';
import MovieCard from '../components/MovieCard';
import { ChevronRight, Calendar, Globe, Tag, Share2, Info, Play, Mic, Subtitles } from 'lucide-react';
import { formatDate } from '../lib/utils';
import AdSense from '../components/AdSense';
import ShareModal from '../components/ShareModal';
import AdOverlay from '../components/AdOverlay';
import { Skeleton, MovieCardSkeleton } from '../components/Skeleton';
import clientConfig from '../config/client';

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = React.useState<Movie | null>(null);
  const [relatedMovies, setRelatedMovies] = React.useState<Movie[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [isInterstitialOpen, setIsInterstitialOpen] = React.useState(false);

  const currentUrl = window.location.href;

  React.useEffect(() => {
    if (id) {
      const startTime = Date.now();
      setLoading(true);
      movieService.getById(id)
        .then(m => {
          setMovie(m);
          setIsInterstitialOpen(true); // Show ad before viewing
          return movieService.getAll({ limit: 20 });
        })
        .then(res => {
          const numericId = Number(id);
          const all = res.data;
          if (movie) {
            setRelatedMovies(all.filter(m => m.id !== numericId && m.category === movie.category).slice(0, 5));
          } else {
            setRelatedMovies(all.filter(m => m.id !== numericId).slice(0, 5));
          }
          
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 1200 - elapsed);
          setTimeout(() => setLoading(false), remaining);
        })
        .catch(() => setLoading(false));
    }
  }, [id, movie?.category]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="w-24 h-32 shrink-0 rounded-lg" />
                  <div className="flex-1 flex flex-col justify-center space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-24 space-y-4">
        <h1 className="text-4xl font-black">Movie Not Found</h1>
        <p className="text-slate-500">The movie you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="text-indigo-400 hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-slate-500 space-x-2">
        <Link to="/" className="hover:text-slate-300">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/category/${movie.category}`} className="hover:text-slate-300">{movie.category}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-300 truncate">{movie.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top of Player Ad */}
          {clientConfig.VITE_ADSENSE_WATCH_TOP_SLOT && (
            <div className="bg-slate-900/10 border border-slate-800/30 rounded-xl p-2 flex items-center justify-center min-h-[50px]">
              <AdSense slot={clientConfig.VITE_ADSENSE_WATCH_TOP_SLOT} className="w-full" />
            </div>
          )}

          {/* Video Player */}
          <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <div 
              className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
              dangerouslySetInnerHTML={{ __html: movie.embedCode }}
            />
          </div>

          {/* Bottom of Player Ad */}
          {clientConfig.VITE_ADSENSE_WATCH_PLAYER_BOTTOM_SLOT && (
            <div className="bg-slate-900/10 border border-slate-800/30 rounded-xl p-2 flex items-center justify-center min-h-[50px]">
              <AdSense slot={clientConfig.VITE_ADSENSE_WATCH_PLAYER_BOTTOM_SLOT} className="w-full" />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-3xl font-black tracking-tight">{movie.title}</h1>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(movie.createdAt)}</span>
              </div>
              {movie.country && movie.country !== 'None' && (
                <div className="flex items-center space-x-1">
                  <Globe className="w-4 h-4" />
                  <span>{movie.country}</span>
                </div>
              )}
              {movie.category && movie.category !== 'None' && (
                <div className="flex items-center space-x-1">
                  <Tag className="w-4 h-4" />
                  <span>{movie.category}</span>
                </div>
              )}
              {movie.language && movie.language !== 'None' && (
                <div className="flex items-center space-x-1 text-indigo-400">
                  <Mic className="w-4 h-4" />
                  <span>Speak: {movie.language}</span>
                </div>
              )}
              {movie.subtitle && movie.subtitle !== 'None' && (
                <div className="flex items-center space-x-1 text-indigo-400">
                  <Subtitles className="w-4 h-4" />
                  <span>Subtitle: {movie.subtitle}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {movie.tags ? movie.tags.split(',').map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">
                    #{tag.trim()}
                  </span>
                )) : <span className="text-slate-500 italic text-sm">No tags available</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Play className="w-5 h-5 text-indigo-500 fill-current" />
            <span>Related Movies</span>
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {relatedMovies.length > 0 ? (
              relatedMovies.map(m => (
                <Link 
                  key={m.id} 
                  to={`/watch/${m.id}`}
                  className="flex space-x-4 group"
                >
                  <div className="w-24 h-32 shrink-0 rounded-lg overflow-hidden border border-slate-800">
                    <img
                      src={m.thumbnail}
                      alt={m.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {m.title}
                    </h4>
                    <span className="text-xs text-slate-500 mt-1">{m.category}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-slate-500 text-sm italic">No related movies found.</p>
            )}
          </div>

          {/* Ad Banner */}
          {clientConfig.VITE_ADSENSE_WATCH_SLOT && (
            <div className="bg-slate-900/10 border border-slate-800/30 rounded-2xl p-4 flex items-center justify-center min-h-[200px]">
              <AdSense slot={clientConfig.VITE_ADSENSE_WATCH_SLOT} format="rectangle" className="w-full" />
            </div>
          )}
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={movie.title}
        url={currentUrl}
      />

      <AdOverlay 
        type="interstitial"
        slot={clientConfig.VITE_ADSENSE_INTERSTITIAL_SLOT}
        isOpen={isInterstitialOpen}
        onClose={() => setIsInterstitialOpen(false)}
        title="Ready to Watch?"
      />
    </div>
  );
}
