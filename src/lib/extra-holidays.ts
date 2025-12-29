/**
 * 额外节假日数据
 * 包括西方节日、网络节日、职业节日和传统节日
 */

import { getLunarFestivalDate, getThanksgivingDate } from './lunar-calendar';

export interface Holiday {
  name: string;
  date: string; // YYYY-MM-DD 格式
  category: 'western' | 'internet' | 'professional' | 'traditional';
  description?: string;
}

/**
 * 获取固定日期的节日
 */
function getFixedHolidays(year: number): Holiday[] {
  return [
    // 西方节日
    {
      name: '情人节',
      date: `${year}-02-14`,
      category: 'western',
      description: '西方情人节',
    },
    {
      name: '白色情人节',
      date: `${year}-03-14`,
      category: 'western',
      description: '日韩传统回礼日',
    },
    {
      name: '愚人节',
      date: `${year}-04-01`,
      category: 'western',
      description: '整蛊玩笑日',
    },
    {
      name: '万圣节',
      date: `${year}-10-31`,
      category: 'western',
      description: '西方鬼节',
    },
    {
      name: '平安夜',
      date: `${year}-12-24`,
      category: 'western',
      description: '圣诞节前夕',
    },
    {
      name: '圣诞节',
      date: `${year}-12-25`,
      category: 'western',
      description: '西方圣诞节',
    },

    // 网络节日
    {
      name: '520',
      date: `${year}-05-20`,
      category: 'internet',
      description: '"我爱你"谐音日',
    },
    {
      name: '双11购物节',
      date: `${year}-11-11`,
      category: 'internet',
      description: '光棍节/购物狂欢节',
    },
    {
      name: '双12购物节',
      date: `${year}-12-12`,
      category: 'internet',
      description: '年终购物节',
    },

    // 职业/群体节日
    {
      name: '妇女节',
      date: `${year}-03-08`,
      category: 'professional',
      description: '国际妇女节',
    },
    {
      name: '青年节',
      date: `${year}-05-04`,
      category: 'professional',
      description: '五四青年节',
    },
    {
      name: '儿童节',
      date: `${year}-06-01`,
      category: 'professional',
      description: '国际儿童节',
    },
    {
      name: '教师节',
      date: `${year}-09-10`,
      category: 'professional',
      description: '中国教师节',
    },
  ];
}

/**
 * 获取浮动日期的节日 (如感恩节)
 */
function getFloatingHolidays(year: number): Holiday[] {
  return [
    {
      name: '感恩节',
      date: getThanksgivingDate(year),
      category: 'western',
      description: '美国感恩节',
    },
  ];
}

/**
 * 获取农历节日
 */
function getLunarHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // 七夕
  const qixiDate = getLunarFestivalDate('qixi', year);
  if (qixiDate) {
    holidays.push({
      name: '七夕节',
      date: qixiDate,
      category: 'traditional',
      description: '中国情人节',
    });
  }

  // 腊八节
  const labaDate = getLunarFestivalDate('laba', year);
  if (labaDate) {
    holidays.push({
      name: '腊八节',
      date: labaDate,
      category: 'traditional',
      description: '农历腊月初八',
    });
  }

  // 小年北方
  const xiaonianNorthDate = getLunarFestivalDate('xiaonian_north', year);
  if (xiaonianNorthDate) {
    holidays.push({
      name: '小年（北方）',
      date: xiaonianNorthDate,
      category: 'traditional',
      description: '农历腊月二十三',
    });
  }

  // 小年南方
  const xiaonianSouthDate = getLunarFestivalDate('xiaonian_south', year);
  if (xiaonianSouthDate) {
    holidays.push({
      name: '小年（南方）',
      date: xiaonianSouthDate,
      category: 'traditional',
      description: '农历腊月二十四',
    });
  }

  // 二月二龙抬头
  const longtaitouDate = getLunarFestivalDate('longtaitou', year);
  if (longtaitouDate) {
    holidays.push({
      name: '龙抬头',
      date: longtaitouDate,
      category: 'traditional',
      description: '农历二月初二',
    });
  }

  return holidays;
}

/**
 * 获取指定年份的所有额外节假日
 */
export function getExtraHolidays(year: number): Holiday[] {
  return [
    ...getFixedHolidays(year),
    ...getFloatingHolidays(year),
    ...getLunarHolidays(year),
  ];
}

/**
 * 获取多年的所有额外节假日
 */
export function getExtraHolidaysForYears(
  startYear: number,
  endYear: number,
): Holiday[] {
  const holidays: Holiday[] = [];
  for (let year = startYear; year <= endYear; year++) {
    holidays.push(...getExtraHolidays(year));
  }
  return holidays;
}

/**
 * 节日分类名称映射
 */
export const categoryNames: Record<Holiday['category'], string> = {
  western: '西方节日',
  internet: '网络节日',
  professional: '职业节日',
  traditional: '传统节日',
};
