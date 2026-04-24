import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Database, Table, FieldMapping } from '@/types';
import { parseJSON } from '@/utils/jsonParser';
import { parseSQL } from '@/utils/sqlParser';

interface DatabaseState {
  databases: Database[];
  selectedDatabase: string | null;
  expandedDatabases: string[];
  expandedTables: string[];
  fieldMappings: FieldMapping[];

  importJSON: (jsonString: string, dbName?: string) => { success: boolean; error?: string };
  importSQL: (sqlString: string, dbName: string) => { success: boolean; error?: string };
  setFieldMappings: (mappings: FieldMapping[]) => void;
  createDatabase: (name: string, comment?: string) => Database;
  setSelectedDatabase: (name: string | null) => void;
  updateDatabase: (dbName: string, updates: Partial<Pick<Database, 'name' | 'comment'>>) => void;
  updateTable: (dbName: string, tableName: string, updates: Partial<Pick<Table, 'name' | 'comment'>>) => void;
  deleteTable: (dbName: string, tableName: string) => void;
  deleteDatabase: (dbName: string) => void;
  toggleDatabaseExpand: (name: string) => void;
  toggleTableExpand: (tableId: string) => void;
  getAllTables: () => Table[];
  getTableById: (tableId: string) => Table | undefined;
  setFieldMapping: (tableId: string, fieldName: string, mappings: Record<string, string>) => void;
  getFieldMapping: (tableId: string, fieldName: string) => FieldMapping | undefined;
}

export const useDatabaseStore = create<DatabaseState>()(
  persist(
    (set, get) => ({
      databases: [],
      selectedDatabase: null,
      expandedDatabases: [],
      expandedTables: [],
      fieldMappings: [],

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
                if (dbName) {
                  db.name = targetDbName;
                }
                return db;
              }),
            ],
            selectedDatabase: get().selectedDatabase || targetDbName,
            expandedDatabases,
          });
        }

        if (result.fieldMappings.length > 0) {
          const adjustedMappings = result.fieldMappings.map((mapping) => {
            const [, tableName] = mapping.tableId.split('.');
            return {
              ...mapping,
              tableId: `${targetDbName}.${tableName}`,
            };
          });
          get().setFieldMappings(adjustedMappings);
        }

        return { success: true };
      },

      importSQL: (sqlString, dbName) => {
        const result = parseSQL(sqlString);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        const targetDbName = dbName || 'default_db';

        result.databases.forEach((db) => {
          db.name = targetDbName;
        });

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

        if (result.fieldMappings.length > 0) {
          const adjustedMappings = result.fieldMappings.map((mapping) => {
            const [, tableName] = mapping.tableId.split('.');
            return {
              ...mapping,
              tableId: `${targetDbName}.${tableName}`,
            };
          });
          get().setFieldMappings(adjustedMappings);
        }

        return { success: true };
      },

      setFieldMappings: (mappings) => {
        set((state) => {
          const merged = [...state.fieldMappings];
          for (const m of mappings) {
            const idx = merged.findIndex((em) => em.tableId === m.tableId && em.fieldName === m.fieldName);
            if (idx >= 0) {
              merged[idx] = {
                ...merged[idx],
                ...m,
                mappings: {
                  ...merged[idx].mappings,
                  ...m.mappings,
                },
              };
            } else {
              merged.push(m);
            }
          }
          return { fieldMappings: merged };
        });
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
          selectedDatabase:
            state.selectedDatabase === dbName && updates.name
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

      deleteTable: (dbName, tableName) => {
        set((state) => ({
          databases: state.databases.map((db) =>
            db.name === dbName
              ? {
                  ...db,
                  tables: db.tables.filter((t) => t.name !== tableName),
                }
              : db
          ),
        }));
      },

      deleteDatabase: (dbName) => {
        set((state) => ({
          databases: state.databases.filter((db) => db.name !== dbName),
          selectedDatabase: state.selectedDatabase === dbName ? null : state.selectedDatabase,
          expandedDatabases: state.expandedDatabases.filter((name) => name !== dbName),
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

      getAllTables: () => {
        const { databases, selectedDatabase } = get();
        if (!selectedDatabase) {
          return [];
        }
        const db = databases.find((d) => d.name === selectedDatabase);
        return db?.tables || [];
      },

      getTableById: (tableId) => {
        const { databases } = get();
        const [dbName, tableName] = tableId.split('.');
        const db = databases.find((d) => d.name === dbName);
        return db?.tables.find((t) => t.name === tableName);
      },

      setFieldMapping: (tableId, fieldName, mappings) => {
        set((state) => {
          const existing = state.fieldMappings.find(
            (m) => m.tableId === tableId && m.fieldName === fieldName
          );
          if (existing) {
            return {
              fieldMappings: state.fieldMappings.map((m) =>
                m.tableId === tableId && m.fieldName === fieldName
                  ? { ...m, mappings }
                  : m
              ),
            };
          }
          return {
            fieldMappings: [
              ...state.fieldMappings,
              { tableId, fieldName, mappings },
            ],
          };
        });
      },

      getFieldMapping: (tableId, fieldName) => {
        return get().fieldMappings.find(
          (m) => m.tableId === tableId && m.fieldName === fieldName
        );
      },
    }),
    {
      name: 'sql-query-agent-storage',
    }
  )
);
