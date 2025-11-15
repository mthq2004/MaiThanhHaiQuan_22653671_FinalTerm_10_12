export interface Movie {
  id: number;
  title: string;
  year: number | null;
  watched: number; // 0 or 1
  rating: number | null; // 1-5 or null
  created_at: number;
}

export interface MovieFormData {
  title: string;
  year: number | null;
  rating: number | null;
}
