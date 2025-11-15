import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { initializeDB, createMoviesTable, seedSampleMovies } from "@/db/db";

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

  return (
    <View
      className="flex flex-1 justify-center items-center bg-white"
      style={{ paddingTop: insets.top }}
    >
      {error ? (
        <Text className="text-red-500 text-lg">Error: {error}</Text>
      ) : dbReady ? (
        <Text className="text-green-600 text-lg font-semibold">
          Database & Table Ready ✓
        </Text>
      ) : (
        <Text className="text-blue-600 text-lg">Initializing database...</Text>
      )}
    </View>
  );
}
