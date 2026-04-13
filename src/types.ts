export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Movie {
  id: number;
  title: string;
  thumbnail: string;
  embedCode: string;
  country: string;
  category: string;
  language: string;
  subtitle?: string;
  tags?: string;
  createdAt: string;
  featured?: boolean;
}

export interface Metadata {
  id: number;
  type: string;
  name: string;
}

export interface Stats {
  movies: number;
  metadata: number;
}
