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
