import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CreateTodoInput, Todo, TodoFilter, UpdateTodoInput } from '../../types/todo.types';
import { getDB } from '../database';

const TODOS_STORAGE_KEY = 'myplanner_todos';

class TodoRepository {
    private async getWebTodos(): Promise<Todo[]> {
        try {
            const data = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
            if (data) return JSON.parse(data);
        } catch (error) {
            console.error('Failed to parse web todos', error);
        }
        return [];
    }

    private async setWebTodos(todos: Todo[]): Promise<void> {
        try {
            await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
        } catch (error) {
            console.error('Failed to save web todos', error);
        }
    }

    async insert(todo: CreateTodoInput): Promise<Todo> {
        const timestamp = new Date().toISOString();
        if (Platform.OS === 'web') {
            const todos = await this.getWebTodos();
            const newTodo: Todo = {
                id: Date.now(),
                title: todo.title,
                description: todo.description || null,
                list_id: todo.list_id || null,
                priority: todo.priority || 'medium',
                status: 'pending',
                date_type: todo.date_type || 'none',
                start_date: todo.start_date || null,
                end_date: todo.end_date || null,
                due_time: todo.due_time || null,
                is_recurring: todo.is_recurring || false,
                tags: todo.tags || [],
                position: todo.position || 0,
                created_at: timestamp,
                updated_at: timestamp,
                completed_at: null,
            };
            todos.push(newTodo);
            await this.setWebTodos(todos);
            return newTodo;
        }

        const db = getDB();
        const tagsJson = JSON.stringify(todo.tags || []);

        const result = await db.runAsync(
            `INSERT INTO todos (
        title, description, list_id, priority, date_type, 
        start_date, end_date, due_time, is_recurring, tags, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                todo.title,
                todo.description || null,
                todo.list_id || null,
                todo.priority || 'medium',
                todo.date_type || 'none',
                todo.start_date || null,
                todo.end_date || null,
                todo.due_time || null,
                todo.is_recurring ? 1 : 0,
                tagsJson,
                todo.position || 0
            ]
        );

        return (await this.findById(result.lastInsertRowId))!;
    }

    async findById(id: number): Promise<Todo | null> {
        if (Platform.OS === 'web') {
            const todos = await this.getWebTodos();
            return todos.find(t => t.id === id) || null;
        }

        const db = getDB();
        const result = await db.getAllAsync('SELECT * FROM todos WHERE id = ?', [id]);
        if (result.length === 0) return null;
        return this.mapRowToTodo(result[0] as any);
    }

    async findAll(filter?: TodoFilter): Promise<Todo[]> {
        if (Platform.OS === 'web') {
            let todos = await this.getWebTodos();
            if (filter) {
                if (filter.status) todos = todos.filter(t => t.status === filter.status);
                if (filter.priority) todos = todos.filter(t => t.priority === filter.priority);
                if (filter.date) todos = todos.filter(t => t.start_date === filter.date || t.date_type === 'none');
                if (filter.exclude_archived) todos = todos.filter(t => t.status !== 'archived');
            }
            // Sort by position ASC, then created_at DESC (simulated)
            todos.sort((a, b) => {
                if (a.position !== b.position) return a.position - b.position;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            if (filter?.limit) {
                todos = todos.slice(0, filter.limit);
            }
            return todos;
        }

        const db = getDB();
        let query = 'SELECT * FROM todos WHERE 1=1';
        let params: any[] = [];

        if (filter) {
            if (filter.status) {
                query += ' AND status = ?';
                params.push(filter.status);
            }
            if (filter.priority) {
                query += ' AND priority = ?';
                params.push(filter.priority);
            }
            if (filter.date) {
                query += ' AND (start_date = ? OR date_type = "none")';
                params.push(filter.date);
            }
            if (filter.exclude_archived) {
                query += ' AND status != "archived"';
            }
        }

        query += ' ORDER BY position ASC, created_at DESC';

        if (filter?.limit) {
            query += ' LIMIT ?';
            params.push(filter.limit);
        }

        const rows = await db.getAllAsync(query, params);
        return rows.map((row: any) => this.mapRowToTodo(row));
    }

    async update(id: number, input: UpdateTodoInput): Promise<Todo> {
        const timestamp = new Date().toISOString();

        if (Platform.OS === 'web') {
            const todos = await this.getWebTodos();
            const index = todos.findIndex(t => t.id === id);
            if (index === -1) throw new Error('Todo not found');

            todos[index] = { ...todos[index], ...input, updated_at: timestamp };
            await this.setWebTodos(todos);
            return todos[index];
        }

        const db = getDB();
        const current = await this.findById(id);
        if (!current) throw new Error('Todo not found');

        const ALLOWED_COLUMNS = new Set([
            'title', 'description', 'list_id', 'priority', 'status',
            'date_type', 'start_date', 'end_date', 'due_time',
            'is_recurring', 'tags', 'position',
        ]);

        const mappedInput: any = { ...input };
        if (input.tags) {
            mappedInput.tags = JSON.stringify(input.tags);
        }
        if (mappedInput.is_recurring !== undefined) {
            mappedInput.is_recurring = mappedInput.is_recurring ? 1 : 0;
        }

        const keys = Object.keys(mappedInput).filter(k => ALLOWED_COLUMNS.has(k));
        if (keys.length === 0) return current;

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => mappedInput[k]);

        await db.runAsync(
            `UPDATE todos SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [...values, id]
        );

        return (await this.findById(id))!;
    }

    async complete(id: number): Promise<Todo> {
        const timestamp = new Date().toISOString();
        if (Platform.OS === 'web') {
            const todos = await this.getWebTodos();
            const index = todos.findIndex(t => t.id === id);
            if (index === -1) throw new Error('Todo not found');

            todos[index] = { ...todos[index], status: 'completed', completed_at: timestamp, updated_at: timestamp };
            await this.setWebTodos(todos);
            return todos[index];
        }

        const db = getDB();
        const existing = await this.findById(id);
        if (!existing) throw new Error('Todo not found');

        await db.runAsync(
            `UPDATE todos SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [id]
        );
        return (await this.findById(id))!;
    }

    async delete(id: number): Promise<void> {
        if (Platform.OS === 'web') {
            const todos = await this.getWebTodos();
            await this.setWebTodos(todos.filter(t => t.id !== id));
            return;
        }

        const db = getDB();
        await db.runAsync('DELETE FROM todos WHERE id = ?', [id]);
    }

    private mapRowToTodo(row: any): Todo {
        let tags: string[] = [];
        try {
            tags = JSON.parse(row.tags || '[]');
        } catch {
            tags = [];
        }
        return {
            ...row,
            is_recurring: Boolean(row.is_recurring),
            tags,
        };
    }
}

export const todoRepository = new TodoRepository();
