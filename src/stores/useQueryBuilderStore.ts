import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AggregateType,
  JoinConfig,
  QueryHistoryItem,
  QueryHistorySnapshot,
  SelectedField,
  Table,
  WhereCondition,
} from '@/types';
import { formatSelectedFieldExpression, isTrueAggregate } from '@/utils/sqlGenerator';

interface OrderByItem {
  field: SelectedField;
  direction: 'ASC' | 'DESC' | null;
}

interface QueryBuilderState {
  mainTable: Table | null;
  selectedFields: SelectedField[];
  joinConfigs: JoinConfig[];
  joinSelectedFields: SelectedField[];
  whereConditions: WhereCondition[];
  groupByFields: string[];
  orderByFields: OrderByItem[];
  limit: number | null;
  queryHistory: QueryHistoryItem[];

  setMainTable: (table: Table | null) => void;
  addField: (field: SelectedField) => void;
  removeField: (field: SelectedField) => void;
  updateFieldAggregate: (field: SelectedField, aggregate: AggregateType) => void;
  clearFields: () => void;

  addGroupByField: (field: string) => void;
  removeGroupByField: (field: string) => void;
  clearGroupByFields: () => void;

  addJoinConfig: (config: Omit<JoinConfig, 'id'>) => void;
  removeJoinConfig: (id: string) => void;
  updateJoinConfig: (id: string, updates: Partial<JoinConfig>) => void;
  addJoinField: (field: SelectedField) => void;
  removeJoinField: (field: SelectedField) => void;

  addWhereCondition: (condition: Omit<WhereCondition, 'id'>) => void;
  removeWhereCondition: (id: string) => void;
  updateWhereCondition: (id: string, updates: Partial<WhereCondition>) => void;
  clearWhereConditions: () => void;

  setOrderBy: (field: SelectedField, direction: 'ASC' | 'DESC' | null) => void;
  removeOrderBy: (field: SelectedField) => void;
  clearOrderBy: () => void;

  setLimit: (limit: number | null) => void;

  saveQueryHistory: (item: Omit<QueryHistoryItem, 'id' | 'createdAt'>) => void;
  restoreQuerySnapshot: (snapshot: QueryHistorySnapshot) => void;
  removeQueryHistory: (id: string) => void;
  clearQueryHistory: () => void;

