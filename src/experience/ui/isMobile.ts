import { readable } from 'svelte/store';

const MOBILE_QUERY = '(max-width: 900px)';

export const isMobile = readable(false, (set) => {
  if (typeof window === 'undefined') return;

  const query = window.matchMedia(MOBILE_QUERY);
  const sync = () => set(query.matches);

  sync();
  query.addEventListener('change', sync);
  return () => query.removeEventListener('change', sync);
});
