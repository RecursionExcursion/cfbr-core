import { ESPNSeason } from "./scraper-types";
export declare function scrape(year: number): Promise<void>;
export declare function collectSeasonDates(startDate: Date, endDate: Date): void;
export declare function getZeroDay(year: number): Promise<ESPNSeason | undefined>;
export declare function getSeasonDateRanges(szn: ESPNSeason): {
    startDate: Date;
    endDate: Date;
} | undefined;
