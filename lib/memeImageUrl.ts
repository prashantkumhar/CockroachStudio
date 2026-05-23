/** Same-origin image URL — works for public or private Supabase storage buckets. */
export function memeImageApiPath(memeId: string): string {
  return `/api/memes/${memeId}/image`;
}

export function memeImageAbsoluteUrl(memeId: string, requestOrigin?: string): string {
  const base =
    requestOrigin ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}${memeImageApiPath(memeId)}`;
}
