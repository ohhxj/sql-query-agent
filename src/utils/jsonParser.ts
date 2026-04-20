import type { Database, Field, ImportedJSON, Table, Tag } from '@/types';

interface LegacyJSON {
  database?: string;
  tables?: Array<{
    name: string;
    comment?: string;
    fields: Array<{
      name: string;
      type: string;
      comment?: string;
    }>;
  }>;
}

interface DBAExportFormat {
  header?: string[][];
  data?: Array<Record<string, string>>;
  table_name?: string;
  table_comment?: string;
}

function isLegacyFormat(json: unknown): json is LegacyJSON {
  return (json as LegacyJSON).database !== undefined && (json as LegacyJSON).tables !== undefined;
}

function isDBAExportFormat(json: unknown): json is DBAExportFormat {
  const dba = json as DBAExportFormat;
  return Array.isArray(dba.header) && Array.isArray(dba.data) && dba.data.length > 0;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function parseField(raw: { name: string; type: string; comment?: string }): Field {
  return {
    name: raw.name,
    type: raw.type,
    comment: raw.comment || '',
  };
}

function parseTable(raw: { name: string; comment?: string; fields: Array<{ name: string; type: string; comment?: string }> }): Table {
  return {
    name: raw.name,
    comment: raw.comment || '',
    tags: [],
    fields: raw.fields.map(parseField),
  };
}

function parseDatabase(raw: { name: string; comment?: string; tables: Array<{ name: string; comment?: string; fields: Array<{ name: string; type: string; comment?: string }> }> }): Database {
  return {
    name: raw.name,
    comment: raw.comment || '',
    tables: raw.tables.map(parseTable),
  };
}

export interface ParseResult {
  success: boolean;
  databases: Database[];
  tags: Tag[];
  error?: string;
}

export function parseJSON(jsonString: string): ParseResult {
  try {
    const parsed = JSON.parse(jsonString);

    if (isLegacyFormat(parsed)) {
      const legacyDb: Database = {
        name: parsed.database || 'database',
        comment: '',
        tables: (parsed.tables || []).map(parseTable),
      };
      return {
        success: true,
        databases: [legacyDb],
        tags: [],
      };
    }

    if (isDBAExportFormat(parsed)) {
      const dba = parsed as DBAExportFormat;
      const tableName = dba.table_name || 'table_1';
      const tableComment = dba.table_comment || '';

      const fields: Field[] = (dba.data || []).map((row) => ({
        name: row['列名'] || row['name'] || '',
        type: row['列类型'] || row['column_type'] || row['type'] || '',
        comment: row['列说明'] || row['column_comment'] || row['comment'] || '',
      })).filter((f) => f.name !== '');

      const table: Table = {
        name: tableName,
        comment: tableComment,
        tags: [],
        fields,
      };

      const db: Database = {
        name: 'database',
        comment: '',
        tables: [table],
      };

      return {
        success: true,
        databases: [db],
        tags: [],
      };
    }

    if (!Array.isArray((parsed as ImportedJSON).databases)) {
      return {
        success: false,
        databases: [],
        tags: [],
        error: 'Invalid format: missing "databases" array',
      };
    }

    const result: ParseResult = {
      success: true,
      databases: (parsed as ImportedJSON).databases.map(parseDatabase),
      tags: (parsed as ImportedJSON).tags || [],
    };

    for (const tag of result.tags) {
      if (!tag.id) {
        tag.id = generateId();
      }
    }

    return result;
  } catch (e) {
    return {
      success: false,
      databases: [],
      tags: [],
      error: `JSON parse error: ${e instanceof Error ? e.message : 'Unknown error'}`,
    };
  }
}

export function validateJSON(jsonString: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : 'Invalid JSON',
    };
  }
}

export function getFieldIcon(type: string): string {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('varchar') || lowerType.includes('char') || lowerType.includes('text')) {
    return '🔤';
  }
  if (lowerType.includes('int') || lowerType.includes('bigint') || lowerType.includes('smallint')) {
    return '🔢';
  }
  if (lowerType.includes('decimal') || lowerType.includes('float') || lowerType.includes('double') || lowerType.includes('numeric')) {
    return '💰';
  }
  if (lowerType.includes('date') || lowerType.includes('datetime') || lowerType.includes('time')) {
    return '📅';
  }
  if (lowerType.includes('bool')) {
    return '🔘';
  }
  return '📦';
}

export function isNumericType(type: string): boolean {
  const lowerType = type.toLowerCase();
  return (
    lowerType.includes('int') ||
    lowerType.includes('decimal') ||
    lowerType.includes('float') ||
    lowerType.includes('double') ||
    lowerType.includes('numeric')
  );
}
