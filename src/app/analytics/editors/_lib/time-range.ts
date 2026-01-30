export type TimeRangePreset = 'today' | 'this_week' | 'this_month' | 'this_year' | 'all_time' | 'custom';

export function getTimeRangeBounds(preset: TimeRangePreset, customFrom?: string, customTo?: string): { from: string | undefined; to: string | undefined; label: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 19).replace('T', ' ');
  let from: string | undefined;
  let label: string;

  switch (preset) {
    case 'today':
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      from = startOfDay.toISOString().slice(0, 19).replace('T', ' ');
      label = 'Today';
      break;
    case 'this_week':
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      from = weekAgo.toISOString().slice(0, 19).replace('T', ' ');
      label = 'This week';
      break;
    case 'this_month':
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 19).replace('T', ' ');
      label = 'This month';
      break;
    case 'this_year':
      from = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 19).replace('T', ' ');
      label = 'This year';
      break;
    case 'all_time':
      from = undefined;
      label = 'All time';
      break;
    case 'custom': {
      from = customFrom ? (customFrom.length === 7 ? `${customFrom}-01T00:00:00` : customFrom) : undefined;
      const toVal = customTo ? (customTo.length === 7 ? `${customTo}-01T23:59:59` : customTo) : to;
      label = customFrom && customTo ? `Custom (${customFrom} – ${customTo})` : 'Custom';
      return { from, to: customTo ? toVal : to, label };
    }
    default:
      from = undefined;
      label = 'All time';
  }
  return { from, to, label };
}

export const TIME_RANGE_OPTIONS: { value: TimeRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'this_year', label: 'This year' },
  { value: 'all_time', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
];
