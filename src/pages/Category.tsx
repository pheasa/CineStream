import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Movie, Metadata } from '../types';
import { movieService, metadataService } from '../services/api';
import MovieCard from '../components/MovieCard';
import { ChevronRight, Filter } from 'lucide-react';
import AdSense from '../components/AdSense';
import Pagination from '../components/Pagination';
import clientConfig from '../config/client';

const ITEMS_PER_PAGE = 12;

export default function CategoryPage() {
  const { name } = useParams<{ name: string }>();
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [categories, setCategories] = React.useState<Metadata[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    Promise.all([movieService.getAll(), metadataService.getAll('category')])
      .then(([m, c]) => {
        setCategories(c);
        if (name) {
          setMovies(m.filter(movie => movie.category === name).reverse());
        } else {
          setMovies([...m].reverse());
        }
        setCurrentPage(1);
      })
      .finally(() => setLoading(false));
  }, [name]);

  const totalPages = Math.ceil(movies.length / ITEMS_PER_PAGE);
  const currentMovies = movies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center text-sm text-slate-500 space-x-2">
            <Link to="/" className="hover:text-slate-300">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-300">Categories</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            {name ? `${name} Movies` : 'All Categories'}
          </h1>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <Filter className="w-5 h-5 text-slate-500 mr-2 shrink-0" />
          <Link
            to="/category"
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !name ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.name}`}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                name === cat.name ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {currentMovies.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
            {currentMovies.slice(0, 5).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {/* Mid-Page Ad Banner */}
          <div className="bg-slate-900/10 border border-slate-800/30 rounded-2xl p-4 flex items-center justify-center min-h-[100px]">
            <AdSense slot={clientConfig.VITE_ADSENSE_CATEGORY_MID_SLOT} className="w-full" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
            {currentMovies.slice(5).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-24 text-center">
          <p className="text-slate-500 text-lg">No movies found in this category.</p>
          <Link to="/" className="text-indigo-400 hover:underline mt-2 inline-block">Return Home</Link>
        </div>
      )}

      {/* Ad Banner */}
      <div className="bg-slate-900/10 border border-slate-800/30 rounded-2xl p-4 flex items-center justify-center min-h-[100px] mt-12">
        <AdSense slot={clientConfig.VITE_ADSENSE_CATEGORY_SLOT} className="w-full" />
      </div>
    </div>
  );
}
