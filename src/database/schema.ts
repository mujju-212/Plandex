import { Platform } from 'react-native';
import { initDB } from './database';

export const initializeDatabase = async () => {
  if (Platform.OS === 'web') {
    console.log('Skipping SQLite init on web. Using AsyncStorage.');
    return;
  }

  const db = await initDB();

  try {
    // Basic settings and pragmas for foreign keys
    // execAsync accepts a single SQL string in recent expo-sqlite
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Create base tables
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS todo_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        position INTEGER NOT NULL,
        is_default BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        date_type TEXT DEFAULT 'none',
        start_date TEXT,
        end_date TEXT,
        due_time TEXT,
        is_recurring BOOLEAN DEFAULT 0,
        tags TEXT DEFAULT '[]',
        position INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (list_id) REFERENCES todo_lists (id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS daily_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        what_i_did TEXT,
        achievements TEXT,
        learnings TEXT,
        challenges TEXT,
        tomorrow_intention TEXT,
        gratitude TEXT,
        productivity_rating INTEGER,
        satisfaction_rating INTEGER,
        completion_rating INTEGER,
        energy_rating INTEGER,
        overall_rating INTEGER,
        mood TEXT,
        tags TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_xp INTEGER DEFAULT 0,
        current_level INTEGER DEFAULT 1,
        current_log_streak INTEGER DEFAULT 0,
        longest_log_streak INTEGER DEFAULT 0,
        total_todos_completed INTEGER DEFAULT 0,
        last_active_date TEXT
      );

      CREATE TABLE IF NOT EXISTS user_badges (
        badge_id TEXT PRIMARY KEY
      );
    `);

    // Ensure at least one stats row exists for gamification/tracking
    const statsRow = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM user_stats');
    const statsExists = statsRow[0];
    if (statsExists.count === 0) {
      await db.runAsync('INSERT INTO user_stats (total_xp, current_level) VALUES (0, 1);');
    }

    // Create a default list if none exists
    const listRow = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM todo_lists');
    const listExists = listRow[0];
    if (listExists.count === 0) {
      await db.runAsync("INSERT INTO todo_lists (name, color, icon, position, is_default) VALUES ('General', '#1A73E8', 'playlist-check', 0, 1);");
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
