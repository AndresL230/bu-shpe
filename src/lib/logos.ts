/**
 * Logo resolution for companies without an in-repo logo file: try the
 * token-free unavatar service by domain (fallback=false → 404 when it has
 * nothing), then the brand favicon, then the caller shows the plain name.
 * Shared by the /careers grid and LogoMarquee.
 */
export const logoSrc = (c: { domain?: string; logo?: string }) =>
  c.logo ?? (c.domain ? `https://unavatar.io/${c.domain}?fallback=false` : "");

export const faviconSrc = (domain?: string) =>
  domain ? `https://www.google.com/s2/favicons?sz=128&domain=${domain}` : "";
