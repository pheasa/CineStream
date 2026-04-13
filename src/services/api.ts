import axios from 'axios';
import { Movie, Stats, Metadata } from '../types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials: any) => api.post<{ token: string }>('/auth/login', credentials).then(res => res.data),
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_auth');
  }
};

export const movieService = {
  getAll: () => api.get<Movie[]>('/movies').then(res => res.data),
  getById: (id: string) => api.get<Movie>(`/movies/${id}`).then(res => res.data),
  create: (movie: Omit<Movie, 'id' | 'createdAt'>) => api.post<Movie>('/movies', { ...movie, createdAt: new Date().toISOString() }).then(res => res.data),
  update: (id: string, movie: Partial<Movie>) => api.put<Movie>(`/movies/${id}`, movie).then(res => res.data),
  delete: (id: string) => api.delete(`/movies/${id}`),
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

export const uploadToLitterbox = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<{ url: string }>('/upload/litterbox', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data.url);
};

export const uploadToCatboxFromUrl = (url: string) => {
  return api.post<{ url: string }>('/upload/catbox', { url }).then(res => res.data.url);
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
