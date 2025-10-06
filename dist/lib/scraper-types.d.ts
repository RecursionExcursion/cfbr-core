export type ESPNGroups = {
    status: string;
    groups: Group[];
};
export type Group = {
    name: string;
    abbreviation: string;
    children: GroupChild[];
};
export type GroupChild = {
    name: string;
    teams: GroupTeams[];
};
export type GroupTeams = {
    id: string;
    slug: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    logos: TeamLogo[];
};
export type TeamLogo = {
    href: string;
    width: number;
    height: number;
    alt: string;
    lastUpdated: string;
};
export type ESPNSeason = {
    leagues: League[];
    events: SeasonEvent[];
};
export type League = {
    id: string;
    uid: string;
    name: string;
    abbreviation: string;
    slug: string;
    season: SeasonInfo;
    calender: SeasonCalendar[];
};
export type SeasonInfo = {
    year: number;
    startDate: string;
    endDate: string;
    displayName: string;
};
export type SeasonCalendar = {
    label: string;
    value: string;
    startDate: string;
    endDate: string;
    entries: CalenderEntry[];
};
export type CalenderEntry = {
    label: string;
    altLabel: string;
    detail: string;
    value: string;
    startDate: string;
    endDate: string;
};
export type SeasonEvent = {
    id: string;
    uid: string;
    date: string;
    name: string;
    shortName: string;
    season: SeasonEventInfo;
    week: SeasonEventWeek;
    link: SeasonEventLink[];
    competitions: SeasonCompetition[];
};
export type SeasonEventInfo = {
    year: number;
};
export type SeasonEventWeek = {
    number: number;
};
export type SeasonEventLink = {
    href: string;
    text: string;
    shortText: string;
};
export type SeasonCompetition = {
    id: string;
    uid: string;
    date: string;
    competitors: Competitor[];
};
export type Competitor = {
    id: string;
    uid: string;
    homeAway: string;
    winner: boolean;
    team: CompetitorTeam;
};
export type CompetitorTeam = {
    id: string;
    uid: string;
    location: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    color: string;
    altColor: string;
    conferenceId: string;
};
export type SeasonEventStatus = {
    clock: number;
    displayClock: string;
    period: number;
    type: EventStatusType;
};
export type EventStatusType = {
    id: string;
    name: string;
    state: string;
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
    altDetail: string;
};
export type ESPNTeams = {
    sports: ESPNTeamsSport[];
};
export type ESPNTeamsSport = {
    id: string;
    leagues: ESPNTeamsSportsLeagues[];
};
export type ESPNTeamsSportsLeagues = {
    id: string;
    teams: ESPNTeamsSportsLeagueTeam[];
};
export type ESPNTeamsSportsLeagueTeam = {
    team: {
        id: string;
    };
};
export type ESPNTeamWrapper = {
    team: ESPNCfbTeam;
};
export type ESPNCfbTeam = {
    id: string;
    uid: string;
    slug: string;
    location: string;
    name: string;
    nickname: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    color: string;
    altColor: string;
    isActive: boolean;
    logos: ETeamLogo[];
    groups: TeamGroups;
    links: ESPNLink[];
    standingSummary: string;
};
export type ETeamLogo = {
    href: string;
    width: number;
    height: number;
    alt: string;
    rel: string[];
    lastUpdated: string;
};
export type TeamGroups = {
    id: string;
    parent: {
        id: string;
    };
    isConference: boolean;
};
export type ESPNCfbGame = {
    boxscore: GameBoxScore;
    header: GameHeader;
};
export type GameHeader = {
    id: string;
    uid: string;
    season: {
        year: number;
        type: number;
    };
    competitions: HeaderCompetitions[];
    links: ESPNLink[];
    week: number;
};
export type HeaderCompetitions = {
    id: string;
    Competitors: HeaderCompetitor[];
};
export type HeaderCompetitor = {
    id: string;
    homeAway: string;
    winner: boolean;
    score: string;
};
export type GameBoxScore = {
    teams: Team[];
};
export type Team = {
    team: BoxScoreTeam;
    statistics: BoxScoreTeamStat[];
    displayOrder: number;
    homeAway: string;
};
export type BoxScoreTeam = {
    id: string;
};
export type BoxScoreTeamStat = {
    name: string;
    displayValue: string;
    label: string;
};
export type ESPNLink = {
    href: string;
    text: string;
    shortText: string;
    rel: string[];
};
