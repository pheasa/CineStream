import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { movieService, metadataService, uploadToLitterbox, uploadToCatboxFromUrl } from '../../services/api';
import { Movie, Metadata } from '../../types';
import { Plus, Search, Edit2, Trash2, X, Upload, Loader2, ExternalLink, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';
import Pagination from '../../components/Pagination';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  thumbnail: z.string().url('Invalid thumbnail URL'),
  embedCode: z.string().min(1, 'Embed code is required'),
  country: z.string().min(1, 'Country is required'),
  category: z.string().min(1, 'Category is required'),
  language: z.string().min(1, 'Language is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  tags: z.string().optional(),
});

const ITEMS_PER_PAGE = 10;

type MovieFormData = z.infer<typeof movieSchema>;

export default function Movies() {
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [categories, setCategories] = React.useState<Metadata[]>([]);
  const [countries, setCountries] = React.useState<Metadata[]>([]);
  const [languages, setLanguages] = React.useState<Metadata[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingMovie, setEditingMovie] = React.useState<Movie | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [filterCountry, setFilterCountry] = React.useState('all');
  const [filterLanguage, setFilterLanguage] = React.useState('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MovieFormData>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: '',
      thumbnail: '',
      embedCode: '',
      country: '',
      category: '',
      language: '',
      subtitle: '',
      tags: '',
    }
  });

  const tagsValue = watch('tags') || '';
  const thumbnailValue = watch('thumbnail') || '';

  const fetchMovies = () => {
    setLoading(true);
    movieService.getAll({
      page: currentPage,
      limit: itemsPerPage,
      search: searchQuery,
      category: filterCategory,
      country: filterCountry,
      language: filterLanguage
    }).then(res => {
      setMovies(res.data);
      setTotalItems(res.total);
    }).finally(() => setLoading(false));
  };

  const fetchMetadata = () => {
    Promise.all([
      metadataService.getAll({ type: 'category', limit: 100 }),
      metadataService.getAll({ type: 'country', limit: 100 }),
      metadataService.getAll({ type: 'language', limit: 100 })
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
  }, [currentPage, itemsPerPage, searchQuery, filterCategory, filterCountry, filterLanguage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const onSubmit = async (data: MovieFormData) => {
    try {
      setLoading(true);
      let finalData = { ...data };

      // If thumbnail is a temporary Litterbox URL, move it to Catbox
      if (data.thumbnail && data.thumbnail.includes('litterbox.catbox.moe')) {
        try {
          const permanentUrl = await uploadToCatboxFromUrl(data.thumbnail);
          finalData.thumbnail = permanentUrl;
        } catch (error) {
          console.error('Failed to move image to Catbox:', error);
          // Continue with Litterbox URL if Catbox fails, though it will expire
        }
      }

      if (editingMovie) {
        await movieService.update(editingMovie.id, finalData);
      } else {
        await movieService.create(finalData);
      }
      setIsModalOpen(false);
      setEditingMovie(null);
      reset();
      fetchMovies();
    } catch (error) {
      console.error('Failed to save movie:', error);
      alert('Failed to save movie');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setValue('title', movie.title, { shouldValidate: true });
    setValue('thumbnail', movie.thumbnail, { shouldValidate: true });
    setValue('embedCode', movie.embedCode, { shouldValidate: true });
    setValue('country', movie.country, { shouldValidate: true });
    setValue('category', movie.category, { shouldValidate: true });
    setValue('language', movie.language, { shouldValidate: true });
    setValue('subtitle', movie.subtitle, { shouldValidate: true });
    setValue('tags', movie.tags, { shouldValidate: true });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      await movieService.delete(id);
      fetchMovies();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToLitterbox(file);
      setValue('thumbnail', url, { shouldValidate: true, shouldDirty: true });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again or provide a direct URL if the issue persists.');
    } finally {
      setUploading(false);
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterCountry, filterLanguage, itemsPerPage]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight">Manage Movies</h1>
        <button
          onClick={() => {
            setEditingMovie(null);
            reset();
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 rounded-lg font-medium hover:bg-indigo-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Movie</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search movies..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-xs font-medium w-full"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-xs font-medium w-full"
          >
            <option value="all">All Countries</option>
            {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-xs font-medium w-full"
          >
            <option value="all">All Languages</option>
            {languages.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-800/50 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Movie</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Category</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Country</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {movies.length > 0 ? (
                    movies.map((movie) => (
                      <tr key={movie.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <img 
                              src={movie.thumbnail} 
                              alt={movie.title} 
                              className="w-10 h-14 object-cover rounded-md border border-slate-700 shadow-lg" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">{movie.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">ID: #{movie.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-[10px] uppercase font-bold tracking-wider">{movie.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-400 font-medium">{movie.country}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleEdit(movie)}
                              className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(movie.id)}
                              className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No movies found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between bg-slate-800/20 gap-4">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-300">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-300">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium text-slate-300">{totalItems}</span> items
              </p>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg text-xs px-2 py-1 focus:ring-0"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
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
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">{editingMovie ? 'Edit Movie' : 'Add New Movie'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column: Thumbnail */}
                <div className="w-full md:w-48 shrink-0 space-y-2">
                  <label className="text-sm font-medium text-slate-400">Movie Thumbnail</label>
                  <div className="relative aspect-[2/3] w-full bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-700 overflow-hidden group transition-all hover:border-indigo-500/50">
                    {thumbnailValue ? (
                      <>
                        <img 
                          src={thumbnailValue} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <label className="cursor-pointer p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-colors shadow-lg">
                            <Upload className="w-5 h-5" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                          </label>
                          <button 
                            type="button"
                            onClick={() => setValue('thumbnail', '', { shouldValidate: true })}
                            className="p-2 bg-rose-500 rounded-full text-white hover:bg-rose-600 transition-colors shadow-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-2 hover:bg-slate-800 transition-colors">
                        <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-500">
                          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                        </div>
                        <div>
                          <span className="text-xs font-medium text-slate-300">
                            {uploading ? 'Uploading...' : 'Upload Thumbnail'}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">2:3 Ratio Recommended</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                    )}
                  </div>
                  <input type="hidden" {...register('thumbnail')} />
                  {errors.thumbnail && <p className="text-xs text-rose-500">{errors.thumbnail.message}</p>}
                </div>

                {/* Right Column: Main Fields */}
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-400">Title</label>
                      <input
                        {...register('title')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Inception"
                      />
                      {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Category</label>
                      <select
                        {...register('category')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      {errors.category && <p className="text-xs text-rose-500">{errors.category.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Country</label>
                      <select
                        {...register('country')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">Select Country</option>
                        {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      {errors.country && <p className="text-xs text-rose-500">{errors.country.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Speak</label>
                      <select
                        {...register('language')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">Select Language</option>
                        {languages.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                        <option value="None">None</option>
                      </select>
                      {errors.language && <p className="text-xs text-rose-500">{errors.language.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Subtitle</label>
                      <select
                        {...register('subtitle')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">Select Subtitle</option>
                        {languages.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                        <option value="None">None</option>
                      </select>
                      {errors.subtitle && <p className="text-xs text-rose-500">{errors.subtitle.message}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-400">Tags</label>
                      <div className="flex flex-wrap gap-2 p-2 bg-slate-800 border border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                        {tagsValue.split(',').filter(Boolean).map((tag: string, index: number) => (
                          <span key={index} className="flex items-center space-x-1 px-2 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded text-xs text-indigo-300">
                            <span>{tag.trim()}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentTags = tagsValue.split(',').filter(Boolean) || [];
                                const newTags = currentTags.filter((_: any, i: number) => i !== index);
                                setValue('tags', newTags.join(', '));
                              }}
                              className="hover:text-white transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          className="flex-1 bg-transparent outline-none text-sm min-w-[120px]"
                          placeholder="Add tag and press Enter..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim().replace(/,$/, '');
                              if (val) {
                                const currentTags = tagsValue.split(',').filter(Boolean) || [];
                                if (!currentTags.includes(val)) {
                                  setValue('tags', currentTags.length > 0 ? `${tagsValue}, ${val}` : val);
                                }
                                e.currentTarget.value = '';
                              }
                            } else if (e.key === 'Backspace' && !e.currentTarget.value) {
                              const currentTags = tagsValue.split(',').filter(Boolean) || [];
                              if (currentTags.length > 0) {
                                const newTags = currentTags.slice(0, -1);
                                setValue('tags', newTags.join(', '));
                              }
                            }
                          }}
                        />
                      </div>
                      <input type="hidden" {...register('tags')} />
                      {errors.tags && <p className="text-xs text-rose-500">{errors.tags.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Embed Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Embed Code / Rumble ID</label>
                <textarea
                  {...register('embedCode')}
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  placeholder='Paste iframe code OR Rumble Video ID (e.g. v75wufu)'
                />
                <p className="text-[10px] text-slate-500 italic">Tip: For Rumble, you can just paste the video ID like "v75wufu".</p>
                {errors.embedCode && <p className="text-xs text-rose-500">{errors.embedCode.message}</p>}
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
                >
                  {editingMovie ? 'Update Movie' : 'Save Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
