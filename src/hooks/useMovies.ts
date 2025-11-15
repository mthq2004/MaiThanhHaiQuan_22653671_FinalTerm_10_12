import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDB,
  insertMovie,
  updateMovie,
  deleteMovie,
  toggleWatched,
} from "@/db/db";
import { Movie, MovieFormData } from "@/types/Movie";
import { Alert } from "react-native";

export type SortOption =
  | "newest"
  | "oldest"
  | "year-asc"
  | "year-desc"
  | "rating";

interface UseMoviesReturn {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  searchText: string;
  setSearchText: (text: string) => void;
  filterWatched: "all" | "watched" | "unwatched";
  setFilterWatched: (filter: "all" | "watched" | "unwatched") => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  importLoading: boolean;
  filteredAndSortedMovies: Movie[];
  loadMovies: () => Promise<void>;
  handleAddMovie: (data: MovieFormData) => Promise<void>;
  handleToggleWatched: (movie: Movie) => void;
  handleEditMovie: (movie: Movie) => void;
  handleUpdateMovie: (movie: Movie, data: MovieFormData) => Promise<void>;
  handleDeleteMovie: (movie: Movie) => void;
  handleImportFromAPI: () => Promise<void>;
  selectedMovie: Movie | null;
  setSelectedMovie: (movie: Movie | null) => void;
}

export const useMovies = (): UseMoviesReturn => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterWatched, setFilterWatched] = useState<
    "all" | "watched" | "unwatched"
  >("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [importLoading, setImportLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Load movies from database
  const loadMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const db = getDB();
      const result = await db.getAllAsync<Movie>(
        "SELECT * FROM movies ORDER BY created_at DESC"
      );
      setMovies(result || []);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Không thể tải danh sách phim";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize - load movies on mount
  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  // Add new movie
  const handleAddMovie = useCallback(
    async (data: MovieFormData) => {
      try {
        await insertMovie(data.title, data.year, data.rating);
        await loadMovies();
        Alert.alert("Thành công", `Đã thêm phim "${data.title}"`, [
          { text: "OK", onPress: () => {} },
        ]);
      } catch (err) {
        Alert.alert(
          "Lỗi",
          err instanceof Error ? err.message : "Thêm phim thất bại"
        );
      }
    },
    [loadMovies]
  );

  // Toggle watched status
  const handleToggleWatched = useCallback(
    (movie: Movie) => {
      Alert.alert(
        "Xác nhận",
        `${movie.watched ? "Đánh dấu chưa xem" : "Đánh dấu đã xem"} phim "${
          movie.title
        }"?`,
        [
          { text: "Hủy", onPress: () => {}, style: "cancel" },
          {
            text: "OK",
            onPress: async () => {
              try {
                await toggleWatched(movie.id);
                await loadMovies();
              } catch (err) {
                Alert.alert("Lỗi", "Cập nhật thất bại");
              }
            },
          },
        ]
      );
    },
    [loadMovies]
  );

  // Edit movie (open modal)
  const handleEditMovie = useCallback((movie: Movie) => {
    setSelectedMovie(movie);
  }, []);

  // Update movie
  const handleUpdateMovie = useCallback(
    async (movie: Movie, data: MovieFormData) => {
      try {
        await updateMovie(movie.id, data.title, data.year, data.rating);
        await loadMovies();
        setSelectedMovie(null);
        Alert.alert("Thành công", "Đã cập nhật phim", [
          { text: "OK", onPress: () => {} },
        ]);
      } catch (err) {
        Alert.alert(
          "Lỗi",
          err instanceof Error ? err.message : "Cập nhật thất bại"
        );
      }
    },
    [loadMovies]
  );

  // Delete movie
  const handleDeleteMovie = useCallback(
    (movie: Movie) => {
      Alert.alert("Xác nhận xóa", `Xóa phim "${movie.title}"?`, [
        { text: "Hủy", onPress: () => {}, style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await deleteMovie(movie.id);
              await loadMovies();
              Alert.alert("Thành công", "Đã xóa phim", [
                { text: "OK", onPress: () => {} },
              ]);
            } catch (err) {
              Alert.alert("Lỗi", "Xóa thất bại");
            }
          },
          style: "destructive",
        },
      ]);
    },
    [loadMovies]
  );

  // Import from API
  const handleImportFromAPI = useCallback(async () => {
    try {
      setImportLoading(true);

      // Fetch from API
      const response = await fetch(
        "https://67c824890acf98d0708518a5.mockapi.io/MaiThanhHaiQuan_22653671_FinalTerm_10_12"
      );

      if (!response.ok) {
        throw new Error("Lỗi khi lấy dữ liệu từ API");
      }

      const apiMovies = await response.json();

      // Get existing movies để check trùng lặp
      const db = getDB();
      const existingMovies = await db.getAllAsync<Movie>(
        "SELECT title, year FROM movies"
      );

      const existingSet = new Set(
        (existingMovies || []).map((m) => `${m.title}_${m.year}`)
      );

      let importedCount = 0;
      // Map API movies và insert vào DB
      for (const movie of apiMovies) {
        const title = movie.title;
        const year = movie.year;
        const rating = movie.rating;

        // Check trùng lặp (title + year)
        const key = `${title}_${year}`;
        if (!existingSet.has(key) && title) {
          await insertMovie(title, year, rating);
          importedCount++;
          existingSet.add(key); // Add to set to avoid duplicate in same import
        }
      }

      await loadMovies();

      if (importedCount > 0) {
        Alert.alert(
          "Thành công",
          `Đã import ${importedCount} phim mới từ API`,
          [{ text: "OK", onPress: () => {} }]
        );
      } else {
        Alert.alert(
          "Thông báo",
          "Không có phim mới để import (tất cả đều trùng lặp)",
          [{ text: "OK", onPress: () => {} }]
        );
      }
    } catch (err) {
      Alert.alert(
        "Lỗi",
        err instanceof Error ? err.message : "Import từ API thất bại"
      );
    } finally {
      setImportLoading(false);
    }
  }, [loadMovies]);

  // Filter and sort movies
  const filteredAndSortedMovies = useMemo(() => {
    let result = [...movies];

    // Apply watched filter
    if (filterWatched === "watched") {
      result = result.filter((m) => m.watched);
    } else if (filterWatched === "unwatched") {
      result = result.filter((m) => !m.watched);
    }

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      result = result.filter((m) =>
        m.title.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return (b.created_at || 0) - (a.created_at || 0);
        case "oldest":
          return (a.created_at || 0) - (b.created_at || 0);
        case "year-asc":
          return (a.year || 0) - (b.year || 0);
        case "year-desc":
          return (b.year || 0) - (a.year || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [movies, searchText, filterWatched, sortOption]);

  return {
    movies,
    loading,
    error,
    searchText,
    setSearchText,
    filterWatched,
    setFilterWatched,
    sortOption,
    setSortOption,
    importLoading,
    filteredAndSortedMovies,
    loadMovies,
    handleAddMovie,
    handleToggleWatched,
    handleEditMovie,
    handleUpdateMovie,
    handleDeleteMovie,
    handleImportFromAPI,
    selectedMovie,
    setSelectedMovie,
  };
};
