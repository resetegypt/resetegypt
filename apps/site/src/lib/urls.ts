/**
 * URLs publiques du groupe Reset Egypt.
 *
 * BOOKING_URL est lu depuis NEXT_PUBLIC_BOOKING_URL au build (Next.js inline
 * les vars NEXT_PUBLIC_* au bundling), avec fallback sur le domaine prod. Ça
 * permet de tester la préview Vercel avec une URL différente (branch preview
 * → book-branch.reset-egypt.com) sans hardcoder le domaine dans 11 fichiers.
 *
 * Convention : PAS de trailing slash. Les appels de site ajoutent le path
 * relatif (`${BOOKING_URL}` seul = home du booking).
 */
export const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL?.replace(/\/$/, '') ?? 'https://book.reset-egypt.com';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://reset-egypt.com';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'https://api.reset-egypt.com';

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contact@reset-egypt.com';
