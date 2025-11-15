import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { initializeDB, createMoviesTable, seedSampleMovies } from "@/db/db";
import { MovieListScreen } from "@/components/MovieListScreen";

export default function Page() {
  const insets = useSafeAreaInsets();
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupDB = async () => {
      try {
        await initializeDB();
        await createMoviesTable();
        await seedSampleMovies();
        setDbReady(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize database"
        );
        setDbReady(false);
      }
    };
    setupDB();
  }, []);

  if (error) {
    return (
      <View
        className="flex flex-1 justify-center items-center bg-white"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-red-500 text-lg">Error: {error}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View
        className="flex flex-1 justify-center items-center bg-white"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-blue-600 text-lg">Initializing database...</Text>
      </View>
    );
  }

  return (
    <View className="flex flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-3 bg-blue-600">
        <Text className="text-white text-xl font-bold">Danh sách phim</Text>
      </View>
      <MovieListScreen />
    </View>
  );
}
