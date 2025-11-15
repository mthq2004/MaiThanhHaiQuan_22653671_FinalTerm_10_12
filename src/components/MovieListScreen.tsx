import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { getDB } from "@/db/db";
import { Movie } from "@/types/movie";

export const MovieListScreen: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const renderMovieItem = ({ item }: { item: Movie }) => {
    const ratingColor = item.rating ? "#fbbf24" : "#d1d5db";
    const watchedStyle = item.watched
      ? styles.watchedItem
      : styles.unwatchedItem;

    return (
      <TouchableOpacity style={[styles.movieItem, watchedStyle]}>
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
      </View>
    );
  }

  return (
    <FlatList
      data={movies}
      renderItem={renderMovieItem}
      keyExtractor={(item) => item.id.toString()}
      style={styles.list}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
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
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
  },
});
