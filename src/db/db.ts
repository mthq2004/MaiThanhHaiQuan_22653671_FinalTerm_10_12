import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export const initializeDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) {
    return db;
  }

  try {
    db = await SQLite.openDatabaseAsync("movies.db");
    console.log("Database connected successfully");
    return db;
  } catch (error) {
    console.error("Failed to open database:", error);
    throw error;
  }
};

export const getDB = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDB first.");
  }
  return db;
};

export const closeDB = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log("Database closed");
  }
};

// Create movies table if it doesn't exist
export const createMoviesTable = async (): Promise<void> => {
  const database = getDB();
  try {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        year INTEGER,
        watched INTEGER DEFAULT 0,
        rating INTEGER,
        created_at INTEGER
      );
    `);
    console.log("Movies table created or already exists");
  } catch (error) {
    console.error("Failed to create movies table:", error);
    throw error;
  }
};

// Seed sample movies if table is empty
export const seedSampleMovies = async (): Promise<void> => {
  const database = getDB();
  try {
    const result = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM movies"
    );

    if (result && result.count === 0) {
      const now = Math.floor(Date.now() / 1000);
      const sampleMovies = [
        ["Inception", 2010, 0, 5, now],
        ["Interstellar", 2014, 0, 4, now],
        ["The Dark Knight", 2008, 0, null, now],
      ];

      for (const movie of sampleMovies) {
        await database.runAsync(
          "INSERT INTO movies (title, year, watched, rating, created_at) VALUES (?, ?, ?, ?, ?)",
          movie
        );
      }
      console.log("Sample movies seeded successfully");
    }
  } catch (error) {
    console.error("Failed to seed sample movies:", error);
    throw error;
  }
};

// Insert a new movie
export const insertMovie = async (
  title: string,
  year: number | null,
  rating: number | null
): Promise<number> => {
  const database = getDB();
  try {
    const now = Math.floor(Date.now() / 1000);
    const result = await database.runAsync(
      "INSERT INTO movies (title, year, watched, rating, created_at) VALUES (?, ?, ?, ?, ?)",
      [title, year, 0, rating, now]
    );
    console.log("Movie inserted successfully");
    return result.lastInsertRowId || 0;
  } catch (error) {
    console.error("Failed to insert movie:", error);
    throw error;
  }
};

// Toggle watched status for a movie
export const toggleWatched = async (movieId: number): Promise<void> => {
  const database = getDB();
  try {
    // Get current watched status
    const movie = await database.getFirstAsync<{ watched: number }>(
      "SELECT watched FROM movies WHERE id = ?",
      [movieId]
    );

    if (!movie) {
      throw new Error("Movie not found");
    }

    // Toggle the status (0 -> 1, 1 -> 0)
    const newStatus = movie.watched === 0 ? 1 : 0;
    await database.runAsync("UPDATE movies SET watched = ? WHERE id = ?", [
      newStatus,
      movieId,
    ]);
    console.log(`Movie ${movieId} watched status toggled to ${newStatus}`);
  } catch (error) {
    console.error("Failed to toggle watched status:", error);
    throw error;
  }
};
