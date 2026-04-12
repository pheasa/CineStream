import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { movieService, categoryService, countryService, metadataService, uploadToLitterbox, uploadToCatboxFromUrl } from '../../services/api';
import { Movie, Category, Country, Metadata } from '../../types';
import { Plus, Search, Edit2, Trash2, X, Upload, Loader2, ExternalLink } from 'lucide-react';
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
  tags: z.string().min(1, 'At least one tag is required'),
});

const ITEMS_PER_PAGE = 10;

type MovieFormData = z.infer<typeof movieSchema>;

export default function Movies() {
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [countries, setCountries] = React.useState<Metadata[]>([]);
  const [languages, setLanguages] = React.useState<Metadata[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingMovie, setEditingMovie] = React.useState<Movie | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);

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

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      movieService.getAll(),
      categoryService.getAll(),
      metadataService.getAll('country'),
      metadataService.getAll('language')
    ]).then(([m, cat, cou, lang]) => {
      setMovies([...m].reverse());
      setCategories(cat);
      setCountries(cou);
      setLanguages(lang);
    }).finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchData();
  }, []);

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
      fetchData();
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      await movieService.delete(id);
      fetchData();
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

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  const currentMovies = filteredMovies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search movies..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
                  {currentMovies.map((movie) => (
                    <tr key={movie.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={movie.thumbnail} 
                            alt={movie.title} 
                            className="w-12 h-16 object-cover rounded-md border border-slate-700" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-100">{movie.title}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[200px]">{movie.tags}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">{movie.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">{movie.country}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(movie)}
                            className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(movie.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredMovies.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                No movies found.
              </div>
            )}
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
                      <label className="text-sm font-medium text-slate-400">Speak Language</label>
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
                      <label className="text-sm font-medium text-slate-400">Subtitle Language</label>
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
