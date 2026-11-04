/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  SITE_URL: string;
  EMAIL_FROM: string;
  EMAIL_REPLY_TO: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  RESEND_API_KEY: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    /** Set by middleware on /admin/* and /api/admin/* when a valid session exists. */
    admin?: { email: string; name: string | null; picture: string | null; role: "owner" | "editor" };
  }
}
