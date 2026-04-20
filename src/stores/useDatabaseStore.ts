import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Database, Tag, Table } from '@/types';
import { parseJSON } from '@/utils/jsonParser';
import { parseSQL } from '@/utils/sqlParser';

interface DatabaseState {
  databases: Database[];
  tags: Tag[];
  selectedDatabase: string | null;
  activeTagIds: string[];
  expandedDatabases: string[];
  expandedTables: string[];

  importJSON: (jsonString: string, dbName?: string) => { success: boolean; error?: string };
  importSQL: (sqlString: string, dbName: string) => { success: boolean; error?: string };
  createDatabase: (name: string, comment?: string) => Database;
  setSelectedDatabase: (name: string | null) => void;
  updateDatabase: (dbName: string, updates: Partial<Pick<Database, 'name' | 'comment'>>) => void;
  updateTable: (dbName: string, tableName: string, updates: Partial<Pick<Table, 'name' | 'comment'>>) => void;
  toggleTag: (tagId: string) => void;
  clearTags: () => void;
  createTag: (name: string) => Tag;
  deleteTag: (id: string) => void;
  addTagToTables: (tableIds: string[], tagId: string) => void;
  removeTagFromTables: (tableIds: string[], tagId: string) => void;
  toggleDatabaseExpand: (name: string) => void;
  toggleTableExpand: (tableId: string) => void;
  getFilteredTables: () => Table[];
  getAllTables: () => Table[];
  getTagById: (id: string) => Tag | undefined;
  getTableById: (tableId: string) => Table | undefined;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export const useDatabaseStore = create<DatabaseState>()(
  persist(
    (set, get) => ({
      databases: [],
      tags: [],
      selectedDatabase: null,
      activeTagIds: [],
      expandedDatabases: [],
      expandedTables: [],

      importJSON: (jsonString, dbName) => {
        const result = parseJSON(jsonString);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        const targetDbName = dbName || result.databases[0]?.name || 'database';

        if (dbName && result.databases.length > 0) {
          result.databases[0].name = targetDbName;
        }

        const existingDb = get().databases.find((d) => d.name === targetDbName);

        if (existingDb) {
          const existingTableNames = new Set(existingDb.tables.map((t) => t.name));
          const newTables = result.databases[0].tables.filter((t) => !existingTableNames.has(t.name));

          if (newTables.length > 0) {
            const updatedDb: Database = {
              ...existingDb,
              tables: [...existingDb.tables, ...newTables],
            };

            set({
              databases: get().databases.map((d) => (d.name === targetDbName ? updatedDb : d)),
              expandedDatabases: get().expandedDatabases.includes(targetDbName)
                ? get().expandedDatabases
                : [...get().expandedDatabases, targetDbName],
            });
          }
        } else {
          const expandedDatabases = [...get().expandedDatabases, targetDbName];
          set({
            databases: [
              ...get().databases,
              ...result.databases.map((db) => {
                if (dbName) db.name = targetDbName;
                return db;
              }),
            ],
            selectedDatabase: get().selectedDatabase || targetDbName,
            expandedDatabases,
          });
        }

        return { success: true };
      },

      importSQL: (sqlString, dbName) => {
        const result = parseSQL(sqlString);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        const targetDbName = dbName || 'default_db';

        // 更新解析结果中的数据库名为目标名称
        result.databases.forEach(db => db.name = targetDbName);

        const existingDb = get().databases.find((d) => d.name === targetDbName);

        if (existingDb) {
          const existingTableNames = new Set(existingDb.tables.map((t) => t.name));
          const newTables: Table[] = [];

          for (const db of result.databases) {
            for (const table of db.tables) {
              if (!existingTableNames.has(table.name)) {
                newTables.push(table);
                existingTableNames.add(table.name);
              }
            }
          }

          if (newTables.length > 0) {
            const updatedDb: Database = {
              ...existingDb,
              tables: [...existingDb.tables, ...newTables],
            };

            set({
              databases: get().databases.map((d) => (d.name === targetDbName ? updatedDb : d)),
              expandedDatabases: get().expandedDatabases.includes(targetDbName)
                ? get().expandedDatabases
                : [...get().expandedDatabases, targetDbName],
            });
          }
        } else {
          const expandedDatabases = [...get().expandedDatabases, targetDbName];
          set({
            databases: [...get().databases, ...result.databases],
            selectedDatabase: get().selectedDatabase || targetDbName,
            expandedDatabases,
          });
        }

        return { success: true };
      },

      createDatabase: (name, comment) => {
        const newDb: Database = { name, comment: comment || '', tables: [] };
        set((state) => ({
          databases: [...state.databases, newDb],
          expandedDatabases: [...state.expandedDatabases, name],
          selectedDatabase: name,
        }));
        return newDb;
      },

      setSelectedDatabase: (name) => {
        set({ selectedDatabase: name });
      },

      updateDatabase: (dbName, updates) => {
        set((state) => ({
          databases: state.databases.map((db) =>
            db.name === dbName ? { ...db, ...updates } : db
          ),
          selectedDatabase: state.selectedDatabase === dbName && updates.name
            ? updates.name
            : state.selectedDatabase,
        }));
      },

      updateTable: (dbName, tableName, updates) => {
        set((state) => ({
          databases: state.databases.map((db) =>
            db.name === dbName
              ? {
                  ...db,
                  tables: db.tables.map((t) =>
                    t.name === tableName ? { ...t, ...updates } : t
                  ),
                }
              : db
          ),
        }));
      },

      toggleTag: (tagId) => {
        const { activeTagIds } = get();
        if (activeTagIds.includes(tagId)) {
          set({ activeTagIds: activeTagIds.filter((id) => id !== tagId) });
        } else {
          set({ activeTagIds: [...activeTagIds, tagId] });
        }
      },

      clearTags: () => {
        set({ activeTagIds: [] });
      },

      createTag: (name) => {
        const newTag: Tag = { id: generateId(), name };
        set((state) => ({ tags: [...state.tags, newTag] }));
        return newTag;
      },

      deleteTag: (id) => {
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
          databases: state.databases.map((db) => ({
            ...db,
            tables: db.tables.map((table) => ({
              ...table,
              tags: table.tags.filter((tagId) => tagId !== id),
            })),
          })),
          activeTagIds: state.activeTagIds.filter((tagId) => tagId !== id),
        }));
      },

      addTagToTables: (tableIds, tagId) => {
        set((state) => ({
          databases: state.databases.map((db) => ({
            ...db,
            tables: db.tables.map((table) => {
              if (tableIds.includes(`${db.name}.${table.name}`) && !table.tags.includes(tagId)) {
                return { ...table, tags: [...table.tags, tagId] };
              }
              return table;
            }),
          })),
        }));
      },

      removeTagFromTables: (tableIds, tagId) => {
        set((state) => ({
          databases: state.databases.map((db) => ({
            ...db,
            tables: db.tables.map((table) => {
              if (tableIds.includes(`${db.name}.${table.name}`)) {
                return { ...table, tags: table.tags.filter((t) => t !== tagId) };
              }
              return table;
            }),
          })),
        }));
      },

      toggleDatabaseExpand: (name) => {
        set((state) => ({
          expandedDatabases: state.expandedDatabases.includes(name)
            ? state.expandedDatabases.filter((n) => n !== name)
            : [...state.expandedDatabases, name],
        }));
      },

      toggleTableExpand: (tableId) => {
        set((state) => ({
          expandedTables: state.expandedTables.includes(tableId)
            ? state.expandedTables.filter((id) => id !== tableId)
            : [...state.expandedTables, tableId],
        }));
      },

      getFilteredTables: () => {
        const { databases, selectedDatabase, activeTagIds } = get();
        if (!selectedDatabase) return [];
        const db = databases.find((d) => d.name === selectedDatabase);
        if (!db) return [];
        let tables = db.tables;
        if (activeTagIds.length > 0) {
          tables = tables.filter((table) =>
            activeTagIds.some((tagId) => table.tags.includes(tagId))
          );
        }
        return tables;
      },

      getAllTables: () => {
        const { databases, selectedDatabase } = get();
        if (!selectedDatabase) return [];
        const db = databases.find((d) => d.name === selectedDatabase);
        return db?.tables || [];
      },

      getTagById: (id) => {
        return get().tags.find((t) => t.id === id);
      },

      getTableById: (tableId) => {
        const { databases } = get();
        const [dbName, tableName] = tableId.split('.');
        const db = databases.find((d) => d.name === dbName);
        return db?.tables.find((t) => t.name === tableName);
      },
    }),
    {
      name: 'sql-query-agent-storage',
    }
  )
);
