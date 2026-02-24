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

      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'general',
        frequency_type TEXT DEFAULT 'daily',
        specific_days TEXT DEFAULT '[]',
        times_per_week INTEGER,
        time_of_day TEXT DEFAULT 'anytime',
        reminder_time TEXT,
        color TEXT DEFAULT '#00BFA5',
        icon TEXT DEFAULT 'check-circle',
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        total_completions INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        start_date TEXT,
        end_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS habit_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
        UNIQUE(habit_id, date)
      );

      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'general',
        goal_type TEXT DEFAULT 'achievement',
        target_value REAL,
        current_value REAL DEFAULT 0,
        unit TEXT,
        duration_type TEXT DEFAULT 'custom',
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'not_started',
        priority TEXT DEFAULT 'medium',
        color TEXT DEFAULT '#4CAF50',
        icon TEXT DEFAULT 'target',
        completed_at DATETIME,
        completion_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS goal_milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        target_date TEXT,
        is_completed BOOLEAN DEFAULT 0,
        completed_at DATETIME,
        position INTEGER DEFAULT 0,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        event_type TEXT DEFAULT 'single',
        start_datetime TEXT NOT NULL,
        end_datetime TEXT,
        is_all_day BOOLEAN DEFAULT 0,
        location TEXT,
        color TEXT DEFAULT '#1A73E8',
        category TEXT DEFAULT 'general',
        is_recurring BOOLEAN DEFAULT 0,
        recurring_pattern TEXT,
        status TEXT DEFAULT 'upcoming',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── Sticky Notes ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sticky_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        color TEXT NOT NULL DEFAULT '#FFE082',
        is_pinned BOOLEAN DEFAULT 0,
        position INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── Mood Tracker ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS mood_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        mood TEXT NOT NULL,
        mood_score INTEGER NOT NULL,
        energy_level INTEGER DEFAULT 3,
        notes TEXT,
        tags TEXT DEFAULT '[]',
        activities TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── Expense Tracker ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'attach-money',
        color TEXT NOT NULL DEFAULT '#4CAF50',
        budget_limit REAL,
        is_default BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        expense_type TEXT DEFAULT 'expense',
        date TEXT NOT NULL,
        notes TEXT,
        payment_method TEXT DEFAULT 'cash',
        is_recurring BOOLEAN DEFAULT 0,
        tags TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
      );
    `);

    // ── Planning Workspace ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS planning_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL DEFAULT '#4A9BE2',
        icon TEXT NOT NULL DEFAULT 'folder',
        cover_image TEXT,
        is_archived BOOLEAN DEFAULT 0,
        position INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS planning_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL DEFAULT 'Untitled',
        content TEXT NOT NULL DEFAULT '',
        position INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES planning_projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS planning_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        file_uri TEXT NOT NULL,
        file_type TEXT NOT NULL DEFAULT 'other',
        file_size INTEGER DEFAULT 0,
        thumbnail_uri TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES planning_projects(id) ON DELETE CASCADE
      );
    `);

    // ── Pomodoro / Focus Sessions ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_type TEXT NOT NULL DEFAULT 'pomodoro',
        duration_minutes INTEGER NOT NULL DEFAULT 25,
        actual_seconds INTEGER DEFAULT 0,
        status TEXT DEFAULT 'completed',
        linked_todo_id INTEGER,
        linked_goal_id INTEGER,
        notes TEXT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      );
    `);

    // ── Alarms ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS alarms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL DEFAULT 'Alarm',
        hour INTEGER NOT NULL,
        minute INTEGER NOT NULL,
        is_enabled BOOLEAN DEFAULT 1,
        repeat_days TEXT DEFAULT '[]',
        sound_uri TEXT,
        sound_name TEXT DEFAULT 'Default',
        vibrate BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    // Create default expense categories if none exist
    const catRow = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM expense_categories');
    if (catRow[0].count === 0) {
      await db.execAsync(`
        INSERT INTO expense_categories (name, icon, color, is_default) VALUES
          ('Food & Drinks', 'restaurant', '#FF7043', 1),
          ('Transport', 'directions-car', '#42A5F5', 1),
          ('Shopping', 'shopping-bag', '#AB47BC', 1),
          ('Bills', 'receipt', '#26A69A', 1),
          ('Entertainment', 'movie', '#FFA726', 1),
          ('Health', 'local-hospital', '#EF5350', 1),
          ('Education', 'school', '#5C6BC0', 1),
          ('Other', 'more-horiz', '#78909C', 1);
      `);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
