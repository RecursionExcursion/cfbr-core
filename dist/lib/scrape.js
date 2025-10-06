const espnBase = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
const espnGroups = "/groups";
const espnSeason = "/scoreboard"; //dates=2024 or dates=20240921
const espnTeams = "/teams"; //</teamid>
const espnGame = "/summary"; //?event=<eventId>
export async function scrape(year) {
    const szn = await getZeroDay(year);
    if (!szn)
        return;
    const dateRanges = getSeasonDateRanges(szn);
    if (!dateRanges)
        return;
    const foo = collectSeasonDates(dateRanges.startDate, dateRanges.endDate);
}
function routeBuilders() {
    return {
        season(date) {
            return `${espnBase}${espnSeason}?dates=${date}`;
        },
    };
}
export function collectSeasonDates(startDate, endDate) {
    const tc = new Map();
    let currDate = startDate;
    const ms = endDate.getTime() - startDate.getTime();
    const days = Math.round(ms / 86400000);
    console.log({ startDate, endDate });
    console.log(ms);
    console.log(days);
    const dates = [];
    for (let i = 1; currDate <= endDate; i++) {
        const y = String(currDate.getFullYear());
        const m = String(currDate.getMonth()).padStart(2, "0");
        const d = String(currDate.getDate()).padStart(2, "0");
        const formattedDate = y + m + d;
        console.log({ formattedDate });
        dates.push(formattedDate);
        currDate.setDate(currDate.getDate() + 1);
    }
    console.log({ dates });
}
export async function getZeroDay(year) {
    const query = `${year}0801`;
    const req = routeBuilders().season(query);
    const res = await fetch(req);
    if (!res.ok)
        return;
    const pl = await res.json();
    return pl;
}
export function getSeasonDateRanges(szn) {
    if (szn.leagues.length === 0) {
        return undefined;
    }
    const { startDate, endDate } = szn.leagues[0].season;
    return {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
    };
}