  reset: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export const useQueryBuilderStore = create<QueryBuilderState>()(
  persist(
    (set, get) => ({
      mainTable: null,
      selectedFields: [],
      joinConfigs: [],
      joinSelectedFields: [],
      whereConditions: [],
      groupByFields: [],
      orderByFields: [],
      limit: null,
      queryHistory: [],

      setMainTable: (table) => {
        set({
          mainTable: table,
          selectedFields: [],
          joinConfigs: [],
          joinSelectedFields: [],
          whereConditions: [],
          groupByFields: [],
          orderByFields: [],
          limit: null,
        });
      },

      addField: (field) => {
        const { selectedFields } = get();
        set({ selectedFields: [...selectedFields, field] });
      },

      removeField: (field) => {
        const fieldExpression = formatSelectedFieldExpression(field);
        set((state) => ({
          selectedFields: state.selectedFields.filter(
            (f) => f.id !== field.id
          ),
          groupByFields: state.groupByFields.filter((f) => f !== fieldExpression),
          orderByFields: state.orderByFields.filter(
            (o) => o.field.id !== field.id
          ),
        }));
      },

      updateFieldAggregate: (field, aggregate) => {
        const previousExpression = formatSelectedFieldExpression(field);
        const nextField = { ...field, aggregate };
        const nextExpression = formatSelectedFieldExpression(nextField);

        set((state) => ({
          selectedFields: state.selectedFields.map((f) => {
            if (f.id === field.id) {
              return { ...f, aggregate };
            }
            return f;
          }),
          groupByFields: state.groupByFields.flatMap((groupByField) => {
            if (groupByField !== previousExpression) {
              return [groupByField];
            }

            if (isTrueAggregate(aggregate)) {
              return [];
            }

            return [nextExpression];
          }),
        }));
      },

      clearFields: () => {
        set({ selectedFields: [], orderByFields: [] });
      },

      addJoinConfig: (config) => {
        const newConfig: JoinConfig = { ...config, id: generateId() };
        set((state) => ({ joinConfigs: [...state.joinConfigs, newConfig] }));
      },

      removeJoinConfig: (id) => {
        set((state) => ({
          joinConfigs: state.joinConfigs.filter((c) => c.id !== id),
          joinSelectedFields: state.joinSelectedFields.filter((f) => f.sourceAlias !== state.joinConfigs.find((c) => c.id === id)?.alias),
        }));
      },

      updateJoinConfig: (id, updates) => {
        set((state) => ({
          joinConfigs: state.joinConfigs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      addJoinField: (field) => {
        const { joinSelectedFields } = get();
        set({ joinSelectedFields: [...joinSelectedFields, field] });
      },

      removeJoinField: (field) => {
        const fieldExpression = formatSelectedFieldExpression(field);
        set((state) => ({
          joinSelectedFields: state.joinSelectedFields.filter(
            (f) => f.id !== field.id
          ),
          groupByFields: state.groupByFields.filter((f) => f !== fieldExpression),
          orderByFields: state.orderByFields.filter(
            (o) => o.field.id !== field.id
          ),
        }));
      },

      addWhereCondition: (condition) => {
        const newCondition: WhereCondition = { ...condition, id: generateId() };
        set((state) => ({ whereConditions: [...state.whereConditions, newCondition] }));
      },

      removeWhereCondition: (id) => {
        set((state) => ({
          whereConditions: state.whereConditions.filter((c) => c.id !== id),
        }));
      },

      updateWhereCondition: (id, updates) => {
        set((state) => ({
          whereConditions: state.whereConditions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      clearWhereConditions: () => {
        set({ whereConditions: [] });
      },

      setOrderBy: (field, direction) => {
        const { orderByFields } = get();
        const existing = orderByFields.find((o) => o.field.id === field.id);

        if (direction === null) {
          set({
            orderByFields: orderByFields.filter((o) => o.field.id !== field.id),
          });
        } else if (existing) {
          set({
            orderByFields: orderByFields.map((o) =>
              o.field.id === field.id
                ? { ...o, direction }
                : o
            ),
          });
        } else {
          set({ orderByFields: [...orderByFields, { field, direction }] });
        }
      },

      removeOrderBy: (field) => {
        set((state) => ({
          orderByFields: state.orderByFields.filter((o) => o.field.id !== field.id),
        }));
      },

      clearOrderBy: () => {
        set({ orderByFields: [] });
      },

      setLimit: (limit) => {
        set({ limit });
      },

      addGroupByField: (field) => {
        const { groupByFields } = get();
        if (!groupByFields.includes(field)) {
          set({ groupByFields: [...groupByFields, field] });
        }
      },

      removeGroupByField: (field) => {
        set((state) => ({
          groupByFields: state.groupByFields.filter((f) => f !== field),
        }));
      },

      clearGroupByFields: () => {
        set({ groupByFields: [] });
      },

      saveQueryHistory: (item) => {
        set((state) => {
          const existingIndex = state.queryHistory.findIndex((history) => history.sql === item.sql);
          const nextItem: QueryHistoryItem = {
            ...item,
            id: existingIndex >= 0 ? state.queryHistory[existingIndex].id : generateId(),
            createdAt: new Date().toISOString(),
          };

          const withoutDuplicate =
            existingIndex >= 0
              ? state.queryHistory.filter((history) => history.id !== state.queryHistory[existingIndex].id)
              : state.queryHistory;

          return {
            queryHistory: [nextItem, ...withoutDuplicate].slice(0, 50),
          };
        });
      },

      restoreQuerySnapshot: (snapshot) => {
        set({
          mainTable: snapshot.mainTable,
          selectedFields: snapshot.selectedFields,
          joinConfigs: snapshot.joinConfigs,
          joinSelectedFields: snapshot.joinSelectedFields,
          whereConditions: snapshot.whereConditions,
          groupByFields: snapshot.groupByFields,
          orderByFields: snapshot.orderByFields,
          limit: snapshot.limit,
        });
      },

      removeQueryHistory: (id) => {
        set((state) => ({
          queryHistory: state.queryHistory.filter((item) => item.id !== id),
        }));
      },

      clearQueryHistory: () => {
        set({ queryHistory: [] });
      },

      reset: () => {
        set({
          mainTable: null,
          selectedFields: [],
          joinConfigs: [],
          joinSelectedFields: [],
          whereConditions: [],
          groupByFields: [],
          orderByFields: [],
          limit: null,
        });
      },
    }),
    {
      name: 'sql-query-agent-query-storage',
      partialize: (state) => ({
        queryHistory: state.queryHistory,
      }),
    }
  )
);
