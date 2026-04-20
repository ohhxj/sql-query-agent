import type { Database, Table, Field } from '@/types';

interface ParseResult {
  success: boolean;
  databases: Database[];
  error?: string;
}

/**
 * 解析 MySQL CREATE TABLE SQL 语句
 * 支持标准格式: create table table_name (...) comment 'xxx'
 */
export function parseSQL(sqlString: string): ParseResult {
  try {
    const databases: Database[] = [];
    const sql = sqlString.trim();

    // 匹配完整的 CREATE TABLE 语句
    const tableRegex = /create\s+table\s+(\S+)\s*\(([\s\S]*?)\)\s*(?:comment\s+['"]([^'"]*)['"])?/gi;

    let match;
    while ((match = tableRegex.exec(sql)) !== null) {
      const tableName = match[1].replace(/`/g, '').trim();
      const fieldsBlock = match[2];
      const tableComment = match[3]?.trim() || '';

      const fields: Field[] = [];

      // 按换行分割字段定义
      const lines = fieldsBlock.split('\n');

      let currentField: Partial<Field> = {};

      for (const line of lines) {
        const trimmed = line.trim();

        // 跳过空行
        if (!trimmed) continue;

        // 跳过约束定义（索引、主键、唯一键等）
        if (trimmed.startsWith('primary key') ||
            trimmed.startsWith('unique') ||
            trimmed.startsWith('constraint') ||
            trimmed.startsWith('index ') ||
            trimmed.startsWith('key ') ||
            trimmed.startsWith('foreign') ||
            trimmed.startsWith('check') ||
            trimmed.startsWith('engine') ||
            trimmed.startsWith('default') ||
            trimmed.startsWith('comment') ||
            trimmed.startsWith('collate') ||
            trimmed.startsWith('row_format') ||
            trimmed.startsWith('auto_increment') ||
            trimmed.startsWith('engine') ||
            trimmed.startsWith('charset') ||
            trimmed.startsWith('empty')) {
          // 如果有累积的字段，保存它
          if (currentField.name) {
            fields.push({
              name: currentField.name,
              type: currentField.type || 'unknown',
              comment: currentField.comment || '',
            });
            currentField = {};
          }
          continue;
        }

        // 匹配字段定义: field_name TYPE ... comment 'xxx'
        // 支持格式: id int unsigned auto_increment primary key comment 'xxx'
        // 或: name varchar(20) default '' not null comment 'xxx'
        const fieldMatch = /^(\w+)\s+(\w+(?:\(\d+(?:,\s*\d+)?\))?)/.exec(trimmed);
        if (fieldMatch) {
          // 保存上一个字段
          if (currentField.name) {
            fields.push({
              name: currentField.name,
              type: currentField.type || 'unknown',
              comment: currentField.comment || '',
            });
          }

          currentField = {
            name: fieldMatch[1],
            type: fieldMatch[2],
          };

          // 检查是否有 comment
          const commentMatch = /comment\s+['"]([^'"]*)['"]/.exec(trimmed);
          if (commentMatch) {
            currentField.comment = commentMatch[1];
          }
        } else if (currentField.name) {
          // 检查当前行是否有 comment（字段定义跨多行）
          const commentMatch = /comment\s+['"]([^'"]*)['"]/.exec(trimmed);
          if (commentMatch) {
            currentField.comment = commentMatch[1];
          }
        }
      }

      // 保存最后一个字段
      if (currentField.name) {
        fields.push({
          name: currentField.name,
          type: currentField.type || 'unknown',
          comment: currentField.comment || '',
        });
      }

      if (fields.length > 0) {
        const table: Table = {
          name: tableName,
          comment: tableComment,
          tags: [],
          fields,
        };

        // 查找或创建默认数据库
        let dbName = 'default_db';
        const useDbMatch = /\buse\s+(\w+)\b/i.exec(sql);
        if (useDbMatch) {
          dbName = useDbMatch[1];
        }

        let db = databases.find(d => d.name === dbName);
        if (!db) {
          db = {
            name: dbName,
            comment: '',
            tables: [],
          };
          databases.push(db);
        }

        db.tables.push(table);
      }
    }

    if (databases.length === 0 || databases.every(db => db.tables.length === 0)) {
      return {
        success: false,
        databases: [],
        error: '未找到有效的 CREATE TABLE 语句',
      };
    }

    return { success: true, databases };
  } catch (error) {
    return {
      success: false,
      databases: [],
      error: error instanceof Error ? error.message : 'SQL 解析失败',
    };
  }
}

/**
 * 检测是否为 SQL 格式
 */
export function isSQLFormat(content: string): boolean {
  const trimmed = content.trim().toLowerCase();
  return trimmed.startsWith('create table') || /create\s+table\s+\w+/i.test(trimmed);
}
