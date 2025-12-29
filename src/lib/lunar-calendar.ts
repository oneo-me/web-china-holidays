/**
 * 农历转公历工具
 * 使用 lunar-javascript 库进行农历转换
 */

import { Lunar } from 'lunar-javascript';

/**
 * 将农历日期转换为公历日期
 * @param lunarYear 农历年
 * @param lunarMonth 农历月（1-12）
 * @param lunarDay 农历日（1-30）
 * @returns 公历日期字符串 YYYY-MM-DD
 */
export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
): string {
  try {
    const lunar = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay);
    if (!lunar) {
      throw new Error(
        `Invalid lunar date: ${lunarYear}-${lunarMonth}-${lunarDay}`,
      );
    }

    const solar = lunar.getSolar();
    const year = solar.getYear();
    const month = String(solar.getMonth()).padStart(2, '0');
    const day = String(solar.getDay()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Failed to convert lunar to solar:', error);
    throw error;
  }
}

/**
 * 获取农历节日对应的公历日期
 * @param festival 节日标识
 * @param year 公历年份
 * @returns 公历日期字符串 YYYY-MM-DD
 */
export function getLunarFestivalDate(
  festival:
    | 'qixi'
    | 'laba'
    | 'xiaonian_north'
    | 'xiaonian_south'
    | 'longtaitou',
  year: number,
): string | null {
  try {
    // 农历节日配置
    const festivals = {
      qixi: { month: 7, day: 7 }, // 七夕 - 农历七月初七
      laba: { month: 12, day: 8 }, // 腊八 - 农历腊月初八
      xiaonian_north: { month: 12, day: 23 }, // 小年北方 - 农历腊月二十三
      xiaonian_south: { month: 12, day: 24 }, // 小年南方 - 农历腊月二十四
      longtaitou: { month: 2, day: 2 }, // 二月二 - 农历二月初二
    };

    const config = festivals[festival];
    if (!config) return null;

    // 对于腊月的节日，需要使用前一年的农历年份
    const lunarYear = config.month === 12 ? year - 1 : year;

    return lunarToSolar(lunarYear, config.month, config.day);
  } catch (error) {
    console.error(
      `Failed to get lunar festival date for ${festival} in ${year}:`,
      error,
    );
    return null;
  }
}

/**
 * 获取感恩节日期 (11月第四个星期四)
 */
export function getThanksgivingDate(year: number): string {
  // 11月1日
  const nov1 = new Date(year, 10, 1);
  // 找到11月第一个星期四
  let firstThursday = 1;
  const dayOfWeek = nov1.getDay();
  if (dayOfWeek <= 4) {
    firstThursday = 1 + (4 - dayOfWeek);
  } else {
    firstThursday = 1 + (11 - dayOfWeek);
  }
  // 第四个星期四
  const thanksgiving = firstThursday + 21;
  return `${year}-11-${thanksgiving.toString().padStart(2, '0')}`;
}
