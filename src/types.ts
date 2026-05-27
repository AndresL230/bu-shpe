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
  photos: string[]; // paths under /assets/conferences/
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
  companies: { name: string; logo?: string }[];
}
