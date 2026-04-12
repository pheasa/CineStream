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

export interface Metadata {
  id: string;
  type: string;
  name: string;
}

export interface Stats {
  movies: number;
  metadata: number;
}
