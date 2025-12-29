import { generateICS, getCalendarData } from '$lib/ics-parser';
import type { RequestHandler } from './$types';

const ICLOUD_CN_URL = 'https://calendars.icloud.com/holidays/cn_zh.ics';

export const GET: RequestHandler = async () => {
  try {
    const events = await getCalendarData(ICLOUD_CN_URL);
    const icsContent = generateICS(events, '中国节假日（增强版）');

    return new Response(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calendars.ics"',
        'Cache-Control': 'public, max-age=3600', // 缓存 1 小时
      },
    });
  } catch (error) {
    console.error('Failed to generate ICS:', error);
    return new Response('Failed to generate calendar', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
};
