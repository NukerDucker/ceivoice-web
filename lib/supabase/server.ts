/**
 * Server-side Supabase client
 *
 * Use this in Server Components, Server Actions, and Route Handlers.
 * For Client Components, use client.ts instead.
 *
 * TODO: Replace with your actual Supabase project URL and anon key,
 *       or swap for your own auth provider SDK.
 */

// import { createServerClient } from '@supabase/ssr';
// import { cookies } from 'next/headers';
//
// export async function createClient() {
//   const cookieStore = await cookies();
//
//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() { return cookieStore.getAll(); },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) =>
//             cookieStore.set(name, value, options)
//           );
//         },
//       },
//     }
//   );
// }

export {};
