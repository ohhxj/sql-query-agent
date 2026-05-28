import type { NumericTransformType } from '@/types';

export const NUMERIC_TRANSFORM_OPTIONS: Array<{
  value: NumericTransformType;
  label: string;
  shortLabel: string;
}> = [
  { value: 'NONE', label: '原值', shortLabel: '原值' },
  { value: 'DIVIDE_100', label: '除以100', shortLabel: '÷100' },
  { value: 'DIVIDE_1000', label: '除以1000', shortLabel: '÷1000' },
  { value: 'PERCENT_100', label: '百分比(÷100)', shortLabel: '%÷100' },
  { value: 'PERCENT_10000', label: '万分比(÷10000)', shortLabel: '%÷10000' },
];

export function getNumericTransformShortLabel(transform: NumericTransformType | undefined): string {
  return NUMERIC_TRANSFORM_OPTIONS.find((option) => option.value === (transform || 'NONE'))?.shortLabel || '原值';
}

export function getNumericTransformLabel(transform: NumericTransformType | undefined): string {
  return NUMERIC_TRANSFORM_OPTIONS.find((option) => option.value === (transform || 'NONE'))?.label || '原值';
}
