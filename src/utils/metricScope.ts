import type { Field, MetricScopePreset } from '@/types';

export interface MetricScopeOption {
  value: MetricScopePreset;
  label: string;
  shortLabel: string;
  requiredFields: string[];
}

export const METRIC_SCOPE_OPTIONS: MetricScopeOption[] = [
  { value: 'ALL', label: '全部数据', shortLabel: '全部', requiredFields: [] },
  { value: 'VALID_ORDER', label: '有效订单', shortLabel: '有效', requiredFields: ['flow_point'] },
  { value: 'PAY_SUCCESS', label: '已支付', shortLabel: '支付', requiredFields: ['flow_point'] },
  { value: 'SETTLED', label: '已结算', shortLabel: '结算', requiredFields: ['flow_point'] },
  { value: 'ENTERED', label: '已入账', shortLabel: '入账', requiredFields: ['enter_status'] },
  { value: 'REFUND', label: '退款订单', shortLabel: '退款', requiredFields: ['flow_point'] },
  { value: 'INSTITUTION_ORDER', label: '团长订单', shortLabel: '团长', requiredFields: ['has_institution_order'] },
  { value: 'ONLINE_SETTLE', label: '线上结算', shortLabel: '线上', requiredFields: ['order_settle_type'] },
  { value: 'OFFLINE_SETTLE', label: '线下结算', shortLabel: '线下', requiredFields: ['order_settle_type'] },
];

export function getMetricScopeLabel(scope: MetricScopePreset | undefined): string {
  return METRIC_SCOPE_OPTIONS.find((option) => option.value === (scope || 'ALL'))?.label || '全部数据';
}

export function getMetricScopeShortLabel(scope: MetricScopePreset | undefined): string {
  return METRIC_SCOPE_OPTIONS.find((option) => option.value === (scope || 'ALL'))?.shortLabel || '全部';
}

export function getAvailableMetricScopes(fields: Field[]): MetricScopeOption[] {
  const fieldNames = new Set(fields.map((field) => field.name));

  return METRIC_SCOPE_OPTIONS.filter((option) =>
    option.requiredFields.every((fieldName) => fieldNames.has(fieldName))
  );
}
