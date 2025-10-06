import { describe, it } from "node:test";
import { assert } from "console";
import {
  collectSeasonDates,
  getSeasonDateRanges,
  getZeroDay,
} from "../lib/scrape.js";

describe("Scraper", async () => {
  const szn = await getZeroDay(2025);
  it("Zero Day", () => {
    assert(!!szn, true);
  });

  it("Get Season Date Ranges", () => {
    if (!szn) {
      throw Error("Season is undefined");
    }
    const dr = getSeasonDateRanges(szn);
    assert(!!dr?.startDate, true);
    assert(!!dr?.endDate, true);
    if (!dr) {
      throw Error("Date range is undefined");
    }

    collectSeasonDates(dr?.startDate, dr?.endDate);
  });
});
