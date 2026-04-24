import type { FieldMapping } from '@/types';

const MAPPING_SEGMENT_PATTERN = /(?:^|[\s,，;；、|｜:：])(\d+)\s*(?:[-:：]\s*|\s*)([^\s,，;；、|｜]+)/g;

export function extractMappingsFromComment(
  comment: string,
  tableId: string,
  fieldName: string
): FieldMapping | null {
  if (!comment) {
    return null;
  }

  const mappings: Record<string, string> = {};

  for (const match of comment.matchAll(MAPPING_SEGMENT_PATTERN)) {
    const key = match[1]?.trim();
    const value = match[2]?.trim();

    if (key && value) {
      mappings[key] = value;
    }
  }

  if (Object.keys(mappings).length === 0) {
    return null;
  }

  return {
    tableId,
    fieldName,
    mappings,
  };
}

export function stripMappingsFromComment(comment: string): string {
  if (!comment) {
    return '';
  }

  const stripped = comment
    .replace(MAPPING_SEGMENT_PATTERN, ' ')
    .replace(/[,，]?\s*枚举值\s*[:：]?\s*[^\s,，;；]+(?:[、,，]\s*[^\s,，;；]+)*/gi, ' ')
    .replace(/[|｜]/g, ' ')
    .replace(/[,，]\s*枚举值\s*[:：]?/gi, ' ')
    .replace(/\b枚举值\b\s*[:：]?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return stripped.replace(/[\s,，:：|｜]+$/g, '').trim();
}
