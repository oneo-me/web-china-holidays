/**
 * Type declarations for lunar-javascript
 */

declare module 'lunar-javascript' {
  export class Solar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
  }

  export class Lunar {
    static fromYmd(
      year: number,
      month: number,
      day: number,
      isLeapMonth?: boolean,
    ): Lunar | null;
    getSolar(): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    isLeap(): boolean;
  }
}
