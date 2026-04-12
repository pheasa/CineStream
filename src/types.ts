export interface Movie {
  id: string;
  title: string;
  thumbnail: string;
  embedCode: string;
  country: string;
  category: string;
  language: string;
  subtitle: string;
  tags: string;
  createdAt: string;
  featured?: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Country {
  id: string;
  name: string;
}

export interface Metadata {
  id: string;
  type: string;
  name: string;
}

export interface Stats {
  movies: number;
  categories: number;
  countries: number;
  metadata: number;
}
