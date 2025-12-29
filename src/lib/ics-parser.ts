/**
 * ICS 文件解析和生成工具
 */

import ICAL from 'ical.js';
import { cache } from './cache';
import { getExtraHolidaysForYears, type Holiday } from './extra-holidays';

export interface CalendarEvent {
  uid: string;
  summary: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (多日事件)
  description?: string;
  isHoliday?: boolean; // 是否是休假日
  isWorkday?: boolean; // 是否是调休上班日
  category?: string;
  source: 'icloud' | 'extra';
}

/**
 * 从 iCloud 获取 ICS 内容（带缓存）
 * @param url ICS 文件的 URL
 * @param ttl 缓存过期时间（毫秒），默认 12 小时
 */
export async function fetchICSFromURL(
  url: string,
  ttl = 12 * 3600000,
): Promise<string> {
  // 尝试从缓存获取
  const cacheKey = `ics:${url}`;
  const cached = cache.get<string>(cacheKey);

  if (cached) {
    console.log(`[Cache] Hit for ${url}`);
    return cached;
  }

  console.log(`[Cache] Miss for ${url}, fetching from server...`);

  // 缓存未命中，从服务器获取
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CalendarBot/1.0)',
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ICS: ${response.status} ${response.statusText}`,
    );
  }

  const content = await response.text();

  // 保存到缓存
  cache.set(cacheKey, content, ttl);
  console.log(`[Cache] Stored for ${url}, TTL: ${ttl / 3600000} hours`);

  return content;
}

/**
 * 解析 ICS 内容为事件列表
 */
export function parseICS(icsContent: string): CalendarEvent[] {
  const jcal = ICAL.parse(icsContent);
  const comp = new ICAL.Component(jcal);
  const vevents = comp.getAllSubcomponents('vevent');

  const events: CalendarEvent[] = [];

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);
    const summary = event.summary || '';
    const uid = event.uid || crypto.randomUUID();

    // 获取开始日期
    const dtstart = vevent.getFirstPropertyValue('dtstart');
    if (!dtstart) continue;

    const startDate = formatICALDate(dtstart);

    // 获取结束日期（如果有）
    const dtend = vevent.getFirstPropertyValue('dtend');
    const endDate = dtend ? formatICALDate(dtend) : undefined;

    // 检查是否是假期或调休
    const specialDay = vevent.getFirstPropertyValue('x-apple-special-day');
    const isHoliday =
      specialDay === 'WORK-HOLIDAY' || summary.includes('（休）');
    const isWorkday =
      specialDay === 'ALTERNATE-WORKDAY' || summary.includes('（班）');

    events.push({
      uid,
      summary,
      date: startDate,
      endDate,
      isHoliday,
      isWorkday,
      source: 'icloud',
    });
  }

  return events;
}

/**
 * 将多日事件拆分为单日事件
 */
function splitMultiDayEvent(event: CalendarEvent): CalendarEvent[] {
  if (!event.endDate || event.date === event.endDate) {
    // 单日事件，直接返回（移除 endDate）
    const { endDate, ...singleEvent } = event;
    return [singleEvent];
  }

  const events: CalendarEvent[] = [];
  const start = new Date(event.date);
  const end = new Date(event.endDate);

  // ICS 的 DTEND 是 exclusive 的，所以不包含结束日期那天
  const current = new Date(start);
  let dayIndex = 0;

  while (current < end) {
    const dateStr = formatDateString(current);
    events.push({
      ...event,
      uid: `${event.uid}-day${dayIndex}`,
      date: dateStr,
      endDate: undefined,
    });
    current.setDate(current.getDate() + 1);
    dayIndex++;
  }

  return events;
}

/**
 * 格式化 Date 对象为 YYYY-MM-DD 字符串
 */
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化 ICAL 日期为 YYYY-MM-DD
 */
function formatICALDate(date: unknown): string {
  if (typeof date === 'string') {
    // 处理纯字符串格式 YYYYMMDD
    if (date.length === 8) {
      return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    }
    return date;
  }

  // ICAL.Time 对象
  if (
    date &&
    typeof date === 'object' &&
    'year' in date &&
    'month' in date &&
    'day' in date
  ) {
    const icalDate = date as { year: number; month: number; day: number };
    const year = icalDate.year;
    const month = String(icalDate.month).padStart(2, '0');
    const day = String(icalDate.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 如果是其他类型，尝试转换为字符串
  return String(date);
}

/**
 * 将额外节假日转换为 CalendarEvent
 */
function holidayToEvent(holiday: Holiday): CalendarEvent {
  return {
    uid: `extra-${holiday.name}-${holiday.date}`,
    summary: holiday.name,
    date: holiday.date,
    description: holiday.description,
    category: holiday.category,
    source: 'extra',
  };
}

/**
 * 合并 iCloud 事件和额外节假日
 */
export function mergeEvents(
  icloudEvents: CalendarEvent[],
  startYear: number,
  endYear: number,
): CalendarEvent[] {
  const extraHolidays = getExtraHolidaysForYears(startYear, endYear);
  const extraEvents = extraHolidays.map(holidayToEvent);

  // 拆分多日事件为单日事件
  const splitIcloudEvents = icloudEvents.flatMap(splitMultiDayEvent);

  // 使用 Map 按日期+名称去重，iCloud 的优先
  const eventMap = new Map<string, CalendarEvent>();

  // 先添加额外节假日
  for (const event of extraEvents) {
    const key = `${event.date}-${event.summary}`;
    eventMap.set(key, event);
  }

  // 再添加 iCloud 事件，同名同日期的会覆盖
  for (const event of splitIcloudEvents) {
    // iCloud 事件使用日期作为主键，允许同一天多个事件
    const key = `${event.date}-${event.summary}`;
    eventMap.set(key, event);
  }

  // 按日期排序
  return Array.from(eventMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

/**
 * 生成 ICS 文件内容
 */
export function generateICS(
  events: CalendarEvent[],
  calendarName = '中国节假日',
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Holiday Calendar//CN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${calendarName}`,
    'X-APPLE-LANGUAGE:zh',
    'X-APPLE-REGION:CN',
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTAMP:${formatDateToICS(new Date())}`);
    lines.push(`DTSTART;VALUE=DATE:${event.date.replace(/-/g, '')}`);

    if (event.endDate) {
      lines.push(`DTEND;VALUE=DATE:${event.endDate.replace(/-/g, '')}`);
    }

    lines.push(`SUMMARY;LANGUAGE=zh_CN:${event.summary}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${event.description}`);
    }

    lines.push('CLASS:PUBLIC');
    lines.push('TRANSP:TRANSPARENT');

    if (event.isHoliday) {
      lines.push('X-APPLE-SPECIAL-DAY:WORK-HOLIDAY');
    } else if (event.isWorkday) {
      lines.push('X-APPLE-SPECIAL-DAY:ALTERNATE-WORKDAY');
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * 格式化日期为 ICS 时间戳格式
 */
function formatDateToICS(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const second = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

/**
 * 获取当前年份前后三年的年份范围
 */
export function getYearRange(): {
  startYear: number;
  endYear: number;
  years: number[];
} {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 1;
  const endYear = currentYear + 1;
  const years = [startYear, currentYear, endYear];
  return { startYear, endYear, years };
}

/**
 * 过滤事件，只保留指定年份范围内的事件
 */
export function filterEventsByYears(
  events: CalendarEvent[],
  years: number[],
): CalendarEvent[] {
  const yearSet = new Set(years);
  return events.filter((event) => {
    const year = Number.parseInt(event.date.slice(0, 4), 10);
    return yearSet.has(year);
  });
}

/**
 * 从 iCloud 获取并处理完整的日历数据（只返回当前年份前后三年）
 */
export async function getCalendarData(
  icloudUrl: string,
): Promise<CalendarEvent[]> {
  const icsContent = await fetchICSFromURL(icloudUrl);
  const icloudEvents = parseICS(icsContent);

  // 获取当前年份前后三年的范围
  const { startYear, endYear, years } = getYearRange();

  // 合并所有事件
  const allEvents = mergeEvents(icloudEvents, startYear, endYear);

  // 只返回三年内的事件
  return filterEventsByYears(allEvents, years);
}

/**
 * 按年份分组事件
 */
export function groupEventsByYear(
  events: CalendarEvent[],
): Record<number, CalendarEvent[]> {
  const grouped: Record<number, CalendarEvent[]> = {};

  for (const event of events) {
    const year = Number.parseInt(event.date.slice(0, 4), 10);
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(event);
  }

  return grouped;
}

/**
 * 按月份分组事件
 */
export function groupEventsByMonth(
  events: CalendarEvent[],
): Record<string, CalendarEvent[]> {
  const grouped: Record<string, CalendarEvent[]> = {};

  for (const event of events) {
    const yearMonth = event.date.slice(0, 7); // YYYY-MM
    if (!grouped[yearMonth]) {
      grouped[yearMonth] = [];
    }
    grouped[yearMonth].push(event);
  }

  return grouped;
}
