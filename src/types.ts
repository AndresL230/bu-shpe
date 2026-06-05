export type SocialPlatform = "linkedin" | "instagram" | "facebook" | "shpe";

export interface SiteMeta {
  name: string;
  shortName: string;
  tagline: string;
  mission: string;
  contactEmail: string;
  facultyAdvisorEmail: string;
  region: string;
  currentBoardTerm?: string;
  calendarEmbedUrl: string;
  donateUrl: string;
  sponsorshipPacketUrl: string;
  constitutionUrl: string;
  socials: Record<SocialPlatform, string>;
}

export interface BoardMember {
  name: string;
  role: string;
  major: string;
  year: string;
  hometown: string;
  bio: string;
  photo: string; // path under /assets/board/
}

export type EventCategory =
  | "Professional"
  | "Cultural"
  | "Social"
  | "Study Night"
  | "Volunteering"
  | "Conference";

export interface EventItem {
  title: string;
  date: string;   // ISO yyyy-mm or yyyy-mm-dd
  category: EventCategory;
  description: string;
  photo: string;  // path under /assets/events/
  featured?: boolean;
}

export interface Sponsor {
  name: string;
  logo: string;   // path under /assets/sponsors/
  url?: string;
  tier?: "Platinum" | "Gold" | "Silver" | "Bronze";
}

export interface Conference {
  year: number;
  city: string;
  region?: string;
  description: string;
  photos: string[];                                // paths under /assets/conferences/
  headcount?: number;                              // TODO-confirm from chapter records
  outcomes?: string[];                             // TODO-confirm — bullet outcomes
  quote?: { text: string; attribution: string };  // TODO-confirm — delegate quote
}

export interface VolunteeringProgram {
  name: string;
  description: string;
  photos: string[]; // paths under /assets/volunteering/
}

export interface SupportStat {
  value: string;
  label: string;
}

export interface GivingImpact {
  amount: string;
  outcome: string;
}

export interface EmployerGroup {
  industry: string;
  companies: { name: string; domain?: string; logo?: string }[];
}

export interface KeyDate {
  date: string;   // ISO yyyy-mm-dd
  label: string;
  note?: string;
}

export interface Convention {
  year: number;
  name: string;            // "SHPE National Convention 2026"
  theme: string;           // "STEM for the BOLD"
  city: string;            // "Indianapolis, IN"
  venue: string;           // "Indiana Convention Center"
  startDate: string;       // ISO yyyy-mm-dd
  endDate: string;         // ISO yyyy-mm-dd
  countdownTarget: string; // ISO datetime, e.g. "2026-10-28T09:00:00-05:00"
  scaleStats: SupportStat[];        // reuse {value,label}
  keyDates: KeyDate[];
  costFunding: { heading: string; detail: string }[];
  eligibility: string[];
  faq: { q: string; a: string }[];
}

export interface CompetitionTrack {
  name: string;
  blurb: string;
  format: string;   // team size / time commitment — TODO-confirm specifics
  prize?: string;   // TODO-confirm
}

export interface CompetitionsData {
  tracks: CompetitionTrack[];
  record: { stat: string; label: string }[];  // trophy stat block — TODO-confirm
}
