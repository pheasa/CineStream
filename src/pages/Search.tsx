import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import { Movie, Metadata } from '../types';
import { movieService, metadataService } from '../services/api';
import MovieCard from '../components/MovieCard';
import Pagination from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import { QueryParams, FilterValues, DEFAULT_PAGINATION, MetadataTypes } from '../constants';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [categories, setCategories] = React.useState<Metadata[]>([]);
  const [countries, setCountries] = React.useState<Metadata[]>([]);
  const [languages, setLanguages] = React.useState<Metadata[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Initialize state from URL
  const [currentPage, setCurrentPage] = React.useState(Number(searchParams.get(QueryParams.PAGE)) || DEFAULT_PAGINATION.PAGE);
  const [query, setQuery] = React.useState(searchParams.get(QueryParams.QUERY) || '');
  const [selectedCategory, setSelectedCategory] = React.useState(searchParams.get(QueryParams.CATEGORY) || '');
  const [selectedCountry, setSelectedCountry] = React.useState(searchParams.get(QueryParams.COUNTRY) || '');
  const [selectedLanguage, setSelectedLanguage] = React.useState(searchParams.get(QueryParams.LANGUAGE) || '');
  const [selectedSubtitle, setSelectedSubtitle] = React.useState(searchParams.get(QueryParams.SUBTITLE) || '');

  const debouncedQuery = useDebounce(query, 800);

  // Update URL when state changes
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (debouncedQuery) params.set(QueryParams.QUERY, debouncedQuery);
    else params.delete(QueryParams.QUERY);

    if (selectedCategory) params.set(QueryParams.CATEGORY, selectedCategory);
    else params.delete(QueryParams.CATEGORY);

    if (selectedCountry) params.set(QueryParams.COUNTRY, selectedCountry);
    else params.delete(QueryParams.COUNTRY);

    if (selectedLanguage) params.set(QueryParams.LANGUAGE, selectedLanguage);
    else params.delete(QueryParams.LANGUAGE);

    if (selectedSubtitle) params.set(QueryParams.SUBTITLE, selectedSubtitle);
    else params.delete(QueryParams.SUBTITLE);

    if (currentPage > DEFAULT_PAGINATION.PAGE) params.set(QueryParams.PAGE, currentPage.toString());
    else params.delete(QueryParams.PAGE);

    setSearchParams(params, { replace: true });
  }, [debouncedQuery, selectedCategory, selectedCountry, selectedLanguage, selectedSubtitle, currentPage]);

  const fetchMovies = () => {
    setLoading(true);
    movieService.getAll({
      page: currentPage,
      limit: DEFAULT_PAGINATION.PUBLIC_LIMIT,
      search: debouncedQuery,
      category: selectedCategory || FilterValues.ALL,
      country: selectedCountry || FilterValues.ALL,
      language: selectedLanguage || FilterValues.ALL
    }).then(res => {
      setMovies(res.data);
      setTotalItems(res.total);
    }).finally(() => setLoading(false));
  };

  const fetchMetadata = () => {
    Promise.all([
      metadataService.getAll({ type: MetadataTypes.CATEGORY, limit: 100 }),
      metadataService.getAll({ type: MetadataTypes.COUNTRY, limit: 100 }),
      metadataService.getAll({ type: MetadataTypes.LANGUAGE, limit: 100 })
    ]).then(([cat, cou, lang]) => {
      setCategories(cat.data);
      setCountries(cou.data);
      setLanguages(lang.data);
    });
  };

  React.useEffect(() => {
    fetchMetadata();
  }, []);

  React.useEffect(() => {
    fetchMovies();
  }, [debouncedQuery, selectedCategory, selectedCountry, selectedLanguage, currentPage]);

  const totalPages = Math.ceil(totalItems / DEFAULT_PAGINATION.PUBLIC_LIMIT);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedCategory, selectedCountry, selectedLanguage]);

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

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center">
          <div className="flex items-center shrink-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-500">
            <SlidersHorizontal className="w-4 h-4" />
          </div>

          <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <select
              className="bg-transparent focus:outline-none text-sm appearance-none cursor-pointer pr-2"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Categories</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <select
              className="bg-transparent focus:outline-none text-sm appearance-none cursor-pointer pr-2"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">Countries</option>
              {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <select
              className="bg-transparent focus:outline-none text-sm appearance-none cursor-pointer pr-2"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="">Speak</option>
              {languages.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
              <option value="None">None</option>
            </select>
          </div>

          <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <select
              className="bg-transparent focus:outline-none text-sm appearance-none cursor-pointer pr-2"
              value={selectedSubtitle}
              onChange={(e) => setSelectedSubtitle(e.target.value)}
            >
              <option value="">Subtitles</option>
              {languages.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
              <option value="None">None</option>
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
              className="shrink-0 text-sm text-indigo-400 hover:text-indigo-300 font-medium px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-slate-400 text-sm">
          Found {totalItems} results
        </p>
        
        {movies.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
              {movies.map((movie) => (
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
