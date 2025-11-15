import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { Movie, MovieFormData } from "@/types/Movie";
import { AddMovieModal } from "./AddMovieModal";
import { EditMovieModal } from "./EditMovieModal";
import { useMovies, SortOption } from "@/hooks/useMovies";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Mới nhất", value: "newest" },
  { label: "Cũ nhất", value: "oldest" },
  { label: "Năm (cũ→mới)", value: "year-asc" },
  { label: "Năm (mới→cũ)", value: "year-desc" },
  { label: "Rating cao", value: "rating" },
];

export const MovieListScreen: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const {
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
    handleEditMovie: hookEditMovie,
    handleUpdateMovie,
    handleDeleteMovie,
    handleImportFromAPI,
    selectedMovie,
    setSelectedMovie,
  } = useMovies();

  const handleEditMovie = (movie: Movie) => {
    hookEditMovie(movie);
    setEditModalVisible(true);
  };

  const handleAddMovieSubmit = async (data: MovieFormData) => {
    try {
      await handleAddMovie(data);
      setModalVisible(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleUpdateMovieSubmit = async (
    movieId: number,
    data: MovieFormData
  ) => {
    try {
      await handleUpdateMovie(selectedMovie!, data);
      setEditModalVisible(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  if (loading && movies.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Đang tải danh sách phim...</Text>
      </View>
    );
  }

  if (error && movies.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Lỗi: {error}</Text>
      </View>
    );
  }

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
              <Text style={styles.unwatchedBadge}>○ Chưa xem</Text>
            )}
          </View>
        </View>

        <View style={styles.movieActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => handleEditMovie(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteMovie(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm phim..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            filterWatched === "all" && styles.filterBtnActive,
          ]}
          onPress={() => setFilterWatched("all")}
        >
          <Text
            style={[
              styles.filterBtnText,
              filterWatched === "all" && styles.filterBtnTextActive,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            filterWatched === "watched" && styles.filterBtnActive,
          ]}
          onPress={() => setFilterWatched("watched")}
        >
          <Text
            style={[
              styles.filterBtnText,
              filterWatched === "watched" && styles.filterBtnTextActive,
            ]}
          >
            Đã xem
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            filterWatched === "unwatched" && styles.filterBtnActive,
          ]}
          onPress={() => setFilterWatched("unwatched")}
        >
          <Text
            style={[
              styles.filterBtnText,
              filterWatched === "unwatched" && styles.filterBtnTextActive,
            ]}
          >
            Chưa xem
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort and Action Buttons */}
      <View style={styles.actionBar}>
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Text style={styles.sortBtnText}>
              📊 {SORT_OPTIONS.find((o) => o.value === sortOption)?.label}
            </Text>
          </TouchableOpacity>
          {showSortMenu && (
            <View style={styles.sortMenu}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortMenuItem,
                    sortOption === option.value && styles.sortMenuItemActive,
                  ]}
                  onPress={() => {
                    setSortOption(option.value);
                    setShowSortMenu(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortMenuItemText,
                      sortOption === option.value &&
                        styles.sortMenuItemTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.importBtn}
          onPress={handleImportFromAPI}
          disabled={importLoading}
        >
          {importLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.importBtnText}>📥 Import</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Movie List */}
      {filteredAndSortedMovies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchText
              ? "Không tìm thấy phim nào 🔍"
              : "Danh sách phim trống 📽️"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedMovies}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadMovies}
              colors={["#3b82f6"]}
              tintColor="#3b82f6"
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Add Movie FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modals */}
      <AddMovieModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddMovieSubmit}
      />
      {selectedMovie && (
        <EditMovieModal
          visible={editModalVisible}
          movie={selectedMovie}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedMovie(null);
          }}
          onUpdate={handleUpdateMovieSubmit}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    textAlign: "center",
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    color: "#333",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: "#3b82f6",
  },
  filterBtnText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  filterBtnTextActive: {
    color: "#fff",
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  sortContainer: {
    flex: 1,
    position: "relative",
  },
  sortBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  sortBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  sortMenu: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sortMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sortMenuItemActive: {
    backgroundColor: "#f0f4ff",
  },
  sortMenuItemText: {
    fontSize: 13,
    color: "#333",
  },
  sortMenuItemTextActive: {
    color: "#6366f1",
    fontWeight: "600",
  },
  importBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 90,
    alignItems: "center",
  },
  importBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 80,
  },
  movieItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  watchedItem: {
    borderLeftColor: "#10b981",
    opacity: 0.7,
  },
  unwatchedItem: {
    borderLeftColor: "#f59e0b",
  },
  movieContent: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 6,
  },
  movieTitleWatched: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  movieMeta: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 12,
    color: "#666",
  },
  watchedBadge: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "600",
  },
  unwatchedBadge: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "600",
  },
  movieActions: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    justifyContent: "center",
    alignItems: "center",
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#dbeafe",
  },
  deleteBtn: {
    justifyContent: "center",
    alignItems: "center",
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#fee2e2",
  },
  actionBtnText: {
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "300",
  },
});
