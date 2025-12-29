import {
  type CalendarEvent,
  getCalendarData,
  groupEventsByYear,
} from '$lib/ics-parser';
import type { PageServerLoad } from './$types';

const ICLOUD_CN_URL = 'https://calendars.icloud.com/holidays/cn_zh.ics';

export const load: PageServerLoad = async () => {
  try {
    const events = await getCalendarData(ICLOUD_CN_URL);
    const eventsByYear = groupEventsByYear(events);

    return {
      events,
      eventsByYear,
      totalCount: events.length,
      error: null,
    };
  } catch (error) {
    console.error('Failed to load calendar data:', error);
    return {
      events: [] as CalendarEvent[],
      eventsByYear: {} as Record<number, CalendarEvent[]>,
      totalCount: 0,
      error:
        error instanceof Error ? error.message : 'Failed to load calendar data',
    };
  }
};
