import type { Database, Field, FieldMapping, ImportedJSON, Table } from '@/types';
import { extractMappingsFromComment } from '@/utils/fieldMapping';

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
  fieldMappings: FieldMapping[];
  error?: string;
}

function collectFieldMappings(databases: Database[]): FieldMapping[] {
  const fieldMappings: FieldMapping[] = [];

  for (const db of databases) {
    for (const table of db.tables) {
      const tableId = `${db.name}.${table.name}`;
      for (const field of table.fields) {
        const mapping = extractMappingsFromComment(field.comment, tableId, field.name);
        if (mapping) {
          fieldMappings.push(mapping);
        }
      }
    }
  }

  return fieldMappings;
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
        fieldMappings: collectFieldMappings([legacyDb]),
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
        fieldMappings: collectFieldMappings([db]),
      };
    }

    if (!Array.isArray((parsed as ImportedJSON).databases)) {
      return {
        success: false,
        databases: [],
        fieldMappings: [],
        error: 'Invalid format: missing "databases" array',
      };
    }

    const result: ParseResult = {
      success: true,
      databases: (parsed as ImportedJSON).databases.map(parseDatabase),
      fieldMappings: [],
    };

    result.fieldMappings = collectFieldMappings(result.databases);

    return result;
  } catch (e) {
    return {
      success: false,
      databases: [],
      fieldMappings: [],
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
