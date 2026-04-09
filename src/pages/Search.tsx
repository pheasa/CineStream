import React from 'react';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import { Movie, Category, Country } from '../types';
import { movieService, categoryService, countryService } from '../services/api';
import MovieCard from '../components/MovieCard';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 15;

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 
  'Russian', 'Portuguese', 'Italian', 'Arabic', 'Hindi', 'Bengali', 'Thai', 
  'Vietnamese', 'Indonesian', 'Turkish', 'Polish', 'Dutch', 'Swedish', 'None'
];

export default function Search() {
  const [allMovies, setAllMovies] = React.useState<Movie[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [countries, setCountries] = React.useState<Country[]>([]);
  const [filteredMovies, setFilteredMovies] = React.useState<Movie[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);

  const [query, setQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedCountry, setSelectedCountry] = React.useState('');
  const [selectedLanguage, setSelectedLanguage] = React.useState('');
  const [selectedSubtitle, setSelectedSubtitle] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      movieService.getAll(),
      categoryService.getAll(),
      countryService.getAll()
    ]).then(([m, cat, cou]) => {
      const sorted = [...m].reverse();
      setAllMovies(sorted);
      setFilteredMovies(sorted);
      setCategories(cat);
      setCountries(cou);
    }).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    let result = allMovies;

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(q) || 
        m.tags.toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      result = result.filter(m => m.category === selectedCategory);
    }

    if (selectedCountry) {
      result = result.filter(m => m.country === selectedCountry);
    }

    if (selectedLanguage) {
      result = result.filter(m => m.language === selectedLanguage);
    }

    if (selectedSubtitle) {
      result = result.filter(m => m.subtitle === selectedSubtitle);
    }

    setFilteredMovies(result);
    setCurrentPage(1);
  }, [query, selectedCategory, selectedCountry, selectedLanguage, selectedSubtitle, allMovies]);

  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  const currentMovies = filteredMovies.slice(
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
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-black text-center">Search Movies</h1>
        <div className="relative group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by title, tags..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-14 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <select
              className="bg-transparent focus:outline-none text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <select
              className="bg-transparent focus:outline-none text-sm"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">All Countries</option>
              {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <select
              className="bg-transparent focus:outline-none text-sm"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="">All Speak</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <select
              className="bg-transparent focus:outline-none text-sm"
              value={selectedSubtitle}
              onChange={(e) => setSelectedSubtitle(e.target.value)}
            >
              <option value="">All Subtitles</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {(query || selectedCategory || selectedCountry || selectedLanguage || selectedSubtitle) && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedCategory('');
                setSelectedCountry('');
                setSelectedLanguage('');
                setSelectedSubtitle('');
              }}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-slate-400 text-sm">
          Found {filteredMovies.length} results
        </p>
        
        {currentMovies.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
              {currentMovies.map((movie) => (
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
            <p className="text-slate-500 text-lg">No movies match your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
