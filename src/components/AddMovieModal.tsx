import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MovieFormData } from "@/types/movie";

interface AddMovieModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (movieData: MovieFormData) => Promise<void>;
}

export const AddMovieModal: React.FC<AddMovieModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    year?: string;
    rating?: string;
  }>({});

  const currentYear = new Date().getFullYear();

  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};

    // Validate title
    if (!title || title.trim() === "") {
      newErrors.title = "Tên phim không được để trống";
    }

    // Validate year
    if (year) {
      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        newErrors.year = `Năm phải từ 1900 đến ${currentYear}`;
      }
    }

    // Validate rating
    if (rating) {
      const ratingNum = parseInt(rating, 10);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        newErrors.rating = "Đánh giá phải từ 1 đến 5";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, year, rating, currentYear]);

  const handleAdd = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const movieData: MovieFormData = {
        title: title.trim(),
        year: year ? parseInt(year, 10) : null,
        rating: rating ? parseInt(rating, 10) : null,
      };

      await onAdd(movieData);

      // Reset form
      setTitle("");
      setYear("");
      setRating("");
      setErrors({});
      onClose();
    } catch (err) {
      Alert.alert(
        "Lỗi",
        err instanceof Error ? err.message : "Thêm phim thất bại"
      );
    } finally {
      setLoading(false);
    }
  }, [title, year, rating, validateForm, onAdd, onClose]);

  const handleClose = useCallback(() => {
    setTitle("");
    setYear("");
    setRating("");
    setErrors({});
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <Text style={styles.cancelButton}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thêm phim mới</Text>
          <TouchableOpacity
            onPress={handleAdd}
            disabled={loading}
            style={styles.addButtonHeader}
          >
            <Text style={styles.addButtonText}>
              {loading ? "Đang thêm..." : "Thêm"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tên phim *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="VD: Inception"
              value={title}
              onChangeText={setTitle}
              editable={!loading}
              placeholderTextColor="#d1d5db"
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          {/* Year Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Năm phát hành</Text>
            <TextInput
              style={[styles.input, errors.year && styles.inputError]}
              placeholder={`VD: ${currentYear}`}
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              editable={!loading}
              placeholderTextColor="#d1d5db"
            />
            {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
          </View>

          {/* Rating Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Đánh giá (1-5)</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.ratingButton,
                    rating === r.toString() && styles.ratingButtonActive,
                  ]}
                  onPress={() => setRating(r.toString())}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.ratingButtonText,
                      rating === r.toString() && styles.ratingButtonTextActive,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.rating && (
              <Text style={styles.errorText}>{errors.rating}</Text>
            )}
          </View>

          {/* Help Text */}
          <View style={styles.helpText}>
            <Text style={styles.helpTextLabel}>* = Bắt buộc</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  cancelButton: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  addButtonHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingButtonActive: {
    borderColor: "#fbbf24",
    backgroundColor: "#fffbeb",
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  ratingButtonTextActive: {
    color: "#f59e0b",
  },
  helpText: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  helpTextLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
});
