import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { getDB } from "@/db/db";
import { insertMovie, toggleWatched, updateMovie, deleteMovie } from "@/db/db";
import { Movie, MovieFormData } from "@/types/Movie";
import { AddMovieModal } from "./AddMovieModal";
import { EditMovieModal } from "./EditMovieModal";
import { suggestedMovies } from "@/data/suggestedMovies";

export const MovieListScreen: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterWatched, setFilterWatched] = useState<
    "all" | "watched" | "unwatched"
  >("all");
  const [importLoading, setImportLoading] = useState(false);

  const loadMovies = useCallback(async () => {
    try {
      setLoading(true);
      const db = getDB();
      const result = await db.getAllAsync<Movie>(
        "SELECT * FROM movies ORDER BY created_at DESC"
      );
      setMovies(result || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load movies");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  // Filter and search movies with useMemo for optimization
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      // Filter by watched status
      if (filterWatched === "watched" && !movie.watched) return false;
      if (filterWatched === "unwatched" && movie.watched) return false;

      // Filter by search text (case-insensitive)
      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase();
        return movie.title.toLowerCase().includes(searchLower);
      }

      return true;
    });
  }, [movies, searchText, filterWatched]);

  const handleAddMovie = useCallback(
    async (movieData: MovieFormData) => {
      try {
        await insertMovie(movieData.title, movieData.year, movieData.rating);
        await loadMovies();
        Alert.alert(
          "Thành công",
          `Đã thêm "${movieData.title}" vào danh sách phim`,
          [{ text: "OK", onPress: () => {} }]
        );
      } catch (err) {
        throw err;
      }
    },
    [loadMovies]
  );

  const handleToggleWatched = useCallback(
    (movie: Movie) => {
      const action = movie.watched ? "chưa xem" : "đã xem";
      Alert.alert(
        "Xác nhận",
        `Bạn có muốn đánh dấu "${movie.title}" là ${action}?`,
        [
          { text: "Hủy", onPress: () => {}, style: "cancel" },
          {
            text: "Đồng ý",
            onPress: async () => {
              try {
                await toggleWatched(movie.id);
                await loadMovies();
              } catch (err) {
                Alert.alert(
                  "Lỗi",
                  err instanceof Error ? err.message : "Cập nhật thất bại"
                );
              }
            },
            style: "default",
          },
        ]
      );
    },
    [loadMovies]
  );

  const handleEditMovie = useCallback((movie: Movie) => {
    setSelectedMovie(movie);
    setEditModalVisible(true);
  }, []);

  const handleUpdateMovie = useCallback(
    async (movieId: number, movieData: MovieFormData) => {
      try {
        await updateMovie(
          movieId,
          movieData.title,
          movieData.year,
          movieData.rating
        );
        await loadMovies();
        Alert.alert(
          "Thành công",
          `Đã cập nhật "${movieData.title}" thành công`,
          [{ text: "OK", onPress: () => {} }]
        );
      } catch (err) {
        throw err;
      }
    },
    [loadMovies]
  );

  const handleDeleteMovie = useCallback(
    (movie: Movie) => {
      Alert.alert(
        "Xác nhận xóa",
        `Bạn có chắc muốn xóa "${movie.title}" khỏi danh sách?`,
        [
          { text: "Hủy", onPress: () => {}, style: "cancel" },
          {
            text: "Xóa",
            onPress: async () => {
              try {
                await deleteMovie(movie.id);
                await loadMovies();
                Alert.alert(
                  "Thành công",
                  `Đã xóa "${movie.title}" khỏi danh sách`,
                  [{ text: "OK", onPress: () => {} }]
                );
              } catch (err) {
                Alert.alert(
                  "Lỗi",
                  err instanceof Error ? err.message : "Xóa thất bại"
                );
              }
            },
            style: "destructive",
          },
        ]
      );
    },
    [loadMovies]
  );

  const handleImportFromAPI = useCallback(async () => {
    try {
      setImportLoading(true);

      // Get existing movies để check trùng lặp
      const db = getDB();
      const existingMovies = await db.getAllAsync<Movie>(
        "SELECT title, year FROM movies"
      );

      const existingSet = new Set(
        (existingMovies || []).map((m) => `${m.title}_${m.year}`)
      );

      let importedCount = 0;
      // Map suggested movies và insert vào DB
      for (const movie of suggestedMovies) {
        const title = movie.title;
        const year = movie.year;
        const rating = movie.rating;

        // Check trùng lặp
        const key = `${title}_${year}`;
        if (!existingSet.has(key) && title) {
          await insertMovie(title, year, rating);
          importedCount++;
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

  const renderMovieItem = ({ item }: { item: Movie }) => {
    const ratingColor = item.rating ? "#fbbf24" : "#d1d5db";
    const watchedStyle = item.watched
      ? styles.watchedItem
      : styles.unwatchedItem;

    return (
      <TouchableOpacity
        style={[styles.movieItem, watchedStyle]}
        onPress={() => handleToggleWatched(item)}
        activeOpacity={0.7}
      >
        <View style={styles.movieContent}>
          <Text
            style={[
              styles.movieTitle,
              item.watched && styles.movieTitleWatched,
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <View style={styles.movieMeta}>
            {item.year && <Text style={styles.metaText}>{item.year}</Text>}
            {item.rating && (
              <Text style={[styles.metaText, { color: ratingColor }]}>
                ★ {item.rating}/5
              </Text>
            )}
            {item.watched ? (
              <Text style={styles.watchedBadge}>✓ Đã xem</Text>
            ) : (
              <Text style={styles.unwatchedBadge}>Chưa xem</Text>
            )}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditMovie(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.editButtonText}>Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMovie(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteButtonText}>Xóa</Text>
          </TouchableOpacity>
        </View>

        {item.watched && <View style={styles.checkIcon} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Lỗi: {error}</Text>
      </View>
    );
  }

  if (movies.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyStateText}>
          Chưa có phim nào trong danh sách.
        </Text>
        <Text style={styles.emptyStateSubText}>
          Nhấn nút "+" để thêm phim mới
        </Text>
        <AddMovieModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAdd={handleAddMovie}
        />
      </View>
    );
  }

  return (
    <>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm phim..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterWatched === "all" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterWatched("all")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterWatched === "all" && styles.filterButtonTextActive,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterWatched === "watched" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterWatched("watched")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterWatched === "watched" && styles.filterButtonTextActive,
            ]}
          >
            Đã xem
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterWatched === "unwatched" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterWatched("unwatched")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterWatched === "unwatched" && styles.filterButtonTextActive,
            ]}
          >
            Chưa xem
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.importButtonContainer}>
        <TouchableOpacity
          style={styles.importButton}
          onPress={handleImportFromAPI}
          disabled={importLoading}
          activeOpacity={0.7}
        >
          {importLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.importButtonText}>📥 Import từ API</Text>
          )}
        </TouchableOpacity>
      </View>

      {filteredMovies.length === 0 ? (
        <View style={styles.emptySearchContainer}>
          <Text style={styles.emptySearchText}>
            Không tìm thấy phim phù hợp
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMovies}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AddMovieModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddMovie}
      />
      <EditMovieModal
        visible={editModalVisible}
        movie={selectedMovie}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedMovie(null);
        }}
        onUpdate={handleUpdateMovie}
      />
    </>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f3f4f6",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#fff",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#dbeafe",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterButtonTextActive: {
    color: "#3b82f6",
  },
  importButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  importButton: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  importButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptySearchText: {
    fontSize: 16,
    color: "#9ca3af",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  movieItem: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  unwatchedItem: {
    backgroundColor: "#f9fafb",
  },
  watchedItem: {
    backgroundColor: "#f0fdf4",
    borderLeftColor: "#22c55e",
  },
  movieContent: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  movieTitleWatched: {
    color: "#6b7280",
    textDecorationLine: "line-through",
  },
  movieMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: "#6b7280",
  },
  watchedBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#22c55e",
    backgroundColor: "#dcfce7",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  unwatchedBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ef4444",
    backgroundColor: "#fee2e2",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#22c55e",
    marginLeft: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#3b82f6",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ef4444",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "600",
    lineHeight: 40,
  },
});
