import * as SQLite from 'expo-sqlite';

export const dbName = 'plandex.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Use asynchronous initialization for expo-sqlite
// Concurrency-safe: concurrent calls share the same promise
export const initDB = async () => {
    if (dbInstance) return dbInstance;
    if (!initPromise) {
        initPromise = SQLite.openDatabaseAsync(dbName).then(db => {
            dbInstance = db;
            return db;
        }).catch(err => {
            initPromise = null;
            throw err;
        });
    }
    return initPromise;
};

export const getDB = () => {
    if (!dbInstance) {
        throw new Error('Database not initialized. Call initDB first.');
    }
    return dbInstance;
};
