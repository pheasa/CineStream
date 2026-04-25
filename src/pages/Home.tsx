import React from 'react';
import { Link } from 'react-router-dom';
import { Play, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { Movie, Metadata } from '../types';
import { movieService, metadataService } from '../services/api';
import MovieCard from '../components/MovieCard';
import { motion } from 'motion/react';
import AdSense from '../components/AdSense';
import ShareModal from '../components/ShareModal';
import { Skeleton, MovieCardSkeleton } from '../components/Skeleton';
import { Share2 } from 'lucide-react';
import clientConfig from '../config/client';

export default function Home() {
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [categories, setCategories] = React.useState<Metadata[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [shareData, setShareData] = React.useState({ title: '', url: '' });

  React.useEffect(() => {
    const startTime = Date.now();
    Promise.all([
      movieService.getAll({ limit: 20 }), 
      metadataService.getAll({ type: 'category', limit: 5 })
    ])
      .then(([m, c]) => {
        setMovies(m.data);
        setCategories(c.data);
        
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1200 - elapsed);
        setTimeout(() => setLoading(false), remaining);
      })
      .catch(() => setLoading(false));
  }, []);

  const featuredMovie = movies[0];
  const latestMovies = [...movies].reverse().slice(0, 10);

  const handleShare = (movie: Movie) => {
    setShareData({
      title: movie.title,
      url: `${window.location.origin}/watch/${movie.id}`
    });
    setIsShareModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-12">
        {/* Hero Skeleton */}
        <Skeleton className="h-[70vh] w-full rounded-3xl" />
        
        {/* Categories Skeleton */}
        <section className="space-y-6">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </section>

        {/* Latest Movies Skeleton */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
            {[...Array(14)].map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      {featuredMovie && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-[70vh] rounded-3xl overflow-hidden group"
        >
          <img
            src={featuredMovie.thumbnail}
            alt={featuredMovie.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-2xl space-y-6">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest">Featured</span>
              <span className="text-slate-300 text-sm">{featuredMovie.category} • {featuredMovie.country}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
              {featuredMovie.title}
            </h1>
            <div className="flex items-center space-x-4">
              <Link
                to={`/watch/${featuredMovie.id}`}
                className="flex items-center space-x-2 px-8 py-4 bg-white text-slate-950 rounded-full font-bold hover:bg-indigo-500 hover:text-white transition-all transform hover:scale-105"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Watch Now</span>
              </Link>
              <button
                onClick={() => handleShare(featuredMovie)}
                className="flex items-center space-x-2 px-8 py-4 bg-slate-900/50 backdrop-blur-md border border-slate-700 text-white rounded-full font-bold hover:bg-slate-800 transition-all transform hover:scale-105"
              >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={shareData.title}
        url={shareData.url}
      />

      {/* Popular Categories */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            <span>Popular Categories</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.name}`}
              className="group relative h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-indigo-500 transition-colors"
            >
              <span className="text-lg font-bold group-hover:text-indigo-400 transition-colors">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Mid-Page Ad Banner */}
      {clientConfig.VITE_ADSENSE_HOME_MID_SLOT && (
        <div className="bg-slate-900/10 border border-slate-800/30 rounded-2xl p-4 flex items-center justify-center min-h-[100px]">
          <AdSense slot={clientConfig.VITE_ADSENSE_HOME_MID_SLOT} className="w-full" />
        </div>
      )}

      {/* Latest Movies */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Clock className="w-6 h-6 text-indigo-500" />
            <span>Latest Additions</span>
          </h2>
          <Link to="/search" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center">
            View all <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        {latestMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
            {latestMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-500">No movies added yet. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Bottom Ad Banner */}
      {clientConfig.VITE_ADSENSE_HOME_BOTTOM_SLOT && (
        <div className="bg-slate-900/10 border border-slate-800/30 rounded-2xl p-4 flex items-center justify-center min-h-[100px]">
          <AdSense slot={clientConfig.VITE_ADSENSE_HOME_BOTTOM_SLOT} className="w-full" />
        </div>
      )}
    </div>
  );
}
