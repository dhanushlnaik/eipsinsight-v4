import { redirect } from 'next/navigation';

// The standalone /dashboard view was retired; its data now lives on the home
// page and the featured hubs (/aa, /lucid). Redirect so old links and bookmarks
// still land somewhere useful. (/dashboard/watchlist remains its own route.)
export default function DashboardRedirect() {
  redirect('/');
}
