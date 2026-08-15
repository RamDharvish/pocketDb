import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);

export function formatDate(dateString: string, format: string = 'DD MMM YYYY'): string {
  return dayjs(dateString).format(format);
}

export function formatTime(timeString?: string): string {
  if (!timeString) return dayjs().format('hh:mm A');
  return dayjs(timeString, 'HH:mm').format('hh:mm A');
}

export function getCurrentDateISO(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function getCurrentTime24(): string {
  return dayjs().format('HH:mm');
}

/**
 * Standard date range utility.
 * Note: Week start is Monday -> Sunday per isoWeek specification.
 */
export function getDateRange(rangeType: 'today' | 'yesterday' | 'week' | 'month' | 'year') {
  const now = dayjs();
  let start = now;
  let end = now;

  switch (rangeType) {
    case 'today':
      start = now.startOf('day');
      end = now.endOf('day');
      break;
    case 'yesterday':
      start = now.subtract(1, 'day').startOf('day');
      end = now.subtract(1, 'day').endOf('day');
      break;
    case 'week':
      // Monday -> Sunday using isoWeek
      start = now.startOf('isoWeek');
      end = now.endOf('isoWeek');
      break;
    case 'month':
      start = now.startOf('month');
      end = now.endOf('month');
      break;
    case 'year':
      start = now.startOf('year');
      end = now.endOf('year');
      break;
  }

  return {
    startISO: start.format('YYYY-MM-DD'),
    endISO: end.format('YYYY-MM-DD'),
    label: `${start.format('DD MMM')} - ${end.format('DD MMM YYYY')}`,
  };
}

export function getTodayRange() {
  return getDateRange('today');
}

export function getCurrentWeekRange() {
  return getDateRange('week');
}

export function getCurrentMonthRange() {
  return getDateRange('month');
}

export function getCurrentYearRange() {
  return getDateRange('year');
}

export function formatGroupDate(dateString: string): string {
  const target = dayjs(dateString);
  const today = dayjs().startOf('day');
  const yesterday = dayjs().subtract(1, 'day').startOf('day');

  if (target.isSame(today, 'day')) {
    return `Today, ${target.format('DD MMM')}`;
  }
  if (target.isSame(yesterday, 'day')) {
    return `Yesterday, ${target.format('DD MMM')}`;
  }
  return target.format('DD MMM YYYY, dddd');
}

export function isDateInRange(dateISO: string, startISO: string, endISO: string): boolean {
  const target = dayjs(dateISO);
  return target.isBetween(dayjs(startISO).startOf('day'), dayjs(endISO).endOf('day'), null, '[]');
}

export function extractDateAndTime(txDateStr: string) {
  const d = dayjs(txDateStr);
  return {
    date: d.format('YYYY-MM-DD'),
    time: d.format('HH:mm'),
    formattedDate: d.format('DD MMM YYYY'),
    formattedTime: d.format('hh:mm A'),
  };
}
