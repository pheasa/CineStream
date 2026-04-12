import axios from 'axios';
import { Movie, Category, Country, Stats, Metadata } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const movieService = {
  getAll: () => api.get<Movie[]>('/movies').then(res => res.data),
  getById: (id: string) => api.get<Movie>(`/movies/${id}`).then(res => res.data),
  create: (movie: Omit<Movie, 'id' | 'createdAt'>) => api.post<Movie>('/movies', { ...movie, createdAt: new Date().toISOString() }).then(res => res.data),
  update: (id: string, movie: Partial<Movie>) => api.put<Movie>(`/movies/${id}`, movie).then(res => res.data),
  delete: (id: string) => api.delete(`/movies/${id}`),
};

export const categoryService = {
  getAll: () => api.get<Category[]>('/categories').then(res => res.data),
  create: (name: string) => api.post<Category>('/categories', { name }).then(res => res.data),
  update: (id: string, name: string) => api.put<Category>(`/categories/${id}`, { name }).then(res => res.data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const countryService = {
  getAll: () => api.get<Country[]>('/countries').then(res => res.data),
  create: (name: string) => api.post<Country>('/countries', { name }).then(res => res.data),
  update: (id: string, name: string) => api.put<Country>(`/countries/${id}`, { name }).then(res => res.data),
  delete: (id: string) => api.delete(`/countries/${id}`),
};

export const metadataService = {
  getAll: (type?: string) => api.get<Metadata[]>('/metadata', { params: { type } }).then(res => res.data),
  create: (type: string, name: string) => api.post<Metadata>('/metadata', { type, name }).then(res => res.data),
  update: (id: string, type: string, name: string) => api.put<Metadata>(`/metadata/${id}`, { type, name }).then(res => res.data),
  delete: (id: string) => api.delete(`/metadata/${id}`),
};

export const statsService = {
  get: () => api.get<Stats>('/stats').then(res => res.data),
};

export const uploadToCatbox = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  formData.append('fileToUpload', file);

  // Note: Catbox.moe might have CORS issues if called directly from browser.
  // In a real app, you might need a proxy. For this demo, we'll try direct or assume it works.
  // Using a proxy if needed, but let's try direct first.
  const response = await axios.post('https://catbox.moe/user/api.php', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // Returns the URL as a string
};
